import os
import aiofiles
import httpx
from dotenv import load_dotenv
from fastapi import UploadFile

load_dotenv()

DEFAULT_API = "https://api.elevenlabs.io/v1/speech-to-text"
ELEVEN_API = os.getenv("ELEVENLABS_STT_URL", DEFAULT_API)
API_KEY = os.getenv("ELEVENLABS_API_KEY")
MODEL_ID = os.getenv("ELEVEN_STT_MODEL_ID", "scribe_v1")

# Optional toggles
ENABLE_DIARIZATION = os.getenv("ELEVEN_STT_ENABLE_DIARIZATION", "true").lower() == "true"
ENABLE_TIMESTAMPS = os.getenv("ELEVEN_STT_ENABLE_TIMESTAMPS", "true").lower() == "true"
LANGUAGE_CODE = os.getenv("ELEVEN_STT_LANGUAGE_CODE", "en")

async def transcribe_audio(file: UploadFile) -> str:
    """
    Uploads user audio to ElevenLabs STT (Scribe v1) and returns the transcript text.
    Returns plain text; you can extend to return words/timestamps/speakers if you need.
    """
    if not API_KEY:
        raise RuntimeError("ELEVENLABS_API_KEY not set")

    # Read the incoming file into memory once (or spool to temp if large)
    content = await file.read()

    # Multipart form with file + params (model defaults to Scribe v1 server-side)
    form = {
        "model_id": (None, MODEL_ID),
        "diarize": (None, "true" if ENABLE_DIARIZATION else "false"),
        "timestamps": (None, "true" if ENABLE_TIMESTAMPS else "false"),
        # You can also send language hints etc. See docs.
    }
    if LANGUAGE_CODE:
        form["language_code"] = (None, LANGUAGE_CODE)
    files = {"file": (file.filename or "audio.wav", content, file.content_type or "audio/wav")}

    headers = {"xi-api-key": API_KEY}

    async with httpx.AsyncClient(timeout=120.0) as client:
        r = await client.post(ELEVEN_API, headers=headers, data=form, files=files)
    try:
        r.raise_for_status()
    except httpx.HTTPStatusError as exc:
        detail = exc.response.text if exc.response else "no response body"
        raise RuntimeError(f"ElevenLabs STT failed ({exc.response.status_code}): {detail}") from exc
    data = r.json()

    # Typical fields: "text", "language_code", "words" (timestamps), "speaker_id" per word, etc.
    return data.get("text", "")
