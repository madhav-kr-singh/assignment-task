EXTRACT_SCHEMA = """{
  "complaint_source": "string or null (e.g., pharmacy name, distributor, email, customer)",
  "customer_name": "string or null (individual name reporting it, or organization)",
  "product_name": "string or null (e.g., Metformin, Amoxicillin)",
  "product_strength_grade": "string or null (e.g., 500 mg, IP/BP grade)",
  "batch_lot_number": "string or null (e.g., MFH260712A)",
  "manufacturing_date": "string or null (e.g., 12 June 2026)",
  "expiry_date": "string or null (e.g., 11 June 2028)",
  "quantity_affected": "string or null (e.g., 25 kg, 48 capsules)",
  "complaint_type": "string or null (e.g., Discoloration, Physical Defect, Packaging issue)",
  "complaint_date": "string or null (date the complaint was reported, or today's date)",
  "detailed_description": "string or null (summary of the exact quality issue described)",
  "summary": "string, one sentence summarizing the complaint",
  "assistant_message": "string, short friendly confirmation of what you extracted or updated",
  "initial_severity": "Minor | Major | Critical (Suggested clinical/quality severity)",
  "priority": "Low | Medium | High | Urgent (Resolution priority based on defect)",
  "next_action": "string (Suggested QMS next step, e.g. Quarantine batch, inspect retains, etc.)",
  "reasoning": "string (1-2 sentences reasoning for the severity and priority assessment)",
  "root_cause_category": "string (Suggested QMS root cause category, e.g., Equipment Failure, Human Error, Packaging Defect, Raw Material Issue, Process Deviation, or Unknown)",
  "capa_recommendation": "string (Suggested CAPA Action Plan, corrective and preventive actions, 1-2 sentences)"
}"""

def build_extract_prompt(mode: str, raw_text: str, current_draft: dict) -> str:
    rule_unrelated = 'CRITICAL RULE: If the user\'s message is a greeting (e.g., "hi", "hello", "hey"), simple test text, or unrelated to a pharmaceutical product defect, do NOT extract it as a complaint. In this case, you MUST set "detailed_description" and all risk assessment fields ("initial_severity", "priority", "next_action", "reasoning", "root_cause_category", "capa_recommendation") to null or empty string "". Do not output assistant comments like "The user said hi" into the description field.'

    if mode == "edit":
        return f"""You are updating an existing pharmaceutical complaint record.
{rule_unrelated}
Existing record (JSON): {current_draft}
The user says: "{raw_text}"
Return ONLY a JSON object matching this schema, but INCLUDE ONLY the fields
that should change or be updated based on the user's message. Do NOT include unchanged fields unless they are updated.
Do NOT use unescaped double quotes inside the JSON string values (always escape them as \\").
Schema:
{EXTRACT_SCHEMA}"""
    return f"""Extract structured complaint details and perform a QMS risk assessment on this pharmaceutical
customer complaint text.
{rule_unrelated}
Return ONLY valid JSON matching this schema — no
markdown, no commentary, no code fences. Use null for anything not mentioned.
Do NOT use unescaped double quotes inside the JSON string values (always escape them as \\").
Schema:
{EXTRACT_SCHEMA}
 
Complaint text:
\"\"\"{raw_text}\"\"\""""
