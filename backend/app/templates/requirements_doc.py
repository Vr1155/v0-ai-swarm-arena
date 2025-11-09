from typing import Dict, Any, List

def _line(title): return f"\n---\n\n# {title}\n"

def _format_conversation(history: List[Dict[str, str]]) -> str:
    if not history:
        return ""
    transcript = _line("Conversation Transcript")
    for turn in history:
        role = turn.get("role", "").lower()
        speaker = "User" if role == "user" else "Assistant"
        content = turn.get("content", "").strip()
        if content:
            transcript += f"**{speaker}:** {content}\n\n"
    return transcript

def render_requirements_markdown(req: Dict[str, Any], history: List[Dict[str, str]] = None) -> str:
    p = req.get("project", {})
    prod = req.get("product", {})
    tech = req.get("technical", {})
    cons = req.get("constraints", {})
    acc = req.get("acceptance", {})
    notes = req.get("notes", [])

    md = "# Software Requirements Document\n"
    md += _format_conversation(history or [])
    md += _line("Project Overview")
    md += f"**Title:** {p.get('title') or ''}\n\n"
    md += f"**Summary:** {p.get('summary') or ''}\n\n"
    md += f"**Goals:**\n" + "".join([f"- {g}\n" for g in p.get("goals", [])]) + "\n"
    if p.get("non_goals"):
        md += f"**Non-Goals:**\n" + "".join([f"- {g}\n" for g in p.get("non_goals", [])]) + "\n"
    if p.get("stakeholders"):
        md += f"**Stakeholders:**\n" + "".join([f"- {s}\n" for s in p.get("stakeholders", [])]) + "\n"
    if p.get("timeline"):
        md += f"**Timeline:** {p['timeline']}\n"

    md += _line("Product")
    if prod.get("target_users"):
        md += f"**Target Users:**\n" + "".join([f"- {u}\n" for u in prod.get("target_users", [])]) + "\n"
    if prod.get("personas"):
        md += f"**Personas:**\n" + "".join([f"- {u}\n" for u in prod.get("personas", [])]) + "\n"
    if prod.get("features"):
        md += f"**Key Features:**\n" + "".join([f"- {f}\n" for f in prod.get("features", [])]) + "\n"
    if prod.get("user_journeys"):
        md += f"**User Journeys:**\n" + "".join([f"- {j}\n" for j in prod.get("user_journeys", [])]) + "\n"
    if prod.get("ux_notes"):
        md += f"**UX Notes:**\n" + "".join([f"- {j}\n" for j in prod.get("ux_notes", [])]) + "\n"

    md += _line("Technical")
    if tech.get("platform"): md += f"**Platform:** {tech.get('platform')}\n"
    if tech.get("stack_preferences"):
        md += f"**Stack Preferences:**\n" + "".join([f"- {s}\n" for s in tech.get("stack_preferences", [])]) + "\n"
    if tech.get("integrations"):
        md += f"**Integrations:**\n" + "".join([f"- {s}\n" for s in tech.get("integrations", [])]) + "\n"
    if tech.get("data_model_hints"):
        md += f"**Data Model Hints:**\n" + "".join([f"- {s}\n" for s in tech.get("data_model_hints", [])]) + "\n"
    if tech.get("ai_requirements"):
        md += f"**AI Requirements:**\n" + "".join([f"- {s}\n" for s in tech.get("ai_requirements", [])]) + "\n"
    if tech.get("security"):
        md += f"**Security:** {tech.get('security')}\n"
    if tech.get("scalability"):
        md += f"**Scalability & SLOs:** {tech.get('scalability')}\n"
    if tech.get("hosting"):
        md += f"**Hosting:** {tech.get('hosting')}\n"

    md += _line("Constraints")
    if cons.get("budget") is not None:
        md += f"**Budget:** {cons.get('budget')}\n"
    if cons.get("team"):
        md += f"**Team:** {cons.get('team')}\n"
    if cons.get("dependencies"):
        md += f"**Dependencies:**\n" + "".join([f"- {d}\n" for d in cons.get("dependencies", [])]) + "\n"
    if cons.get("risks"):
        md += f"**Risks:**\n" + "".join([f"- {r}\n" for r in cons.get("risks", [])]) + "\n"

    md += _line("Acceptance & Deliverables")
    if acc.get("success_metrics"):
        md += f"**Success Metrics:**\n" + "".join([f"- {m}\n" for m in acc.get("success_metrics", [])]) + "\n"
    if acc.get("acceptance_criteria"):
        md += f"**Acceptance Criteria:**\n" + "".join([f"- {m}\n" for m in acc.get('acceptance_criteria', [])]) + "\n"
    if acc.get("deliverables"):
        md += f"**Deliverables:**\n" + "".join([f"- {m}\n" for m in acc.get('deliverables', [])]) + "\n"

    if notes:
        md += _line("Notes")
        md += "".join([f"- {n}\n" for n in notes]) + "\n"

    return md
