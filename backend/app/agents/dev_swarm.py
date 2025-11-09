import asyncio
import copy
import json
from dataclasses import dataclass
from typing import Any, Awaitable, Callable, Dict, List, Optional, Tuple, TypedDict

from langgraph.graph import END, START, StateGraph

from app.schemas import REQUIREMENTS_TEMPLATE
from app.services.llm_adapter import LLM
from app.templates.requirements_doc import render_requirements_markdown
from app.templates.execution_plan import render_execution_markdown


TEAM_PROMPT = """You are the Team Designer for the AI Swarm Arena.
Given a structured project brief (JSON), design the optimal planning crew.
Always respond with STRICT minified JSON matching this schema:
{
  "rounds": int,               # >= 2, number of debate rounds
  "shared_objective": str,     # one sentence summary of what the team must produce
  "agents": [
     {
        "name": str,           # e.g. "Product Strategist"
        "persona": str,        # short voice guiding their reasoning style
        "focus": [str],        # ordered bullet list of responsibilities
        "model_hint": str      # model family best suited (Claude, GPT-4o-mini, Gemini, DeepSeek)
     }
  ]
}

Rules:
- Pick 3-5 agents depending on project complexity.
- Include at least one architect/system role and one implementation role.
- rounds defaults to 2 unless the brief is complex (commerce, multi-platform, AI workflows) then 3.
- Tailor personas and focus bullets to the supplied brief.
- shared_objective must reference the desired technical requirements document.
"""

AGENT_EXTRACTION_PROMPT = """You convert individual agent notes into JSON patches for a software requirements schema.
Return STRICT JSON only with the fields you can update for this schema:
{schema}
"""

AGGREGATOR_PROMPT = """You are the Aggregator agent. Combine the shared brief and the full multi-agent debate to produce an updated technical requirements JSON using this schema:
{schema}
Focus on technical feasibility, architecture, APIs, data, and testing. Do not repeat conversation logs.
"""

EXECUTION_PLAN_PROMPT = """You are the Build Orchestrator. Turn the following context into an actionable execution plan the delivery team can follow.
Context:
- Project Brief: {brief_summary}
- Requirements JSON: {requirements_json}
- Debate Highlights (chronological):\n{debate_log}

Return STRICT minified JSON shaped like:
{{
  "overview": "",
  "tech_stack": {{"frontend": "", "backend": "", "database": "", "infrastructure": "", "ai": "", "tooling": []}},
  "phases": [
      {{
          "name": "",
          "objective": "",
          "tasks": [{{"title": "", "details": "", "owner": "", "definition_of_done": ""}}],
          "dependencies": []
      }}
  ],
  "risks": [{{"item": "", "mitigation": ""}}],
  "handoff_instructions": []
}}

Rules:
- Ensure tasks cover frontend, backend, QA, and deployment when relevant.
- Tech stack must reference concrete frameworks, services, or SDKs.
- Write definition_of_done so a single engineer can verify completion.
"""


class AgentState(TypedDict, total=False):
    brief: Dict[str, Any]
    history: List[Dict[str, Any]]
    requirements: Dict[str, Any]
    round: int
    max_rounds: int
    team_plan: Dict[str, Any]


def _slugify(text: str) -> str:
    return "-".join(
        "".join(ch.lower() for ch in word if ch.isalnum())
        for word in text.split()
        if word
    ).strip("-" ) or "agent"


def _summarize_brief(brief: Dict[str, Any]) -> str:
    project = brief.get("project", {})
    product = brief.get("product", {})
    tech = brief.get("technical", {})
    lines = []
    if project.get("title"):
        lines.append(f"Title: {project['title']}")
    if project.get("summary"):
        lines.append(f"Summary: {project['summary']}")
    if project.get("goals"):
        lines.append("Goals: " + "; ".join(project["goals"]))
    if product.get("features"):
        lines.append("Key Features: " + "; ".join(product["features"]))
    if tech.get("stack_preferences"):
        lines.append("Stack Hints: " + "; ".join(tech["stack_preferences"]))
    if tech.get("ai_requirements"):
        lines.append("AI Needs: " + "; ".join(tech["ai_requirements"]))
    if tech.get("integrations"):
        lines.append("Integrations: " + "; ".join(tech["integrations"]))
    if not lines:
        return "General greenfield MVP build."
    return " \n".join(lines)


