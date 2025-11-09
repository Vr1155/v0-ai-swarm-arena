import os
import json
import httpx
from typing import List, Dict, Any, Optional
from dotenv import load_dotenv
from openai import AsyncOpenAI

load_dotenv()


class LLM:
    def __init__(
        self,
        provider_override: Optional[str] = None,
        api_key_override: Optional[str] = None,
        model_override: Optional[str] = None,
    ):
        self.provider = (provider_override or os.getenv("LLM_PROVIDER", "openrouter")).lower()
        self.model_override = model_override

        if self.provider == "openrouter":
            self.or_key = api_key_override or os.getenv("OPENROUTER_API_KEY")
            if not self.or_key:
                raise RuntimeError("OPENROUTER_API_KEY is required for OpenRouter usage.")
            self.or_model = model_override or os.getenv("OPENROUTER_MODEL", "openai/gpt-4o-mini")
            self.or_referer = os.getenv("OPENROUTER_REFERER", "")
            self.or_title = os.getenv("OPENROUTER_TITLE", "Intent Manager")
            self.base_url = "https://openrouter.ai/api/v1"
        elif self.provider == "openai":
            api_key = api_key_override or os.getenv("OPENAI_API_KEY")
            if not api_key:
                raise RuntimeError("OPENAI_API_KEY is required when LLM_PROVIDER=openai.")
            self.client = AsyncOpenAI(api_key=api_key)
            self.openai_model = model_override or os.getenv("OPENAI_MODEL", "gpt-4o-mini")
        else:
            raise NotImplementedError("Only 'openrouter' and 'openai' providers are supported.")

    async def _openrouter_chat(self, messages: List[Dict[str, str]], temperature: float, model: Optional[str]) -> str:
        headers = {
            "Authorization": f"Bearer {self.or_key}",
            "Content-Type": "application/json",
        }
        if self.or_referer:
            headers["HTTP-Referer"] = self.or_referer
        if self.or_title:
            headers["X-Title"] = self.or_title

        payload = {
            "model": model or self.or_model,
            "messages": messages,
            "temperature": temperature,
        }
        async with httpx.AsyncClient(timeout=60.0) as client:
            r = await client.post(f"{self.base_url}/chat/completions", headers=headers, json=payload)
            r.raise_for_status()
            data = r.json()
            return data["choices"][0]["message"]["content"]

    async def chat(
        self,
        system: str,
        messages: List[Dict[str, str]],
        *,
        model: Optional[str] = None,
        temperature: float = 0.4,
    ) -> str:
        msgs = [{"role": "system", "content": system}] + messages
        target_model = model or self.model_override
        if self.provider == "openrouter":
            return await self._openrouter_chat(msgs, temperature=temperature, model=target_model)
        resp = await self.client.chat.completions.create(
            model=target_model or self.openai_model,
            messages=msgs,
            temperature=temperature,
        )
        return resp.choices[0].message.content

    async def extract_json(
        self,
        prompt: str,
        conversation: List[Dict[str, str]],
        *,
        model: Optional[str] = None,
        temperature: float = 0.2,
    ) -> Optional[Dict[str, Any]]:
        msgs = [
            {"role": "system", "content": "You output ONLY valid minified JSON. No markdown."},
            {"role": "user", "content": json.dumps({"prompt": prompt, "conversation": conversation})},
        ]
        target_model = model or self.model_override
        if self.provider == "openrouter":
            raw = await self._openrouter_chat(msgs, temperature=temperature, model=target_model)
        else:
            resp = await self.client.chat.completions.create(
                model=target_model or self.openai_model,
                messages=msgs,
                temperature=temperature,
            )
            raw = resp.choices[0].message.content.strip()
        try:
            return json.loads(raw)
        except Exception:
            return None
