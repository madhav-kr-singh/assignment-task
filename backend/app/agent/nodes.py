import os
import json
import re

try:
    import google.generativeai as genai
except ImportError:
    genai = None

try:
    from groq import Groq
except ImportError:
    Groq = None

from ..config import GROQ_API_KEY, GEMINI_API_KEY, GROQ_MODEL
from .state import AgentState
from .prompts import build_extract_prompt

# Provider setup
groq_client = None
gemini_model = None

if GEMINI_API_KEY and genai:
    try:
        genai.configure(api_key=GEMINI_API_KEY)
        # Use user model if configured as gemini, else fallback
        model_name = GROQ_MODEL if "gemini" in GROQ_MODEL.lower() else "gemini-3.5-flash"
        gemini_model = genai.GenerativeModel(model_name)
    except Exception as e:
        print(f"Warning: Failed to initialize Gemini model: {e}")

if GROQ_API_KEY and Groq and not gemini_model:
    try:
        groq_client = Groq(api_key=GROQ_API_KEY)
    except Exception as e:
        print(f"Warning: Failed to initialize Groq model: {e}")

def _call_llm_json(prompt: str) -> dict:
    # 1. Try Gemini if configured
    if gemini_model:
        try:
            response = gemini_model.generate_content(
                prompt,
                generation_config={"response_mime_type": "application/json", "temperature": 0.2}
            )
            text = response.text.strip()
            text = re.sub(r"^```(json)?|```$", "", text, flags=re.MULTILINE).strip()
            return json.loads(text)
        except Exception as e:
            print(f"Gemini processing error: {e}")

    # 2. Fallback to Groq
    if groq_client:
        try:
            resp = groq_client.chat.completions.create(
                model=GROQ_MODEL,
                messages=[{"role": "user", "content": prompt}],
                response_format={"type": "json_object"},
                temperature=0.2,
            )
            text = resp.choices[0].message.content
            text = re.sub(r"^```(json)?|```$", "", text.strip(), flags=re.MULTILINE).strip()
            return json.loads(text)
        except Exception as e:
            print(f"Groq processing error: {e}")

    # Fallback template if no key is configured
    return {}

def extract_fields(state: AgentState) -> dict:
    prompt = build_extract_prompt(state["mode"], state["raw_text"], state["current_draft"])
    extracted = _call_llm_json(prompt)
    return {"extracted": extracted}

def merge_fields(state: AgentState) -> dict:
    base = state["current_draft"] or {}
    new = {k: v for k, v in state["extracted"].items()
           if k not in ("summary", "assistant_message") and v is not None and v != ""}
    merged = {**base}
    for k, v in new.items():
        merged[k] = v
    return {"merged_draft": merged}

RISK_SCHEMA = """{
  "initial_severity": "Minor | Major | Critical",
  "priority": "Low | Medium | High | Urgent",
  "next_action": "string",
  "reasoning": "string, 1-2 sentences",
  "root_cause_category": "string",
  "capa_recommendation": "string"
}"""

def risk_assessment(state: AgentState) -> dict:
    draft = state.get("merged_draft") or {}
    
    desc = (draft.get("detailed_description") or "").strip().lower()
    is_greeting = desc in ["hi", "hii", "hello", "hey", "test", "ok", "yes", "no"]
    
    if is_greeting or (not draft.get("product_name") and not draft.get("detailed_description")):
        risk = {
            "initial_severity": "",
            "priority": "",
            "next_action": "",
            "reasoning": "",
            "root_cause_category": "",
            "capa_recommendation": ""
        }
        patched_draft = {**draft}
        for k in risk:
            patched_draft[k] = ""
        return {"risk": risk, "merged_draft": patched_draft}

    # If the LLM already performed risk assessment during the extraction phase, reuse it to save a round-trip
    if draft.get("initial_severity") and draft.get("priority"):
        risk = {
            "initial_severity": draft.get("initial_severity"),
            "priority": draft.get("priority"),
            "next_action": draft.get("next_action", ""),
            "reasoning": draft.get("reasoning", ""),
            "root_cause_category": draft.get("root_cause_category", ""),
            "capa_recommendation": draft.get("capa_recommendation", "")
        }
        return {"risk": risk, "merged_draft": draft}

    prompt = f"""You are a pharmaceutical QA risk assessor reviewing a customer
complaint for severity classification under a QMS. Given this complaint
record (JSON): {draft}
Return ONLY valid JSON matching this schema:
{RISK_SCHEMA}"""
    risk = _call_llm_json(prompt)
    patched_draft = {**draft}
    if risk:
        patched_draft["initial_severity"] = risk.get("initial_severity")
        patched_draft["priority"] = risk.get("priority")
        patched_draft["next_action"] = risk.get("next_action")
        patched_draft["reasoning"] = risk.get("reasoning")
        patched_draft["root_cause_category"] = risk.get("root_cause_category")
        patched_draft["capa_recommendation"] = risk.get("capa_recommendation")
    return {"risk": risk, "merged_draft": patched_draft}


REQUIRED_FIELDS = ["product_name", "batch_lot_number", "complaint_type",
                   "detailed_description", "customer_name"]

def completeness_check(state: AgentState) -> dict:
    d = state["merged_draft"] or {}
    missing = [f for f in REQUIRED_FIELDS if not d.get(f)]
    score = round(100 * (len(REQUIRED_FIELDS) - len(missing)) / len(REQUIRED_FIELDS))
    return {"missing_fields": missing, "completeness_score": score}

def compose_reply(state: AgentState) -> dict:
    draft = state.get("merged_draft") or {}
    desc = (draft.get("detailed_description") or "").strip().lower()
    is_greeting = desc in ["hi", "hii", "hello", "hey", "test", "ok", "yes", "no"]
    
    if is_greeting or (not draft.get("product_name") and not draft.get("detailed_description")):
        return {"reply": "Please send the complaint details and I will extract the information for you."}

    msg = state["extracted"].get("assistant_message", "Got it — I've processed the details.")
    risk = state["risk"] or {}
    severity = risk.get("initial_severity", "Unknown")
    action = risk.get("next_action", "No further action recommended")
    reply = f"{msg} Classified as **{severity}** severity — recommended action: {action}."
    if state["missing_fields"]:
        missing_names = [f.replace("_", " ").title() for f in state["missing_fields"]]
        reply += f" Still missing: {', '.join(missing_names)} ({state['completeness_score']}% complete)."
    else:
        reply += f" Complaint is 100% complete!"
    return {"reply": reply}
