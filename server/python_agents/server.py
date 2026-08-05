"""
Web server for NxtGen Academy Live AI Interviewer.

- POST /start-interview  -> accepts course, module, resume, and instructions/JD,
                            saves sessions/<room>.json for the agent,
                            and returns a LiveKit token + URL.
"""

import io
import json
import os
import sys
import uuid
from pathlib import Path

from dotenv import load_dotenv
from flask import Flask, jsonify, request
from livekit import api

BASE_DIR = Path(__file__).resolve().parent
ENV_PATH = BASE_DIR / ".env"
load_dotenv(ENV_PATH)

LIVEKIT_URL = os.getenv("LIVEKIT_URL", "wss://demo.livekit.cloud")
LIVEKIT_API_KEY = os.getenv("LIVEKIT_API_KEY", "devkey")
LIVEKIT_API_SECRET = os.getenv("LIVEKIT_API_SECRET", "secret")

SESSIONS_DIR = BASE_DIR / "sessions"
SESSIONS_DIR.mkdir(exist_ok=True)

MAX_UPLOAD_MB = 10

app = Flask(__name__)
app.config["MAX_CONTENT_LENGTH"] = MAX_UPLOAD_MB * 1024 * 1024


def extract_text(file_storage) -> str:
    """Extract plain text from uploaded PDF / DOCX / TXT file."""
    name = (file_storage.filename or "").lower()
    data = file_storage.read()

    if name.endswith(".pdf"):
        from pypdf import PdfReader
        reader = PdfReader(io.BytesIO(data))
        return "\n".join((page.extract_text() or "") for page in reader.pages)

    if name.endswith(".docx"):
        from docx import Document
        doc = Document(io.BytesIO(data))
        return "\n".join(p.text for p in doc.paragraphs)

    return data.decode("utf-8", errors="ignore")


@app.get("/health")
def health():
    return jsonify({"status": "ok", "service": "NxtGen LiveKit Python Token Server"})


@app.post("/start-interview")
def start_interview():
    candidate_name = (request.form.get("candidate_name") or "Candidate").strip()
    course_title = (request.form.get("course_title") or "Generative AI Masterclass").strip()
    module_title = (request.form.get("module_title") or "All Modules").strip()
    jd_text = (request.form.get("jd_text") or "").strip()

    resume_text = ""
    resume_file = request.files.get("resume")
    if resume_file and resume_file.filename:
        try:
            resume_text = extract_text(resume_file).strip()
        except Exception as e:
            return jsonify({"error": f"Could not read resume file: {e}"}), 400

    room_name = f"interview-{uuid.uuid4().hex[:10]}"

    (SESSIONS_DIR / f"{room_name}.json").write_text(
        json.dumps(
            {
                "candidate_name": candidate_name,
                "course_title": course_title,
                "module_title": module_title,
                "resume_text": resume_text,
                "jd_text": jd_text,
            },
            ensure_ascii=False,
        ),
        encoding="utf-8",
    )

    identity = f"candidate-{uuid.uuid4().hex[:8]}"
    token = (
        api.AccessToken(LIVEKIT_API_KEY, LIVEKIT_API_SECRET)
        .with_identity(identity)
        .with_name(candidate_name)
        .with_grants(api.VideoGrants(room_join=True, room=room_name))
        .to_jwt()
    )

    return jsonify({"url": LIVEKIT_URL, "token": token, "room": room_name})


if __name__ == "__main__":
    app.run(host="127.0.0.1", port=5005, debug=True)
