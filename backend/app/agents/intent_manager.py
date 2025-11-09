import os
import copy
from typing import Tuple, Dict, Any
from app.services.llm_adapter import LLM
from app.schemas import REQUIREMENTS_TEMPLATE

SYSTEM_PROMPT = """You are an Intent Manager that scopes software projects in real time.
Your job:
- Keep the conversation flowing naturally, as if you and the user are talking live rather than processing a recording.
- Ask one focused follow-up at a time and keep answers short, helpful, and non-technical unless asked otherwise.
- Ask for details about the user's requirements like the time period this has to delivered in, their budget or any other small details that will help create a comprehensive requirements document.
- Within the first couple of turns, explicitly ask the user for their detailed requirements so you can generate the report.
- Extract structured requirements from each turn and remember that the conversation transcript will be used to produce the final document.
- ALWAYS reply in clear English, even if the transcript shows another language or script. If the user speaks another language, politely ask them to continue in English.

When the user appears satisfied (and after you've confirmed they have nothing else to add), propose to generate a clean Requirements Document.
"""

EXTRACTION_PROMPT = """From the conversation snippet and the user's latest message, extract and update these fields (only what you can):
{schema}

Return STRICT JSON with fields present only if you can fill/update them.
Keep arrays deduplicated.
"""

class IntentManager:
    def __init__(self, session_store):
        self.session_store = session_store
        self.llm = LLM()

    async def handle_user_message(self, session_id: str, message: str) -> Tuple[str, Dict[str, Any]]:
        state = self.session_store.get(session_id)
        history = state.setdefault("history", [])
        req_state = state.setdefault("requirements_state", copy.deepcopy(REQUIREMENTS_TEMPLATE))

        # 1) Craft a short assistant reply with one follow-up
        reply = await self.llm.chat(
            system=SYSTEM_PROMPT,
            messages=history + [{"role":"user","content":message}]
        )

        # 2) Extract structured updates
        extraction = await self.llm.extract_json(
            prompt=EXTRACTION_PROMPT.format(schema=REQUIREMENTS_TEMPLATE),
            conversation=history[-6:] + [{"role":"user","content":message},{"role":"assistant","content":reply}]
        )

        # 3) Merge into req_state
        self._deep_merge(req_state, extraction or {})

        # 4) Append to history
        history.append({"role":"user","content":message})
        history.append({"role":"assistant","content":reply})

        # 5) Save
        self.session_store.set(session_id, state)
        return reply, state

    def _deep_merge(self, base, updates):
        if isinstance(base, dict) and isinstance(updates, dict):
            for k, v in updates.items():
                if k in base:
                    base[k] = self._deep_merge(base[k], v)
                else:
                    base[k] = v
            return base
        return updates
