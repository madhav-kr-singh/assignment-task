from pydantic import BaseModel
from typing import Optional, List

class ComplaintDraft(BaseModel):
    complaint_source: Optional[str] = None
    customer_name: Optional[str] = None
    product_name: Optional[str] = None
    product_strength_grade: Optional[str] = None
    batch_lot_number: Optional[str] = None
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None
    quantity_affected: Optional[str] = None
    complaint_type: Optional[str] = None
    complaint_date: Optional[str] = None
    detailed_description: Optional[str] = None
    initial_severity: Optional[str] = None
    priority: Optional[str] = None
    next_action: Optional[str] = None
    reasoning: Optional[str] = None
    root_cause_category: Optional[str] = None
    capa_recommendation: Optional[str] = None

class RiskAssessment(BaseModel):
    initial_severity: Optional[str] = None
    priority: Optional[str] = None
    next_action: Optional[str] = None
    reasoning: Optional[str] = None

class LogRequest(BaseModel):
    message: str
    current_draft: Optional[ComplaintDraft] = None

class EditRequest(BaseModel):
    message: str
    current_draft: ComplaintDraft

class ComplaintResponse(BaseModel):
    id: int
    complaint_source: Optional[str] = None
    customer_name: Optional[str] = None
    product_name: Optional[str] = None
    product_strength_grade: Optional[str] = None
    batch_lot_number: Optional[str] = None
    manufacturing_date: Optional[str] = None
    expiry_date: Optional[str] = None
    quantity_affected: Optional[str] = None
    complaint_type: Optional[str] = None
    complaint_date: Optional[str] = None
    detailed_description: Optional[str] = None
    initial_severity: Optional[str] = None
    priority: Optional[str] = None
    ai_next_action: Optional[str] = None
    ai_reasoning: Optional[str] = None
    ai_summary: Optional[str] = None
    ai_missing_fields: Optional[str] = None
    ai_completeness_score: Optional[int] = None
    root_cause_category: Optional[str] = None
    capa_recommendation: Optional[str] = None
    status: str
    created_at: str

    class Config:
        from_attributes = True
