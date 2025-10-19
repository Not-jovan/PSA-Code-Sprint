import os, sqlite3
from datetime import datetime
from dotenv import load_dotenv, find_dotenv
from flask import Flask, jsonify, request, session
from flask_socketio import SocketIO, emit
from flask_cors import CORS
import requests, json
import pandas as pd



app = Flask(__name__)
CORS(
    app,
    resources={r"/api/*": {"origins": "http://localhost:3000"}},
    supports_credentials=True
)
socketio = SocketIO(app, cors_allowed_origins="*")  # Enable CORS for WebSocket
app.url_map.strict_slashes = False
from leadership import leadership_bp, set_azure_chat
app.register_blueprint(leadership_bp)

# ---------------- Config (env) ----------------
# Load environment variables from .env file
load_dotenv()
print("Loading .env file from:", find_dotenv())  # Check if the .env file is found
AZURE_BASE_URL = os.getenv("AZURE_OPENAI_BASE_URL", "https://psacodesprint2025.azure-api.net/gpt-5-mini/openai")
AZURE_API_KEY = os.getenv("AZURE_OPENAI_API_KEY")
AZURE_API_VERSION = os.getenv("AZURE_OPENAI_API_VERSION", "2025-01-01-preview")
AZURE_OPENAI_DEPLOYMENT_NAME = os.getenv("AZURE_OPENAI_CHAT_MODEL", "gpt-5-mini")  # replace with your deployment name
DEFAULT_VECTOR_STORE_ID = os.getenv("VECTOR_STORE_ID")  # optional

# ---------------- Prompts ----------------
MENTOR_SYSTEM = (
    """
            You are an AI career mentor for PSA employees. You have full access to a structured HR dataset (skills, competencies, experiences, projects, education) for all users and a peer dataset for benchmarking.

            Your Mandate:

            1.  Recognize the current user based on the provided profile.
            2.  Synthesize anonymized peer data and department norms to identify the **top 3-5 most critical skill gaps** for the user's aspirational path, and/or the **top 3-5 high-potential strengths** they should leverage.
            3.  Provide specific, actionable, and **measurable** recommendations. All suggestions must define a clear scope (e.g., "Complete the Advanced Project Management course on the Learning Hub by Q2," or "Lead one defined cross-functional project for 6 months").
            4.  Suggest realistic skill-building projects, internal rotations, or learning paths directly relevant to the identified gaps.
            5.  Maintain a professional, **data-driven**, and conversational tone—like a trusted, objective internal mentor. Avoid generic motivational filler; all encouragement must be grounded in the user's specific progress or data profile.
            6.  Maintain a quick, high-value chat flow. Initial responses must be succinct, typically in 2-4 short paragraphs or utilizing lists, and should not exceed **100 words**. Only elaborate extensively when the user explicitly asks for more detail.

            Key Constraints (Non-Negotiable):

            * Answer all user questions while prioritizing advice relevant *only* to the current user's profile.
            * Conclude your response with a relevant, open-ended question to guide the user to the next logical step in their career planning.
            * Reply in a friendly and approachale tone to the user (try to acknoledge who her/she is), and reassure them if they are facing any emotional issues.
            * DO NOT HALUCINATE on employee data. Do 
            """

)

SUPPORT_SYSTEM = (
    "You are a friendly, empathetic workplace support companion for PSA employees. "
    "Acknowledge feelings, reflect back, and suggest healthy coping strategies. "
    "You are not a clinician; encourage seeking professional help for clinical concerns. "
    "Keep tone warm, brief, and non-judgmental."
)

CRISIS_KEYWORDS = {"suicide", "kill myself", "end my life", "self harm", "hurt myself"}
CRISIS_RESPONSE = (
    "I'm really glad you reached out. Your safety matters.\n\n"
    "I’m not a medical professional, but you’re not alone. If you’re in immediate danger, "
    "please contact local emergency services right away.\n\n"
    "You can talk to someone 24/7:\n"
    "• Singapore Samaritans of Singapore (SOS): 1767 (24/7 hotline) or 9151 1767 (WhatsApp)\n"
    "• Your company’s Employee Assistance Programme (EAP), if available\n\n"
    "If you’d like, we can also focus on small, safe next steps together."
)

