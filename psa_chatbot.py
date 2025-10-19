import json, requests, json
import pandas as pd
from flask import flask, request, jsonify
from psa_chatbot import CareerChatSession, read_data, system_prompt

app = flask(__name__)

def skill_file_reading_excel(xlsx_path):
    df = pd.read_excel(xlsx_path)
    skill_unit_data = []
    for _, row in df.iterrows():
        skill_unit_data.append({
            "function_unit_skill": row["Function / Unit / Skill"],
            "specialisation_unit": row["Specialisation / Unit"]
        })
    return json.dumps({"skill_unit_context": skill_unit_data})



class CareerChatSession:
    def __init__(self, api_url, api_key, employee_profile, all_employees, system_prompt):
        self.url = api_url
        self.headers = {"Content-Type": "application/json", "api-key": api_key}
        self.messages = [
            {"role": "system", "content": system_prompt},
            {"role" : "assistant", "content" :skill_file_reading_excel("Functions & Skills.xlsx")},
            {"role": "developer", "content": json.dumps({
                "employee_profile": employee_profile,
                "all_employees": all_employees
            })},
            
        ]

    def ask(self, user_input):
        MAX_HISTORY = 10

        self.messages.append({"role": "user", "content": user_input})

        # Trim history (keep system/developer + last MAX_HISTORY messages)
        if len(self.messages) > MAX_HISTORY + 2:  # +2 for the initial system/dev messages
            self.messages = self.messages[:2] + self.messages[-MAX_HISTORY:]

        # Send to model
        response = requests.post(self.url, headers=self.headers, json={"messages": self.messages})
        reply = response.json()["choices"][0]["message"]["content"]

        # Append assistant reply
        self.messages.append({"role": "assistant", "content": reply})

        return reply

def read_data(filepath, employee_id):
    """
    Takes in filepath
    returns all employee data + current employee data
    """
    with open(filepath, "r", encoding="utf-8") as f:
        employee_data = json.load(f)

        current_employee_id = employee_id ## Integrate with the DB reading, to get the employee ID out when logged in
        current_employee = next(emp for emp in employee_data if emp["employee_id"] == current_employee_id)

    return current_employee, employee_data


# System prompt
system_prompt = """
            You are an AI career mentor for PSA employees. You have full access to a structured HR dataset (skills, competencies, experiences, projects, education) for all users and a peer dataset for benchmarking.

            Your Mandate:

            1.  Recognize the current user based on the provided profile.
            2.  Synthesize anonymized peer data and department norms to identify the **top 3-5 most critical skill gaps** for the user's aspirational path, and/or the **top 3-5 high-potential strengths** they should leverage.
            3.  Provide specific, actionable, and **measurable** recommendations. All suggestions must define a clear scope (e.g., "Complete the Advanced Project Management course on the Learning Hub by Q2," or "Lead one defined cross-functional project for 6 months").
            4.  Suggest realistic skill-building projects, internal rotations, or learning paths directly relevant to the identified gaps.
            5.  Maintain a professional, **data-driven**, and conversational tone—like a trusted, objective internal mentor. Avoid generic motivational filler; all encouragement must be grounded in the user's specific progress or data profile.
            6.  Maintain a quick, high-value chat flow. Initial responses must be succinct, typically in 2-4 short paragraphs or utilizing lists, and should not exceed **100 words**. Only elaborate extensively when the user explicitly asks for more detail.

            Key Constraints (Non-Negotiable):

            * **NEVER** disclose raw employee data, specific employee names, job titles, or project names as context. Base suggestions only on anonymized, aggregated peer data (e.g., "People who have simialr jobscopes have also taken up these roles or projects").
            * Answer all user questions while prioritizing advice relevant *only* to the current user's profile.
            * Conclude your response with a relevant, open-ended question to guide the user to the next logical step in their career planning.
            * Reply in a friendly and approachale tone to the user (try to acknoledge who her/she is), and reassure them if they are facing any emotional issues.
            """


def main():
    current_employee, employee_data = read_data("Employee_Profiles.json", "EMP-20001")
    chat = CareerChatSession(
        api_url="https://psacodesprint2025.azure-api.net/openai/deployments/gpt-5-mini/chat/completions?api-version=2025-01-01-preview",
        api_key="api_key",
        employee_profile=current_employee,
        all_employees=employee_data,
        system_prompt=system_prompt
    )
    while True:
        reply = input("\n Question: ")
        answer = chat.ask(reply)
        print(answer)


if __name__ == "__main__":
    main()
