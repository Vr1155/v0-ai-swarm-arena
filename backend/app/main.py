from pathlib import Path
from copy import deepcopy
from typing import Dict, Any, Optional, Tuple

from fastapi import FastAPI, UploadFile, File, Query, Body, HTTPException, WebSocket, WebSocketDisconnect
from fastapi.middleware.cors import CORSMiddleware
from fastapi.responses import HTMLResponse
from app.services.state import SessionStore
from app.agents.intent_manager import IntentManager
from app.agents.dev_swarm import SwarmProjectBuilder
from app.services.tts_eleven import speak_text
# from app.services.stt_whisper import transcribe_audio
from app.services.stt_eleven import transcribe_audio
from app.schemas import (
    ChatTextRequest,
    ChatTextResponse,
    VoiceChatResponse,
    FinalizeDocRequest,
    FinalizeDocResponse,
    SwarmPlanRequest,
    SwarmPlanResponse,
    REQUIREMENTS_TEMPLATE,
)
from app.templates.requirements_doc import render_requirements_markdown

app = FastAPI(title="Intent Manager (Voice + Chat)")

app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

store = SessionStore()
agent = IntentManager(session_store=store)
swarm_builder = SwarmProjectBuilder()
FRONTEND_INDEX = Path(__file__).resolve().parent / "frontend" / "index.html"
INITIAL_GREETING = "Hello! I am your product creation assistant. How may I help you?"
DEFAULT_VOICE_ID = "vBKc2FfBKJfcZNyEt1n6"

@app.get("/", response_class=HTMLResponse)
def serve_frontend():
    return FRONTEND_INDEX.read_text(encoding="utf-8")

@app.post("/session/start")
def start_session(payload: dict = Body(...)):
    session_id = payload.get("session_id", "default")
    seed = payload.get("seed") or {}
    history = seed.setdefault("history", [])
    if not history:
        history.append({"role": "assistant", "content": INITIAL_GREETING})
    seed.setdefault("requirements_state", deepcopy(REQUIREMENTS_TEMPLATE))
    store.reset(session_id, seed)
    initial_audio = speak_text(INITIAL_GREETING, voice_id=DEFAULT_VOICE_ID)
    return {
        "ok": True,
        "session_id": session_id,
        "state": store.get(session_id),
        "initial_reply": history[0]["content"],
        "initial_audio_b64": initial_audio,
    }

@app.post("/chat/text", response_model=ChatTextResponse)
async def chat_text(req: ChatTextRequest):
    state = store.get(req.session_id)
    reply, new_state = await agent.handle_user_message(req.session_id, req.message)
    return ChatTextResponse(
        session_id=req.session_id,
        reply=reply,
        requirements_state=new_state["requirements_state"]
    )

@app.post("/chat/voice", response_model=VoiceChatResponse)
async def chat_voice(
    session_id: str = Query(...),
    audio: UploadFile = File(...)
):
    # 1) STT
    transcript = await transcribe_audio(audio)
    # 2) Agent turn
    reply, new_state = await agent.handle_user_message(session_id, transcript)
    audio_b64 = speak_text(reply, voice_id=DEFAULT_VOICE_ID)
    return VoiceChatResponse(
        session_id=session_id,
        transcript=transcript,
        reply=reply,
        audio_b64=audio_b64,
        requirements_state=new_state["requirements_state"]
    )

@app.post("/doc/finalize", response_model=FinalizeDocResponse)
async def finalize_doc(req: FinalizeDocRequest):
    state = store.get(req.session_id)
    requirements = state.get("requirements_state", {})
    md = render_requirements_markdown(
        requirements,
        history=state.get("history", []),
    )
    return FinalizeDocResponse(session_id=req.session_id, requirements=requirements, markdown=md)

def _resolve_brief(
    session_id: Optional[str],
    brief_override: Optional[Dict[str, Any]]
) -> Tuple[Optional[Dict[str, Any]], Optional[Dict[str, Any]]]:
    session_state = None
    brief = None
    if session_id:
        session_state = store.get(session_id)
        brief = brief_override or session_state.get("requirements_state")
    else:
        brief = brief_override
    return brief, session_state


@app.post("/projects/tech-plan", response_model=SwarmPlanResponse)
async def generate_technical_plan(req: SwarmPlanRequest):
    brief, session_state = _resolve_brief(req.session_id, req.brief_override)
    if not brief:
        raise HTTPException(status_code=400, detail="Project brief missing. Provide session_id or brief_override.")

    result = await swarm_builder.plan_project(brief, rounds=req.rounds)
    if session_state is not None and req.session_id:
        session_state.setdefault("tech_specs", {})["latest"] = result
        store.set(req.session_id, session_state)
    return SwarmPlanResponse(**result)


@app.websocket("/ws/projects/tech-plan")
async def ws_technical_plan(websocket: WebSocket):
    await websocket.accept()
    try:
        init = await websocket.receive_json()
        session_id = init.get("session_id")
        rounds = init.get("rounds")
        brief_override = init.get("brief_override")
        brief, session_state = _resolve_brief(session_id, brief_override)
        if not brief:
            await websocket.send_json({"type": "error", "payload": "Project brief missing."})
            await websocket.close(code=4000)
            return

        async def emit(event: Dict[str, Any]):
            await websocket.send_json(event)

        result = await swarm_builder.plan_project_stream(brief, emit, rounds=rounds)
        if session_state is not None and session_id:
            session_state.setdefault("tech_specs", {})["latest"] = result
            store.set(session_id, session_state)
        await websocket.close()
    except WebSocketDisconnect:
        return
    except Exception as exc:  # pragma: no cover - surfaced to client
        try:
            await websocket.send_json({"type": "error", "payload": str(exc)})
        except Exception:  # client already gone
            pass
        await websocket.close(code=4001)
