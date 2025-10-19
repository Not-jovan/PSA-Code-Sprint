# leadership.py
import json
from datetime import datetime
from dateutil.parser import parse
from flask import Blueprint, jsonify, request
from flask_cors import cross_origin

# ---- import azure_chat from app.py without circular import ----
# We'll inject the function from app.py via set_azure_chat(...)
azure_chat_func = None
def set_azure_chat(fn):
    global azure_chat_func
    azure_chat_func = fn

# Blueprint (accept both with and without trailing slash)
leadership_bp = Blueprint("leadership", __name__, url_prefix="/api/leadership")
leadership_bp.strict_slashes = False

# ---------- scoring ----------
def compute_weighted_LPI(emp: dict):
    e = emp.get("employment_info", {}) or {}
    competencies = emp.get("competencies", []) or []
    skills = emp.get("skills", []) or []
    projects = emp.get("projects", []) or []
    positions = emp.get("positions_history", []) or []
    text_block = json.dumps(emp).lower()

    role_count = len(positions)
    experience_score = min(10, role_count * 2)

    lead_roles = sum(1 for p in projects if "lead" in (p.get("role", "").lower()))
    project_score = min(10, 5 + 2 * lead_roles) if projects else 0

    level_map = {"Beginner": 1, "Intermediate": 2, "Advanced": 3}
    avg_comp = (
        sum(level_map.get(c.get("level", ""), 0) for c in competencies) /
        max(1, len(competencies))
    ) if competencies else 0
    competency_score = round((avg_comp / 3) * 10, 1)

    people_score = 10 if any(k in text_block for k in ["coach", "mentor", "development", "leadership"]) else 6

    distinct_areas = len(set(s.get("function_area") for s in skills if s.get("function_area"))) if skills else 0
    cross_score = min(10, distinct_areas * 2)

    change_score = 10 if any(k in text_block for k in ["innovation", "transformation", "automation", "digital", "cloud"]) else 6

    try:
        hire = parse(e.get("hire_date"))
        years = max(0.01, (datetime.utcnow() - hire).days / 365.0)
    except Exception:
        years = 1.0
    progression_score = min(10, max(5, (role_count - 1) / years * 10))

    lang_count = len((emp.get("personal_info") or {}).get("languages", []))
    comm_score = min(10, 4 + lang_count * 3)

    edu = emp.get("education", []) or []
    edu_score = 10 if any("Master" in (x.get("degree", "")) for x in edu) else 8

    weights = {
        "experience": 0.20, "projects": 0.15, "competencies": 0.20, "people": 0.10,
        "cross_functional": 0.10, "innovation": 0.15, "progression": 0.10,
        "communication": 0.05, "education": 0.05
    }

    dims = {
        "experience": experience_score,
        "projects": project_score,
        "competencies": competency_score,
        "people": people_score,
        "cross_functional": cross_score,
        "innovation": change_score,
        "progression": progression_score,
        "communication": comm_score,
        "education": edu_score,
    }

    overall = round(sum(dims[k] * weights[k] for k in dims) * 10, 1)  # 0–100
    return overall, dims


# ---------- summarizer (AI call) ----------
def summarize_leadership(emp: dict, score: float, subs: dict, temperature: float = 1) -> str:
    """
    Default temperature set to 1 because some Azure deployments
    reject non-default values (like 0.3).
    """
    assert azure_chat_func is not None, "azure_chat not set; call set_azure_chat(azure_chat) in app.py"

    prompt = f"""
You are an HR leadership evaluator.
Leadership Potential Index: {score}/100
Subscores (0–10): {json.dumps(subs, indent=2)}

Write:
1) Leadership strengths (1–2 lines)
2) Development areas (1–2 lines)
3) Overall category: High / Moderate / Emerging

Employee profile:
{json.dumps(emp, indent=2)}
"""
    msgs = [
        {"role": "system", "content": "You are an HR analytics AI specializing in leadership potential."},
        {"role": "user", "content": prompt},
    ]
    # ✅ Use default temperature=1 for Azure compatibility
    return azure_chat_func(msgs, temperature=1)


# ---------- quick ping for testing ----------
@leadership_bp.get("/ping")
@cross_origin(origins=["http://localhost:3000"])
def ping():
    return {"ok": True}


# ---------- routes ----------
@leadership_bp.route("/", methods=["OPTIONS", "POST"])
@leadership_bp.route("",  methods=["OPTIONS", "POST"])  # no trailing slash
@cross_origin(origins=["http://localhost:3000"], allow_headers=["Content-Type"])
def leadership_batch():
    if request.method == "OPTIONS":
        return ("", 204)

    try:
        data = request.get_json(force=True, silent=True) or {}
        employees = data if isinstance(data, list) else data.get("employees") or []
        if not isinstance(employees, list) or len(employees) == 0:
            return jsonify({"error": "bad_request", "detail": "Expected non-empty employees array"}), 400

        results, skipped = [], 0
        for emp in employees:
            try:
                score, subs = compute_weighted_LPI(emp)
                try:
                    summary = summarize_leadership(emp, score, subs)
                except Exception as e:
                    summary = f"(AI summary unavailable: {e})"
                results.append({
                    "employee_id": emp.get("employee_id"),
                    "name": (emp.get("personal_info") or {}).get("name"),
                    "leadership_score": score,
                    "dimension_scores": subs,
                    "ai_summary": summary,
                })
            except Exception as e:
                skipped += 1
                results.append({
                    "employee_id": emp.get("employee_id"),
                    "name": (emp.get("personal_info") or {}).get("name"),
                    "error": f"scoring_failed: {e}",
                })

        return jsonify({"count": len(results), "skipped": skipped, "results": results}), 200

    except Exception as e:
        print("leadership_batch error:", repr(e))
        return jsonify({"error": "internal_error", "detail": str(e)}), 500


@leadership_bp.route("/one", methods=["OPTIONS", "POST"])
@leadership_bp.route("one",  methods=["OPTIONS", "POST"])  # no leading slash variant
@cross_origin(origins=["http://localhost:3000"], allow_headers=["Content-Type"])
def leadership_one():
    if request.method == "OPTIONS":
        return ("", 204)

    try:
        body = request.get_json(force=True, silent=True) or {}
        emp = body.get("employee")
        if not isinstance(emp, dict):
            return jsonify({"error": "bad_request", "detail": "Body must include 'employee' object"}), 400

        score, subs = compute_weighted_LPI(emp)
        try:
            summary = summarize_leadership(emp, score, subs)
        except Exception as e:
            summary = f"(AI summary unavailable: {e})"

        return jsonify({
            "employee_id": emp.get("employee_id"),
            "name": (emp.get("personal_info") or {}).get("name"),
            "leadership_score": score,
            "dimension_scores": subs,
            "ai_summary": summary,
        }), 200

    except Exception as e:
        print("leadership_one error:", repr(e))
        return jsonify({"error": "internal_error", "detail": str(e)}), 500
