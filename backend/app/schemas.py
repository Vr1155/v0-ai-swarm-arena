from pydantic import BaseModel, Field
from typing import Optional, List, Dict, Any

class ChatTextRequest(BaseModel):
    session_id: str
    message: str

class ChatTextResponse(BaseModel):
    session_id: str
    reply: str
    requirements_state: Dict[str, Any]

class VoiceChatResponse(BaseModel):
    session_id: str
    transcript: str
    reply: str
    audio_b64: Optional[str]
    requirements_state: Dict[str, Any]

class FinalizeDocRequest(BaseModel):
    session_id: str

class FinalizeDocResponse(BaseModel):
    session_id: str
    requirements: Dict[str, Any]
    markdown: str


class SwarmPlanRequest(BaseModel):
    session_id: Optional[str] = None
    brief_override: Optional[Dict[str, Any]] = None
    rounds: Optional[int] = Field(default=None, ge=2, le=4, description="Number of debate rounds")


class SwarmPlanResponse(BaseModel):
    team_plan: Dict[str, Any]
    debate_history: List[Dict[str, Any]]
    requirements: Dict[str, Any]
    markdown: str
    execution_plan: Dict[str, Any]
    execution_markdown: str


class TeamPlanResponse(BaseModel):
    team_plan: Dict[str, Any]


class PlanExportRequest(BaseModel):
    session_id: str


class PlanExportResponse(BaseModel):
    ok: bool
    path: str

# Evolving requirements state schema (kept flexible)
# The agent will fill these incrementally.
REQUIREMENTS_TEMPLATE = {
    "project": {
        "title": None,
        "summary": None,
        "goals": [],
        "non_goals": [],
        "stakeholders": [],
        "timeline": {"start": None, "milestones": [], "deadline": None}
    },
    "product": {
        "target_users": [],
        "personas": [],
        "features": [],
        "user_journeys": [],
        "ux_notes": []
    },
    "technical": {
        "platform": None,  # web, mobile, both
        "stack_preferences": [],
        "integrations": [],
        "data_model_hints": [],
        "ai_requirements": [],
        "security": {"authn": None, "authz": None, "compliance": []},
        "scalability": {"traffic_tiers": [], "SLOs": []},
        "hosting": {"cloud": None, "region": None}
    },
    "constraints": {
        "budget": None,
        "team": {"size": None, "roles": []},
        "dependencies": [],
        "risks": []
    },
    "acceptance": {
        "success_metrics": [],
        "acceptance_criteria": [],
        "deliverables": []
    },
    "notes": []
}