@dataclass
class TeamDesigner:
    llm: LLM

    async def design_team(self, brief: Dict[str, Any], rounds_override: Optional[int] = None) -> Dict[str, Any]:
        payload = {"brief": brief, "rounds_hint": rounds_override}
        plan = await self.llm.extract_json(
            TEAM_PROMPT,
            conversation=[{"role": "user", "content": json.dumps(payload)}]
        )
        if not plan:
            plan = self._fallback_plan(brief)
        plan["rounds"] = max(2, plan.get("rounds", rounds_override or 2))
        if rounds_override:
            plan["rounds"] = max(2, rounds_override)
        plan.setdefault("shared_objective", "Deliver a precise technical requirements plan for the build.")
        agents = []
        for agent in plan.get("agents", []):
            if not agent.get("name"):
                continue
            normalized = {
                "id": _slugify(agent["name"]),
                "name": agent["name"],
                "persona": agent.get("persona") or "Product-minded technical expert.",
                "focus": agent.get("focus") or ["Contribute actionable insights."],
                "model_hint": agent.get("model_hint") or "openai/gpt-4o-mini",
            }
            agents.append(normalized)
        if not agents:
            agents = self._fallback_plan(brief)["agents"]
        plan["agents"] = agents
        return plan

    def _fallback_plan(self, brief: Dict[str, Any]) -> Dict[str, Any]:
        summary = _summarize_brief(brief)
        return {
            "rounds": 2,
            "shared_objective": "Produce a validated technical requirements document for the described build.",
            "context": summary,
            "agents": [
                {
                    "id": "product-strategist",
                    "name": "Product Strategist",
                    "persona": "Clarifies goals, users, and scope to anchor engineering decisions.",
                    "focus": [
                        "Translate user goals into crisp success metrics",
                        "Flag scope creep or missing requirements"
                    ],
                    "model_hint": "anthropic/claude-3.5-sonnet"
                },
                {
                    "id": "solution-architect",
                    "name": "Solution Architect",
                    "persona": "Systems thinker who maps services, data flow, and integration contracts.",
                    "focus": [
                        "Define system components and responsibilities",
                        "Highlight data/storage choices and trade-offs"
                    ],
                    "model_hint": "openai/gpt-4o-mini"
                },
                {
                    "id": "frontend-lead",
                    "name": "Frontend Lead",
                    "persona": "Next.js expert focused on user journeys and component strategy.",
                    "focus": [
                        "Outline UX states, routing, and component breakdown",
                        "Document client-side data and integration needs"
                    ],
                    "model_hint": "google/gemini-1.5-pro"
                },
                {
                    "id": "backend-lead",
                    "name": "Backend & Data Lead",
                    "persona": "API-first engineer covering FastAPI services, auth, and persistence.",
                    "focus": [
                        "Sketch API surface, auth, and workflow orchestration",
                        "Propose DB schema, background jobs, and observability"
                    ],
                    "model_hint": "deepseek/deepseek-r1"
                }
            ]
        }


