"""
AI bitHuman Cloud Video Interviewer Agent.
Supports animated portrait photos and ready-made bitHuman console library avatars.
"""

import json
import logging
import os
from pathlib import Path

from dotenv import load_dotenv
from livekit import agents
from livekit.agents import Agent, AgentSession, RoomOutputOptions
from livekit.plugins import bithuman, google, liveavatar

from config import get_agent_config

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env")

SESSIONS_DIR = BASE_DIR / "sessions"
logger = logging.getLogger("bithuman-interview-agent")

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
You are a professional male video interviewer conducting a live screening interview with {candidate}.

STRICT LANGUAGE RULE: English ONLY.

=== INTERVIEW CONTEXT ===
- Course: {course}
- Module Scope: {module}
- Job Description / Instructions: {jd or "(not provided)"}
- Candidate Resume: {resume or "(not provided)"}

=== HOW TO RUN THE INTERVIEW ===
1. Ask ONE question at a time, then stop and listen.
2. Ground questions in {module} and resume claims.
3. Keep spoken turns short (1-3 sentences). Conversational English.
4. Conclude with balanced feedback once all module topics are covered.
"""


async def start_avatar(session: AgentSession, ctx: agents.JobContext) -> None:
    avatar_image_path = os.getenv("BITHUMAN_AVATAR_IMAGE", "").strip()
    avatar_id = os.getenv("BITHUMAN_AVATAR_ID", "").strip()

    if avatar_image_path:
        from PIL import Image

        img_file = Path(avatar_image_path)
        if not img_file.is_absolute():
            img_file = BASE_DIR / img_file
        if img_file.exists():
            avatar = bithuman.AvatarSession(
                avatar_image=Image.open(img_file).convert("RGB"),
                model="expression",
                api_secret=os.environ.get("BITHUMAN_API_SECRET", "secret"),
            )
            await avatar.start(session, room=ctx.room)
            return

    if avatar_id:
        avatar = bithuman.AvatarSession(
            avatar_id=avatar_id,
            api_secret=os.environ.get("BITHUMAN_API_SECRET", "secret"),
        )
        await avatar.start(session, room=ctx.room)
        return

    # Fallback to LiveAvatar if bitHuman parameters are not supplied
    avatar = liveavatar.AvatarSession()
    await avatar.start(session, room=ctx.room)


async def entrypoint(ctx: agents.JobContext) -> None:
    await ctx.connect()

    agent_cfg = get_agent_config()
    ctx_data = load_session_context(ctx.room.name)
    instructions = build_instructions(ctx_data) if ctx_data else "Conduct a bitHuman avatar screening interview."

    llm_model = agent_cfg.get("AVATAR_LLM_MODEL", "gemini-3.1-flash-live-preview")

    session = AgentSession(
        llm=google.beta.realtime.RealtimeModel(
            model=llm_model,
            voice="Charon",
            language="en-US",
            temperature=0.6,
        ),
    )

    await start_avatar(session, ctx)

    await session.start(
        room=ctx.room,
        agent=Agent(instructions=instructions),
        room_output_options=RoomOutputOptions(audio_enabled=False),
    )

    await session.generate_reply(
        instructions="In English: greet candidate by name, introduce yourself as the interviewer, and ask them to introduce themselves."
    )


if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
