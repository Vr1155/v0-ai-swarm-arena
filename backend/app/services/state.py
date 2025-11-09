import os
from typing import Dict, Any
from dotenv import load_dotenv

load_dotenv()

class SessionStore:
    def __init__(self):
        self._sessions: Dict[str, Dict[str, Any]] = {}

    def reset(self, session_id: str, seed: Dict[str, Any] = None):
        self._sessions[session_id] = seed or {}

    def get(self, session_id: str) -> Dict[str, Any]:
        return self._sessions.setdefault(session_id, {})

    def set(self, session_id: str, state: Dict[str, Any]):
        self._sessions[session_id] = state