class AgentRuntime:
    def __init__(self, llm: LLM):
        self.llm = llm

    async def run(self, team_plan: Dict[str, Any], brief: Dict[str, Any], rounds_override: Optional[int] = None) -> Dict[str, Any]:
        state_graph = StateGraph(AgentState)
        state_graph.add_node("round_router", self._noop)
        state_graph.add_conditional_edges(
            "round_router",
            lambda state: "done" if state["round"] >= state["max_rounds"] else "more",
            {"done": "aggregator", "more": "agent_round"}
        )
        state_graph.add_node("agent_round", self._agent_round)
        state_graph.add_edge("agent_round", "round_router")
        state_graph.add_node("aggregator", self._aggregate)
        state_graph.add_edge("aggregator", END)
        state_graph.add_edge(START, "round_router")

        compiled = state_graph.compile()
        max_rounds = max(2, rounds_override or team_plan.get("rounds", 2))
        initial_state: AgentState = {
            "brief": brief,
            "history": [],
            "requirements": copy.deepcopy(REQUIREMENTS_TEMPLATE),
            "round": 0,
            "max_rounds": max_rounds,
            "team_plan": team_plan,
        }
        return await compiled.ainvoke(initial_state)

    async def run_stream(
        self,
        team_plan: Dict[str, Any],
        brief: Dict[str, Any],
        send_event: Callable[[Dict[str, Any]], Awaitable[None]],
        rounds_override: Optional[int] = None,
    ) -> Dict[str, Any]:
        state: AgentState = {
            "brief": brief,
            "history": [],
            "requirements": copy.deepcopy(REQUIREMENTS_TEMPLATE),
            "round": 0,
            "max_rounds": max(2, rounds_override or team_plan.get("rounds", 2)),
            "team_plan": team_plan,
        }
        while state["round"] < state["max_rounds"]:
            updates, new_messages = await self._execute_round(state)
            state.update(updates)
            for message in new_messages:
                await send_event({"type": "agent_message", "payload": message})
            await send_event({"type": "round_complete", "payload": {"round": state["round"]}})
        final_state = await self._aggregate(state)
        state.update(final_state)
        return state

    async def _agent_round(self, state: AgentState) -> Dict[str, Any]:
        updates, _ = await self._execute_round(state)
        return updates

    async def _execute_round(self, state: AgentState) -> Tuple[Dict[str, Any], List[Dict[str, Any]]]:
        round_idx = state["round"]
        team_plan = state["team_plan"]
        brief_summary = _summarize_brief(state["brief"])
        shared_obj = team_plan.get("shared_objective", "Produce the technical requirements.")
        tasks = [
            self._run_agent(agent, brief_summary, shared_obj, round_idx, state)
            for agent in team_plan.get("agents", [])
        ]
        results = await asyncio.gather(*tasks)
        history = state["history"][:]
        requirements = copy.deepcopy(state["requirements"])
        new_messages = []
        for res in results:
            history.append(res["message"])
            new_messages.append(res["message"])
            self._merge(requirements, res.get("requirements") or {})
        return {
            "history": history,
            "requirements": requirements,
            "round": round_idx + 1,
        }, new_messages

    async def _aggregate(self, state: AgentState) -> Dict[str, Any]:
        payload = {
            "brief": state["brief"],
            "history": state["history"],
            "current": state["requirements"],
        }
        requirements = await self.llm.extract_json(
            AGGREGATOR_PROMPT.format(schema=REQUIREMENTS_TEMPLATE),
            conversation=[{"role": "user", "content": json.dumps(payload)}]
        ) or state["requirements"]
        markdown = render_requirements_markdown(requirements, history=state["history"])
        return {"requirements": requirements, "markdown": markdown}

    async def _run_agent(
        self,
        agent: Dict[str, Any],
        brief_summary: str,
        shared_obj: str,
        round_idx: int,
        state: AgentState,
    ) -> Dict[str, Any]:
        focus = "\n- ".join(agent.get("focus", []))
        prior = state["history"][-4:]
        transcript = "\n".join(f"{m.get('role')}: {m.get('content')}" for m in prior) or "No prior responses this round."
        user_prompt = (
            f"Round {round_idx + 1} of {state['max_rounds']} for the AI Swarm Arena planning session.\n"
            f"Shared Objective: {shared_obj}.\n"
            f"Project Brief:\n{brief_summary}\n\n"
            f"Your Focus Areas:\n- {focus}\n\n"
            f"Recent Messages:\n{transcript}\n\n"
            "Guidelines:\n"
            "1. Provide 3-4 bullet insights and concrete recommendations.\n"
            "2. Identify risks or dependencies if applicable.\n"
            "3. Specify any API endpoints, data fields, or stack choices relevant to your focus.\n"
            "4. Close with a short handoff suggestion for the next agent."
        )
        reply = await self.llm.chat(
            system=(
                f"You are {agent['name']} - {agent.get('persona','an expert')} who contributes to a collaborative technical planning session. "
                "Stay concise (<=200 words) yet specific."
            ),
            messages=[{"role": "user", "content": user_prompt}]
        )
        extraction_payload = {
            "agent": agent["name"],
            "note": reply,
            "brief": brief_summary,
        }
        structured = await self.llm.extract_json(
            AGENT_EXTRACTION_PROMPT.format(schema=REQUIREMENTS_TEMPLATE),
            conversation=[{"role": "user", "content": json.dumps(extraction_payload)}]
        ) or {}
        return {
            "message": {
                "role": agent["name"],
                "content": reply,
                "round": round_idx + 1,
            },
            "requirements": structured,
        }

    def _merge(self, base: Dict[str, Any], updates: Dict[str, Any]):
        for key, value in updates.items():
            if isinstance(value, dict):
                node = base.setdefault(key, {})
                if isinstance(node, dict):
                    self._merge(node, value)
                else:
                    base[key] = value
            elif isinstance(value, list):
                node = base.setdefault(key, [])
                if isinstance(node, list):
                    base[key] = self._merge_list(node, value)
                else:
                    base[key] = value
            else:
                base[key] = value

    def _merge_list(self, existing: List[Any], incoming: List[Any]) -> List[Any]:
        seen = set()
        merged = []
        for item in existing + incoming:
            key = json.dumps(item, sort_keys=True) if isinstance(item, (dict, list)) else str(item)
            if key in seen:
                continue
            seen.add(key)
            merged.append(item)
        return merged

    def _noop(self, state: AgentState) -> Dict[str, Any]:
        # LangGraph nodes must emit at least one field; passthrough current round.
        return {"round": state.get("round", 0)}


