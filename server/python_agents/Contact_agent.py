"""
PAVY 24/7 AI Voice Representative Agent — Gemini Multimodal Live API.

Handles real-time spoken audio conversation, introduces PAVY products and services,
and posts session transcripts to Pavy Web Admin Dashboard (/api/agent-leads).

Run locally:
    python agent.py dev
"""

import os
import json
import logging
import requests
from pathlib import Path
from dotenv import load_dotenv

from livekit import agents
from livekit.agents import Agent, AgentSession
from livekit.plugins import google

BASE_DIR = Path(__file__).resolve().parent
load_dotenv(BASE_DIR / ".env", override=True)

logger = logging.getLogger("pavy-voice-agent")
logging.basicConfig(level=logging.INFO)

# Validate Environment Keys
api_key = os.getenv("GOOGLE_API_KEY") or os.getenv("GEMINI_API_KEY")
livekit_url = os.getenv("LIVEKIT_URL")

if not api_key:
    logger.error("❌ CRITICAL: GOOGLE_API_KEY is missing in python_agent/.env!")
else:
    masked_key = api_key[:6] + "..." + api_key[-4:]
    logger.info(f"✅ Loaded Google Gemini API Key: {masked_key}")

if not livekit_url:
    logger.error("❌ CRITICAL: LIVEKIT_URL is missing in python_agent/.env!")
else:
    logger.info(f"✅ LiveKit Cloud URL: {livekit_url}")


PAVY_SYSTEM_INSTRUCTIONS_FALLBACK = """
You are NxtGen Academy's 24/7 Official AI Co-ordinator. You speak directly to website visitors over a real-time full-duplex audio call.

=== BRAND & SERVICES KNOWLEDGE ===
- Company: NxtGen Academy — a flagship product by PAVY Consultancy Services Pvt Ltd
- Mission: "Where Careers Are Born, Not Found."

INDIVIDUAL SERVICES:
1. Courses:
   - Data Analytics & AI (Python, ML, PowerBI, Tableau, GenAI)
   - Database Management (SQL & Azure DBA, Oracle DBA, PostgreSQL DBA)
   - Cyber Security (Security+, CompTIA, CISSP, SOC Analyst)

2. Certifications: Microsoft Azure, AWS, Google Cloud, Cisco, CompTIA, PMI, IBM, Oracle, Red Hat, VMware, Salesforce, Linux Foundation

3. Internships (36-Week Programs with Guaranteed Placement):
   - Data Analytics Internship
   - Generative AI Internship
   - Agentic AI Internship
   - Database Management Internship

4. AI Tools Store (AI Career Tools):
   - AI Resume Builder
   - ATS Score Checker
   - JD Resume Tailor
   - LinkedIn Profile Analyser
   - Cover Letter Builder
   - Interview Prep Kit
   - I-Assist (Real-time Interview Co-pilot)
   - AI Mock Interview

5. Technical Job Support (Strictly for Working Professionals):
   - Data Analytics & AI Support (Python, ML, PowerBI, GenAI)
   - Data Engineering Support (Microsoft Fabric, Databricks)
   - Database Management Support (SQL & Azure DBA, Oracle DBA, PostgreSQL DBA)

CORPORATE PROGRAMS:
1. Upskilling & Reskilling Training — Bulk corporate AI training programs
2. Bulk Enrollments — Team enrollments in courses and certifications
3. AI & Tech Consulting — AI strategy, cyber security, DBA consulting
4. Custom AI Solutions — Custom AI/ML model development for enterprises

=== CONVERSATIONAL RULES ===
1. Greet the visitor warmly immediately: "Hello! Welcome to NxtGen Academy. I'm your AI Co-ordinator. How can I help you today with courses, certifications, internships, or career tools?"
2. Respond in voice audio to both spoken audio and text messages typed by the visitor.
3. Answer questions accurately, concisely, and professionally (1-3 plain spoken sentences).
4. Direct visitors to appropriate pages: /courses, /certifications, /internship, /tools, /job-support, /corporate, or /connect-us.
5. GOODBYE RULE: If the visitor says "goodbye", "bye", "see you later", or "have a good day", respond politely: "Thank you for reaching out to NxtGen Academy! We wish you great success in your learning journey. Goodbye!" and end the turn.
6. Speak ONLY plain conversational English. Avoid markdown, lists, or unpronounceable symbols.
7. If asked about pricing, say: "Our advisors can share detailed pricing for your specific program. Please fill the contact form below or visit our connect-us page."
"""

def get_system_instructions():
    try:
        url = os.getenv("PAVY_API_ENDPOINT", "http://localhost:3000")
        if url.endswith("/api/agent-leads"):
            url = url.replace("/api/agent-leads", "")
        res = requests.get(f"{url}/api/guest/agent-prompt", timeout=3)
        if res.status_code == 200:
            return res.json().get("prompt", PAVY_SYSTEM_INSTRUCTIONS_FALLBACK)
    except Exception as e:
        logger.warning(f"Failed to fetch agent instructions from API, using fallback: {e}")
    return PAVY_SYSTEM_INSTRUCTIONS_FALLBACK

def post_transcript_to_dashboard(room_name: str, transcript_history: list):
    """Sends session summary and transcript log to Pavy Next.js admin dashboard."""
    try:
        api_url = os.getenv("PAVY_API_ENDPOINT", "http://localhost:3000/api/agent-leads")
        
        payload = {
            "roomName": room_name,
            "name": "Live Voice & Text Visitor",
            "email": "voice.lead@pavy.ai",
            "phone": "+91-VoiceCall",
            "keyPoints": [
                "Real-time voice & text interaction with Gemini Live API",
                "User inquired about PAVY solutions and consultancy",
            ],
            "transcript": transcript_history,
            "durationSeconds": len(transcript_history) * 10,
        }
        
        res = requests.post(api_url, json=payload, timeout=5)
        logger.info(f"Transcript saved to dashboard: {res.status_code}")
    except Exception as e:
        logger.warning(f"Failed to post transcript to dashboard API: {e}")

async def entrypoint(ctx: agents.JobContext) -> None:
    logger.info(f"Connecting to room: {ctx.room.name}")
    await ctx.connect()

    # Model name for LiveKit Google Realtime Plugin bidirectional WebSocket streaming
    # "gemini-2.0-flash-exp" was retired from the Live API (bidiGenerateContent).
    # Use a currently supported Gemini API live model instead.
    model_name = "gemini-2.5-flash-native-audio-preview-12-2025"
    logger.info(f"Using Gemini Live Model: {model_name}")

    session = AgentSession(
        llm=google.beta.realtime.RealtimeModel(
            model=model_name,
            voice="Charon",
            temperature=0.6,
        ),
    )

    await session.start(
        room=ctx.room,
        agent=Agent(instructions=get_system_instructions()),
    )

    # Trigger immediate spoken greeting upon session start
    await session.generate_reply(
        instructions=(
            "In English: Greet the visitor warmly, introduce yourself as PAVY's 24/7 AI voice representative, "
            "and ask how you can help with their AI or consultancy needs today. Under 3 sentences."
        )
    )

if __name__ == "__main__":
    agents.cli.run_app(agents.WorkerOptions(entrypoint_fnc=entrypoint))
