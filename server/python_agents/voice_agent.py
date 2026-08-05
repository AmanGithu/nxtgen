"""
AI Voice-Only Screening Interviewer Agent.
Reads course, module, resume, and instructions/JD, and conducts spoken interviews.
"""

import json
import logging
from pathlib import Path

from dotenv import load_dotenv
from livekit import agents
from livekit.agents import Agent, AgentSession, RoomOutputOptions
from livekit.plugins import google

from config import get_agent_config

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

SESSIONS_DIR = BASE_DIR / "sessions"
logger = logging.getLogger("voice-interview-agent")

MAX_DOC_CHARS = 12_000


def load_session_context(room_name: str) -> dict | None:
    path = SESSIONS_DIR / f"{room_name}.json"
    if not path.exists():
        logger.warning(f"No session context found for room {room_name}")
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        logger.exception(f"Failed to read session context for {room_name}")
        return None


def build_instructions(ctx_data: dict) -> str:
    candidate = ctx_data.get("candidate_name") or "the candidate"
    course = ctx_data.get("course_title") or "Generative AI Masterclass"
    module = ctx_data.get("module_title") or "All Modules"
    resume = (ctx_data.get("resume_text") or "").strip()[:MAX_DOC_CHARS]
    jd = (ctx_data.get("jd_text") or "").strip()[:MAX_DOC_CHARS]

    return f"""
You are a professional, warm but rigorous AI job interviewer conducting a spoken technical screening interview with {candidate}.

=== INTERVIEW CONTEXT ===
- Course: {course}
- Target Module Scope: {module}
- Job Description / Instructions: {jd or "(not provided)"}
- Candidate Resume: {resume or "(not provided)"}

=== HOW TO CONDUCT THE INTERVIEW ===
1. Ask exactly ONE clear question at a time, then stop and listen.
2. Structure questions sequentially covering the specified course module: {module}.
3. Mix technical probes, system architecture trade-offs, and STAR behavioral scenarios.
4. Keep spoken turns concise (1-3 sentences). Never lecture. Plain conversational English.
5. Provide brief encouragement or natural follow-ups when an answer is interesting.
6. After covering the module questions, give a brief summary of their performance.
"""


async def entrypoint(ctx: agents.JobContext) -> None:
    await ctx.connect()

    agent_cfg = get_agent_config()
    ctx_data = load_session_context(ctx.room.name)
    instructions = build_instructions(ctx_data) if ctx_data else "Conduct a general AI screening interview."

    llm_model_name = agent_cfg.get("VOICE_LLM_MODEL", "gemini-2.5-flash-native-audio-preview-12-2025")

    session = AgentSession(
        llm=google.beta.realtime.RealtimeModel(
            model=llm_model_name,
            voice="Charon",
            temperature=0.6,
        ),
    )

    await session.start(
        room=ctx.room,
        agent=Agent(instructions=instructions),
        room_output_options=RoomOutputOptions(audio_enabled=True),
    )

    await session.generate_reply(
        instructions=(
            "Greet the candidate warmly, state the course and module scope of this interview, "
            "and ask them to introduce themselves and their background."
        )
    )


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
