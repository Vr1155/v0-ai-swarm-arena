import os, json, httpx, asyncio
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()

class LLM:
    def __init__(self):
        self.provider = os.getenv("LLM_PROVIDER", "openrouter").lower()
        if self.provider == "openrouter":
            self.or_key = os.getenv("OPENROUTER_API_KEY")
            self.or_model = os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
            self.or_referer = os.getenv("OPENROUTER_REFERER", "")
            self.or_title = os.getenv("OPENROUTER_TITLE", "Intent Manager")
            self.base_url = "https://openrouter.ai/api/v1"
            self.temperature = 0.4
        elif self.provider == "openai":
            self.client = AsyncOpenAI(api_key=os.getenv("OPENAI_API_KEY"))
            self.model = os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        else:
            raise NotImplementedError("Only 'openrouter' and 'openai' are implemented in this scaffold.")

    async def _openrouter_chat(self, messages: List[Dict[str, str]], temperature: float) -> str:
        headers = {
            "Authorization": f"Bearer {self.or_key}",
            "Content-Type": "application/json",
        }
        if self.or_referer:
            headers["HTTP-Referer"] = self.or_referer
        if self.or_title:
            headers["X-Title"] = self.or_title

        payload = {
            "model": self.or_model,
            "messages": messages,
            "temperature": temperature
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
            r.raise_for_status()
            data = r.json()
            return data["choices"][0]["message"]["content"]

    async def chat(self, system: str, messages: List[Dict[str, str]]) -> str:
        msgs = [{"role":"system","content":system}] + messages
        if self.provider == "openrouter":
            return await self._openrouter_chat(msgs, temperature=0.4)
        # openai fallback
        resp = await self.client.chat.completions.create(
            model=self.model,
            messages=msgs,
            temperature=0.4
        )
        return resp.choices[0].message.content

    async def extract_json(self, prompt: str, conversation: List[Dict[str, str]]) -> Optional[Dict[str, Any]]:
        msgs = [
            {"role":"system","content":"You output ONLY valid minified JSON. No markdown."},
            {"role":"user","content": json.dumps({"prompt":prompt, "conversation":conversation})}
        ]
        if self.provider == "openrouter":
            raw = await self._openrouter_chat(msgs, temperature=0.2)
        else:
            resp = await self.client.chat.completions.create(
                model=self.model,
                messages=msgs,
                temperature=0.2
            )
            raw = resp.choices[0].message.content.strip()
        try:
            return json.loads(raw)
        except Exception:
            return None
