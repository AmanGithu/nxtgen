"""
AI LiveAvatar (HeyGen) Video Interviewer Agent.
"""

import json
import logging
from pathlib import Path

from dotenv import load_dotenv
from livekit import agents
from livekit.agents import Agent, AgentSession, RoomOutputOptions
from livekit.plugins import google, liveavatar

from config import get_agent_config

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

SESSIONS_DIR = BASE_DIR / "sessions"
logger = logging.getLogger("liveavatar-interview-agent")

MAX_DOC_CHARS = 12_000


def load_session_context(room_name: str) -> dict | None:
    path = SESSIONS_DIR / f"{room_name}.json"
    if not path.exists():
        return None
    try:
        return json.loads(path.read_text(encoding="utf-8"))
    except Exception:
        return None


def build_instructions(ctx_data: dict) -> str:
    candidate = ctx_data.get("candidate_name") or "the candidate"
    course = ctx_data.get("course_title") or "Generative AI Masterclass"
    module = ctx_data.get("module_title") or "All Modules"
    resume = (ctx_data.get("resume_text") or "").strip()[:MAX_DOC_CHARS]
    jd = (ctx_data.get("jd_text") or "").strip()[:MAX_DOC_CHARS]

    return f"""
You are a professional, video digital avatar interviewer conducting a live screening interview with {candidate}.

=== INTERVIEW CONTEXT ===
- Course: {course}
- Module Scope: {module}
- Job Description / Instructions: {jd or "(not provided)"}
- Candidate Resume: {resume or "(not provided)"}

=== RULES ===
1. Ask ONE question at a time, then stop and listen.
2. Ground questions in {module} and resume claims.
3. Keep spoken replies under 3 sentences. No markdown, plain spoken English.
"""


async def entrypoint(ctx: agents.JobContext) -> None:
    await ctx.connect()

    agent_cfg = get_agent_config()
    ctx_data = load_session_context(ctx.room.name)
    instructions = build_instructions(ctx_data) if ctx_data else "Conduct an avatar video screening interview."

    llm_model = agent_cfg.get("AVATAR_LLM_MODEL", "gemini-3.1-flash-live-preview")

    session = AgentSession(
        llm=google.beta.realtime.RealtimeModel(
            model=llm_model,
            voice="Charon",
            temperature=0.6,
        ),
    )

    avatar = liveavatar.AvatarSession()
    await avatar.start(session, room=ctx.room)

    await session.start(
        room=ctx.room,
        agent=Agent(instructions=instructions),
        room_output_options=RoomOutputOptions(audio_enabled=False),
    )

    await session.generate_reply(
        instructions="Greet candidate by name, introduce yourself as the video AI avatar interviewer, and begin Module 1."
    )


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