# ---------------- Helpers ----------------
def build_messages(mode: str, user_message: str, history=None, employee_id=None):

        # Check for crisis keywords
    if any(keyword in user_message.lower() for keyword in CRISIS_KEYWORDS):
        return [{"role": "assistant", "content": CRISIS_RESPONSE}]

    system = MENTOR_SYSTEM if mode == "mentor" else SUPPORT_SYSTEM
    msgs = [{"role": "system", "content": system}]

    # Load structured HR context only on first message (when employee_id provided)
    if mode == "mentor" and employee_id:
        current, all_emps = read_employee_data(
            os.path.join(os.path.dirname(__file__), "../Data/employees.json"),
            employee_id
        )
        skill_context = read_skills_excel(
            os.path.join(os.path.dirname(__file__), "../Data/Functions_Skills.xlsx")
        )


        # Developer role — structured HR grounding
        msgs.append({
            "role": "developer",
            "content": json.dumps({
                "employee_profile": current,
                "all_employees": all_emps  
            })
        })
        

        # Assistant role — skills context
        msgs.append({
            "role": "assistant",
            "content": json.dumps({"skill_unit_context": skill_context})
        })

    # Include short history (if any)
    if history:
        msgs.extend([m for m in history if m.get("role") in ("user", "assistant")][-10:])

    # Add the user's input
    msgs.append({
        "role": "user",
        "content": user_message
    })

    return msgs

def azure_chat(messages, vector_store_id=None, temperature=1):
    url = f"{AZURE_BASE_URL}/deployments/{AZURE_OPENAI_DEPLOYMENT_NAME}/chat/completions?api-version={AZURE_API_VERSION}"
    headers = {
        "Content-Type": "application/json",
        "api-key": AZURE_API_KEY,  # Include the subscription key
    }
    payload = {
        "messages": messages,
        "temperature": temperature,
    }
    if vector_store_id:
        payload["vector_store_id"] = vector_store_id

    try:
        r = requests.post(url, json=payload, headers=headers, timeout=60)
        r.raise_for_status()
        out = r.json()
        print("Azure API Response:", out)  # Log the response
        return out["choices"][0]["message"]["content"]
    except requests.HTTPError as e:
        status = getattr(e.response, "status_code", 502)
        body = getattr(e.response, "text", "")
        print("HTTPError:", body)  # Log the HTTP error response
        raise Exception(f"HTTPError: {status}, {body}")
    except Exception as e:
        print("Exception:", str(e))  # Log any other exceptions
        raise Exception(f"Error: {str(e)}")

set_azure_chat(azure_chat)
# ---------------- Routes ----------------
@app.get("/api/health")
def health():
    return jsonify({"ok": True, "time": datetime.utcnow().isoformat() + "Z"})

# ---------------- App Setup ----------------
load_dotenv(find_dotenv())


app.url_map.strict_slashes = False

# Secret key for sessions
app.secret_key = os.getenv("FLASK_SECRET_KEY", "super-secret-key")

# Database path
DB_PATH = os.path.join(os.path.dirname(__file__), "../db/auth.db")


# ---- Data Loaders ----
def read_employee_data(json_path, employee_id):
    """Load employee dataset and extract current employee."""
    try:
        with open(json_path, "r", encoding="utf-8") as f:
            employees = json.load(f)
        current = next(emp for emp in employees if emp["employee_id"] == employee_id)
        return current, employees
    except Exception as e:
        print(f"[WARN] Failed to load employee data: {e}")
        return {}, []

def read_skills_excel(xlsx_path):
    """Read skill and function data for grounding."""
    try:
        df = pd.read_excel(xlsx_path)
        skills = []
        for _, row in df.iterrows():
            skills.append({
                "function_unit_skill": str(row.get("Function / Unit / Skill", "")),
                "specialisation_unit": str(row.get("Specialisation / Unit", ""))
            })
        return skills
    except Exception as e:
        print(f"[WARN] Failed to load skills data: {e}")
        return []
    

# ---------------- Login Route ----------------
@app.post("/api/login")
def login():
    data = request.get_json(force=True, silent=True)
    username = (data.get("username") or "").strip()
    password = (data.get("password") or "").strip()

    if not username or not password:
        return jsonify({"error": "username_and_password_required"}), 400

    # Check DB
    if not os.path.exists(DB_PATH):
        return jsonify({"error": "db_not_found", "detail": DB_PATH}), 500

    try:
        conn = sqlite3.connect(DB_PATH)
        cursor = conn.cursor()
        cursor.execute("SELECT password FROM users WHERE username=?", (username,))
        row = cursor.fetchone()
        conn.close()
    except Exception as e:
        return jsonify({"error": "db_error", "detail": str(e)}), 500

    if not row or row[0] != password:
        return jsonify({"error": "invalid_credentials"}), 401

    # Successful login → save username in session
    session["username"] = username
    if "histories" not in session:
        session["histories"] = {}

    return jsonify({"ok": True, "username": username})

