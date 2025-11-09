import asyncio
import json
import logging
import shutil
import textwrap
import traceback
from datetime import datetime
from pathlib import Path
from typing import Dict, Any, Optional, List
from uuid import uuid4
import os
from asyncio.subprocess import PIPE

from app.services.llm_adapter import LLM
from app.templates.requirements_doc import render_requirements_markdown

logger = logging.getLogger(__name__)

PROJECT_PLANNER_PROMPT = """You are a senior full-stack engineer.
Given the requirements document, pick the most appropriate stack and produce a concise plan.
Return STRICT JSON:
{
  "project_name": "short title",
  "summary": "one line summary",
  "stack": {
    "frontend": "framework/library",
    "backend": "framework/library"
  },
  "files": [
    {
      "path": "relative/path/from/root",
      "type": "frontend|backend|shared",
      "language": "e.g., typescript, python, html",
      "purpose": "what belongs in this file"
    }
  ],
  "instructions": {
    "setup": ["ordered steps to install deps"],
    "run": ["commands to start the project"]
  }
}
Rules:
- Include at least one backend entry point and one frontend entry point.
- Keep file list under 18 items.
- Match the user's stack preferences when stated; otherwise choose sensible defaults.
- Do not include binaries or node_modules—only source files.
- If the user only needs frontend, still add a tiny backend status endpoint so the bundle is full-stack.
"""

FILE_WRITER_SYSTEM_PROMPT = """You generate a SINGLE source file for a project.
Return ONLY the raw file contents (no markdown fences, no commentary)."""