class SwarmProjectBuilder:
    def __init__(self):
        self.llm = LLM()
        self.team_designer = TeamDesigner(self.llm)
        self.runtime = AgentRuntime(self.llm)

    async def plan_project(self, brief: Dict[str, Any], rounds: Optional[int] = None) -> Dict[str, Any]:
        result = await self._run_core(brief, rounds=rounds)
        return result

    async def plan_project_stream(
        self,
        brief: Dict[str, Any],
        send_event: Callable[[Dict[str, Any]], Awaitable[None]],
        rounds: Optional[int] = None,
    ) -> Dict[str, Any]:
        if not brief:
            raise ValueError("Project brief is required to run the swarm planner.")
        team_plan = await self.team_designer.design_team(brief, rounds_override=rounds)
        await send_event({"type": "team_plan", "payload": team_plan})
        runtime_state = await self.runtime.run_stream(team_plan, brief, send_event, rounds_override=rounds)
        result = await self._build_outputs(team_plan, brief, runtime_state)
        await send_event({
            "type": "final_plan",
            "payload": {
                "requirements": result["requirements"],
                "requirements_markdown": result["markdown"],
                "execution_plan": result["execution_plan"],
                "execution_markdown": result["execution_markdown"],
            }
        })
        return result

    async def _run_core(self, brief: Dict[str, Any], rounds: Optional[int] = None) -> Dict[str, Any]:
        if not brief:
            raise ValueError("Project brief is required to run the swarm planner.")
        team_plan = await self.team_designer.design_team(brief, rounds_override=rounds)
        runtime_state = await self.runtime.run(team_plan, brief, rounds_override=rounds)
        return await self._build_outputs(team_plan, brief, runtime_state)

    async def _build_outputs(self, team_plan: Dict[str, Any], brief: Dict[str, Any], runtime_state: Dict[str, Any]) -> Dict[str, Any]:
        requirements = runtime_state.get("requirements", {})
        md = runtime_state.get("markdown", "")
        history = runtime_state.get("history", [])
        execution_plan, execution_md = await self._execution_plan(team_plan, brief, requirements, history)
        return {
            "team_plan": team_plan,
            "debate_history": history,
            "requirements": requirements,
            "markdown": md,
            "execution_plan": execution_plan,
            "execution_markdown": execution_md,
        }

    async def _execution_plan(
        self,
        team_plan: Dict[str, Any],
        brief: Dict[str, Any],
        requirements: Dict[str, Any],
        history: List[Dict[str, Any]],
    ) -> Tuple[Dict[str, Any], str]:
        brief_summary = _summarize_brief(brief)
        debate_log = "\n".join(f"- Round {m.get('round', '?')}: {m['role']} — {m['content']}" for m in history)
        payload = {
            "team": team_plan,
            "brief_summary": brief_summary,
            "requirements": requirements,
        }
        plan = await self.llm.extract_json(
            EXECUTION_PLAN_PROMPT.format(
                brief_summary=brief_summary,
                requirements_json=json.dumps(requirements),
                debate_log=debate_log or "No debate captured."
            ),
            conversation=[{"role": "user", "content": json.dumps(payload)}]
        ) or {
            "overview": "High-level plan unavailable.",
            "tech_stack": {},
            "phases": [],
            "risks": [],
            "handoff_instructions": [],
        }
        plan_md = render_execution_markdown(plan)
        return plan, plan_md