@app.post("/api/chat")
def chat():
    """
    Body:
    {
      "mode": "mentor" | "support",
      "message": "text",
      "vector_store_id": "optional"
    }
    """
    data = request.get_json(force=True, silent=True)
    if not data:
        return jsonify({"error": "bad_request", "detail": "Expected JSON body"}), 400

    # ---------------- Check if user is logged in ----------------
    username = session.get("username")
    if not username:
        return jsonify({"error": "not_logged_in", "detail": "Please log in first."}), 401

    mode = (data.get("mode") or "support").lower()
    if mode not in ("mentor", "support"):
        return jsonify({"error": "bad_request", "detail": "mode must be 'mentor' or 'support'"}), 400

    message = (data.get("message") or "").strip()
    if not message:
        return jsonify({"error": "bad_request", "detail": "message required"}), 400

    # ---------------- Crisis check for support mode ----------------
    if mode == "support":
        lowered = message.lower()
        if any(k in lowered for k in CRISIS_KEYWORDS):
            return jsonify({"reply": CRISIS_RESPONSE, "mode": mode, "crisis": True})

    vector_store_id = data.get("vector_store_id") or DEFAULT_VECTOR_STORE_ID

    # ---------------- Initialize per-user chat session ----------------

    current, all_emps = read_employee_data(
        os.path.join(os.path.dirname(__file__), "../public/Data/employees.json"), username
    )
    skills = read_skills_excel(
        os.path.join(os.path.dirname(__file__), "../public/Data/Functions_Skills.xlsx")
    )
    if "chat_session_data" not in session:
        session["chat_session_data"] = {
            "current": current,
            "all_employees": all_emps,
            "skills": skills,
            "messages": []
        }

    chat_data = session["chat_session_data"]

    # Build messages for Azure
    messages = [
        {"role": "system", "content": MENTOR_SYSTEM if mode == "mentor" else SUPPORT_SYSTEM},
        {"role": "assistant", "content": json.dumps({"skill_unit_context": skills})},
        {"role": "developer", "content": json.dumps({
            "employee_profile": current,
            "all_employees": all_emps
        })}
    ] + chat_data.get("messages", [])

    # Append user message
    messages.append({"role": "user", "content": message})

    # Keep chat history trimmed
    MAX_HISTORY = 10
    chat_data["messages"] = messages[:3] + messages[-MAX_HISTORY:]

    # Save back to session
    session["chat_session_data"] = chat_data


    # ---------------- Call Azure Chat API ----------------
    try:
        reply = azure_chat(chat_data["messages"], vector_store_id=vector_store_id)
        chat_data["messages"].append({"role": "assistant", "content": reply})
        session["chat_session_data"] = chat_data  # Save updated session

        return jsonify({"reply": reply, "mode": mode, "username": username})

    except requests.HTTPError as e:
        status = getattr(e.response, "status_code", 502)
        body = getattr(e.response, "text", "")
        return jsonify({
            "error": "upstream_error",
            "status": status,
            "detail": str(e),
            "upstream_body": body[:2000]
        }), 502
    except Exception as e:
        return jsonify({"error": "internal_error", "detail": str(e)}), 500


@app.post("/api/vector-stores")
def create_vector_store():
    url = f"{AZURE_BASE_URL}/vector_stores?api-version={AZURE_API_VERSION}"
    headers = {"Content-Type": "application/json", "api-key": AZURE_API_KEY}
    body = request.get_json(force=True, silent=True) or {}
    if "name" not in body:
        body["name"] = "psa_employee_knowledge"
    r = requests.post(url, json=body, headers=headers, timeout=60)
    r.raise_for_status()
    return jsonify(r.json()), 201

# ---------------- WebSocket Routes ----------------
@socketio.on("connect", namespace="/ws")
def handle_connect():
    print("Client connected")
    emit("response", {"message": "Connected to WebSocket server"})

@socketio.on("message", namespace="/ws")
def handle_message(data):
    print(f"Received message: {data}")
    emit("response", {"message": f"Echo: {data}"})

@socketio.on("disconnect", namespace="/ws")
def handle_disconnect():
    print("Client disconnected")

# ---------------- JSON Error Handlers ----------------
@app.errorhandler(400)
def handle_400(e):
    return jsonify({"error": "bad_request", "detail": str(e)}), 400

@app.errorhandler(404)
def handle_404(e):
    return jsonify({"error": "not_found"}), 404

@app.errorhandler(500)
def handle_500(e):
    return jsonify({"error": "internal_error", "detail": str(e)}), 500

if __name__ == "__main__":
    socketio.run(app, host="0.0.0.0", port=8080)