class BuildManager:
    def __init__(
        self,
        session_store,
        artifacts_dir: Optional[Path] = None,
        provider_override: Optional[str] = None,
        api_key_override: Optional[str] = None,
        model_override: Optional[str] = None,
    ):
        self.session_store = session_store
        self.llm = LLM(
            provider_override=provider_override,
            api_key_override=api_key_override,
            model_override=model_override,
        )
        default_artifact_root = Path(os.getenv("BUILD_ARTIFACTS_DIR", "/tmp/intent-builds"))
        self.artifacts_dir = Path(artifacts_dir) if artifacts_dir else default_artifact_root
        self.artifacts_dir.mkdir(parents=True, exist_ok=True)
        self.builds: Dict[str, Dict[str, Any]] = {}
        self.model_override = model_override

    def start_build(self, session_id: str, preferences: Optional[Dict[str, Any]] = None) -> str:
        build_id = str(uuid4())
        self.builds[build_id] = {
            "build_id": build_id,
            "session_id": session_id,
            "status": "queued",
            "message": "Queued for generation",
            "created_at": datetime.utcnow().isoformat() + "Z",
            "preferences": preferences or {},
            "download_path": None,
            "error": None,
            "plan": None,
            "validation_reports": [],
        }
        asyncio.create_task(self._run_build(build_id))
        return build_id

    def get_status(self, build_id: str) -> Optional[Dict[str, Any]]:
        return self.builds.get(build_id)

    async def _run_build(self, build_id: str):
        record = self.builds.get(build_id)
        if not record:
            return
        try:
            record["status"] = "planning"
            record["message"] = "Collecting requirements"
            validation_reports: List[Dict[str, Any]] = []

            session_id = record["session_id"]
            state = self.session_store.get(session_id)
            requirements_md = self._get_requirements_markdown(state)

            record["status"] = "planning"
            record["message"] = "Drafting project plan"
            plan = await self._plan_project(requirements_md, record["preferences"])
            record["plan"] = plan

            if plan and self._plan_has_minimum(plan):
                record["status"] = "generating"
                record["message"] = "Generating source files"
                spec = await self._generate_from_plan(plan, requirements_md)
                if not spec.get("files"):
                    spec = self._fallback_spec(requirements_md)
            else:
                spec = self._fallback_spec(requirements_md)

            workspace = self.artifacts_dir / f"{build_id}_workspace"
            if workspace.exists():
                shutil.rmtree(workspace)
            workspace.mkdir(parents=True, exist_ok=True)

            self._write_files(workspace, spec.get("files", []))
            self._ensure_readme(workspace, spec, requirements_md)

            record["status"] = "validating"
            record["message"] = "Running quick validations"
            validation_reports = await self._run_validations(workspace)

            record["status"] = "packaging"
            record["message"] = "Bundling project"
            zip_base = self.artifacts_dir / build_id
            zip_path = shutil.make_archive(str(zip_base), "zip", root_dir=workspace)

            record["status"] = "complete"
            record["message"] = "Build ready for download"
            record["download_path"] = zip_path
            record["stack"] = spec.get("stack", {})
            record["project_name"] = spec.get("project_name")
            record["error"] = None
            record["validation_reports"] = validation_reports
        except Exception as exc:
            record["status"] = "failed"
            record["message"] = f"Build failed: {exc}"
            record["download_path"] = None
            record["error"] = traceback.format_exc()
            logger.exception("Build %s failed", build_id)

    async def _plan_project(self, requirements_md: str, preferences: Dict[str, Any]) -> Optional[Dict[str, Any]]:
        prompt = PROJECT_PLANNER_PROMPT + "\n\n" + requirements_md
        if preferences:
            prompt += "\n\nUser preferences/hints:\n" + json.dumps(preferences, indent=2)
        plan = await self.llm.extract_json(
            prompt=prompt,
            conversation=[],
            model=self.model_override,
            temperature=0.15,
        )
        return plan

    def _plan_has_minimum(self, plan: Optional[Dict[str, Any]]) -> bool:
        if not plan:
            return False
        files = plan.get("files") or []
        has_frontend = any((f.get("type") == "frontend" or (f.get("path") or "").startswith("frontend/")) for f in files)
        has_backend = any((f.get("type") == "backend" or (f.get("path") or "").startswith("backend/")) for f in files)
        return bool(has_frontend and has_backend and files)

    async def _generate_from_plan(self, plan: Dict[str, Any], requirements_md: str) -> Dict[str, Any]:
        stack = plan.get("stack") or {}
        instructions = plan.get("instructions") or {}
        files_meta = plan.get("files") or []
        generated_files: List[Dict[str, str]] = []
        for meta in files_meta:
            path = meta.get("path")
            if not path:
                continue
            try:
                content = await self._generate_single_file(
                    path=path,
                    meta=meta,
                    stack=stack,
                    requirements_md=requirements_md,
                    instructions=instructions,
                )
                if content:
                    generated_files.append({"path": path, "content": content})
                    logger.info("Generated %s", path)
            except Exception as exc:
                logger.warning("Failed to generate %s: %s", path, exc)
        spec = {
            "project_name": plan.get("project_name") or plan.get("summary") or "Generated Project",
            "stack": stack,
            "files": generated_files,
            "instructions": instructions,
        }
        return spec

    async def _generate_single_file(self, path: str, meta: Dict[str, Any], stack: Dict[str, Any], requirements_md: str, instructions: Dict[str, Any]) -> Optional[str]:
        purpose = meta.get("purpose") or "Implement the required functionality."
        language = meta.get("language") or "plain text"
        file_type = meta.get("type") or "shared"
        system = FILE_WRITER_SYSTEM_PROMPT
        user = textwrap.dedent(f"""
        Project stack:
        Frontend: {stack.get('frontend', 'unspecified')}
        Backend: {stack.get('backend', 'unspecified')}

        Additional instructions:
        Setup: {instructions.get('setup', [])}
        Run: {instructions.get('run', [])}

        File to generate: {path}
        File type: {file_type}
        Language/style: {language}
        Purpose: {purpose}

        Requirements document:
        {requirements_md}

        Output only the complete file contents for {path}.
        """).strip()
        content = await self.llm.chat(
            system=system,
            messages=[{"role": "user", "content": user}],
            model=self.model_override,
            temperature=0.3,
        )
        return content

    async def _run_validations(self, workspace: Path) -> List[Dict[str, Any]]:
        reports: List[Dict[str, Any]] = []
        backend_dir = workspace / "backend"
        if backend_dir.exists():
            reports.append(await self._run_command(["python", "-m", "compileall", "."], cwd=backend_dir))
        frontend_dir = workspace / "frontend"
        package_json = frontend_dir / "package.json"
        if package_json.exists():
            reports.append(await self._run_command(["npm", "install", "--ignore-scripts"], cwd=frontend_dir))
            reports.append(await self._run_command(["npm", "run", "build"], cwd=frontend_dir))
        return reports

    async def _run_command(self, cmd: List[str], cwd: Path) -> Dict[str, Any]:
        try:
            proc = await asyncio.create_subprocess_exec(
                *cmd,
                cwd=str(cwd),
                stdout=PIPE,
                stderr=PIPE,
            )
            stdout, stderr = await proc.communicate()
            return {
                "command": " ".join(cmd),
                "cwd": str(cwd),
                "returncode": proc.returncode,
                "stdout": stdout.decode("utf-8", errors="ignore"),
                "stderr": stderr.decode("utf-8", errors="ignore"),
            }
        except FileNotFoundError as exc:
            return {
                "command": " ".join(cmd),
                "cwd": str(cwd),
                "returncode": -1,
                "stdout": "",
                "stderr": f"{exc}",
            }

    def _get_requirements_markdown(self, state: Dict[str, Any]) -> str:
        uploaded = state.get("uploaded_requirements")
        if uploaded and uploaded.get("content"):
            return uploaded["content"]
        requirements = state.get("requirements_state", {})
        history = state.get("history", [])
        return render_requirements_markdown(requirements, history)

    def _write_files(self, workspace: Path, files: List[Dict[str, str]]):
        for file in files:
            path = file.get("path")
            content = file.get("content", "")
            if not path:
                continue
            target = (workspace / path).resolve()
            # Prevent directory traversal
            try:
                target.relative_to(workspace.resolve())
            except ValueError:
                continue
            target.parent.mkdir(parents=True, exist_ok=True)
            target.write_text(content, encoding="utf-8")

    def _ensure_readme(self, workspace: Path, spec: Dict[str, Any], requirements_md: str):
        readme_path = workspace / "README.md"
        if readme_path.exists():
            return
        stack = spec.get("stack") or {}
        instructions = spec.get("instructions") or {}
        summary = spec.get("project_name") or "Generated Project"
        setup_steps = "\n".join(f"1. {step}" for step in instructions.get("setup", [])) or "1. Follow standard install steps."
        run_steps = "\n".join(f"- {cmd}" for cmd in instructions.get("run", [])) or "- Start backend and frontend servers."
        readme = textwrap.dedent(f"""\
# {summary}

**Stack**
- Frontend: {stack.get('frontend', 'Custom web UI')}
- Backend: {stack.get('backend', 'FastAPI service')}

## Setup
{setup_steps}

## Run
{run_steps}

## Requirements Snapshot
{requirements_md}
""")
        readme_path.write_text(readme, encoding="utf-8")

    def _fallback_spec(self, requirements_md: str) -> Dict[str, Any]:
        safe_requirements = requirements_md.replace("```", "'''")
        backend_main = textwrap.dedent(
            f"""\
            from fastapi import FastAPI
            from fastapi.middleware.cors import CORSMiddleware

            app = FastAPI(title="Generated Project API")
            app.add_middleware(
                CORSMiddleware,
                allow_origins=["*"],
                allow_headers=["*"],
                allow_methods=["*"],
            )

            REQUIREMENTS = {safe_requirements!r}


            @app.get("/api/requirements")
            def get_requirements():
                return {{"requirements_md": REQUIREMENTS}}


            @app.get("/api/health")
            def health():
                return {{"ok": True}}
            """
        )
        frontend_html_lines = [
            "<!DOCTYPE html>",
            "<html lang=\"en\">",
            "<head>",
            "    <meta charset=\"UTF-8\" />",
            "    <meta name=\"viewport\" content=\"width=device-width, initial-scale=1.0\" />",
            "    <title>Generated Project UI</title>",
            "    <style>",
            "        body { font-family: system-ui, sans-serif; margin: 2rem; background: #f7f7fb; }",
            "        pre { background: #111827; color: #e5e7eb; padding: 1rem; border-radius: 8px; overflow:auto; }",
            "    </style>",
            "</head>",
            "<body>",
            "    <h1>Welcome to your generated project</h1>",
            "    <p>This UI fetches the latest requirements from the backend API.</p>",
            "    <button id=\"refresh\">Load Requirements</button>",
            "    <pre id=\"requirements\">Click \"Load Requirements\" to fetch details.</pre>",
            "    <script>",
            "        const btn = document.getElementById('refresh');",
            "        const pre = document.getElementById('requirements');",
            "        btn.addEventListener('click', async () => {",
            "            pre.textContent = 'Loading...';",
            "            try {",
            "                const res = await fetch('http://localhost:8000/api/requirements');",
            "                const data = await res.json();",
            "                pre.textContent = data.requirements_md;",
            "            } catch (err) {",
            "                pre.textContent = 'Failed to load requirements: ' + err.message;",
            "            }",
            "        });",
            "    </script>",
            "</body>",
            "</html>",
        ]
        frontend_html = "\n".join(frontend_html_lines)
        setup_instructions = {
            "setup": [
                "cd backend && python -m venv .venv && source .venv/bin/activate",
                "pip install -r requirements.txt",
                "cd ../frontend && npm install (optional if you later upgrade the UI)",
            ],
            "run": [
                "cd backend && uvicorn main:app --reload --port 8000",
                "Serve frontend/index.html with any static server (e.g., `python -m http.server 4173`)",
            ],
        }
        return {
            "project_name": "Generated Web App",
            "stack": {"frontend": "Vanilla HTML/JS", "backend": "FastAPI"},
            "files": [
                {"path": "backend/main.py", "content": backend_main},
                {"path": "backend/requirements.txt", "content": "fastapi\nuvicorn\n"},
                {"path": "frontend/index.html", "content": frontend_html},
            ],
            "instructions": setup_instructions,
        }
