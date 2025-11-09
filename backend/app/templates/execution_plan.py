from typing import Dict, Any, List


def _list(items: List[str]) -> str:
    if not items:
        return ""
    return "".join(f"- {item}\n" for item in items)


def render_execution_markdown(plan: Dict[str, Any]) -> str:
    md = "# Execution Plan\n"
    md += f"\n## Overview\n{plan.get('overview','No overview provided.')}\n"

    tech = plan.get("tech_stack", {}) or {}
    md += "\n## Recommended Tech Stack\n"
    for key in ["frontend", "backend", "database", "infrastructure", "ai"]:
        value = tech.get(key)
        if value:
            md += f"- **{key.title()}:** {value}\n"
    tooling = tech.get("tooling") or []
    if tooling:
        md += "- **Tooling:** " + ", ".join(tooling) + "\n"

    md += "\n## Phases\n"
    for phase in plan.get("phases", []):
        md += f"\n### {phase.get('name','Phase')}\n"
        if phase.get("objective"):
            md += f"**Objective:** {phase['objective']}\n"
        tasks = phase.get("tasks") or []
        if tasks:
            md += "**Tasks:**\n"
            for task in tasks:
                md += f"- {task.get('title','Task')}: {task.get('details','')} (Owner: {task.get('owner','TBD')}, DoD: {task.get('definition_of_done','')})\n"
        deps = phase.get("dependencies") or []
        if deps:
            md += "**Dependencies:**\n" + _list(deps)

    risks = plan.get("risks") or []
    if risks:
        md += "\n## Risks & Mitigations\n"
        for risk in risks:
            md += f"- {risk.get('item','Risk')}: {risk.get('mitigation','Mitigation TBD')}\n"

    handoff = plan.get("handoff_instructions") or []
    if handoff:
        md += "\n## Handoff Instructions\n"
        md += _list(handoff)

    return md
