"""
Configuration Loader for Live AI Interview Agents.
Fetches dynamic model routing from Express Server API or fallback environment variables.
"""

import os
import json
import logging
import urllib.request
from pathlib import Path
from dotenv import load_dotenv

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

logger = logging.getLogger("agent-config")

EXPRESS_API_URL = os.getenv("EXPRESS_API_URL", "http://127.0.0.1:3001/api/admin/agent-config")

DEFAULT_CONFIG = {
    "ACTIVE_AVATAR_PROVIDER": "bithuman",
    "VOICE_LLM_MODEL": "gemini-2.5-flash-native-audio-preview-12-2025",
    "VOICE_LLM_FALLBACK": "gemini-2.0-flash-exp",
    "VOICE_STT_MODEL": "google-stt-v2",
    "VOICE_STT_FALLBACK": "deepgram",
    "VOICE_TTS_MODEL": "google-tts",
    "VOICE_TTS_FALLBACK": "elevenlabs",
    "AVATAR_LLM_MODEL": "gemini-3.1-flash-live-preview",
    "AVATAR_LLM_FALLBACK": "gemini-2.5-flash",
    "AVATAR_STT_MODEL": "google-stt-v2",
    "AVATAR_STT_FALLBACK": "deepgram",
    "AVATAR_TTS_MODEL": "google-tts",
    "AVATAR_TTS_FALLBACK": "elevenlabs",
}


def get_agent_config() -> dict:
    """Fetch current dynamic config from Express database API or fallback defaults."""
    try:
        req = urllib.request.Request(EXPRESS_API_URL, headers={"User-Agent": "PythonAgent/1.0"})
        with urllib.request.urlopen(req, timeout=3) as resp:
            if resp.status == 200:
                data = json.loads(resp.read().decode("utf-8"))
                if data.get("success") and data.get("config"):
                    logger.info("Successfully loaded agent config from Express server DB")
                    merged = {**DEFAULT_CONFIG, **data["config"]}
                    return merged
    except Exception as e:
        logger.warning(f"Could not reach Express config API ({e}); using local defaults.")

    return DEFAULT_CONFIG
