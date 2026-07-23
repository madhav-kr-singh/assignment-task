import json
from fastapi import APIRouter, Depends, UploadFile, File, Form, HTTPException
from sqlalchemy.orm import Session
from typing import Optional, List
from ..db import get_db
from ..models import Complaint
from ..schemas import LogRequest, EditRequest, ComplaintDraft, ComplaintResponse
from ..agent.graph import complaint_graph
from ..utils.doc_parser import extract_text

router = APIRouter(prefix="/api/complaints", tags=["complaints"])

@router.post("/log")
async def log_complaint(req: LogRequest):
    state = {
        "mode": "new",
        "raw_text": req.message,
        "current_draft": req.current_draft.model_dump() if req.current_draft else {},
        "extracted": {},
        "merged_draft": {},
        "risk": {},
        "missing_fields": [],
        "completeness_score": 0,
        "reply": ""
    }
    try:
        res = await complaint_graph.ainvoke(state)
        return {
            "draft": res["merged_draft"],
            "risk": res["risk"],
            "reply": res["reply"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/edit")
async def edit_complaint(req: EditRequest):
    state = {
        "mode": "edit",
        "raw_text": req.message,
        "current_draft": req.current_draft.model_dump(),
        "extracted": {},
        "merged_draft": {},
        "risk": {},
        "missing_fields": [],
        "completeness_score": 0,
        "reply": ""
    }
    try:
        res = await complaint_graph.ainvoke(state)
        return {
            "draft": res["merged_draft"],
            "risk": res["risk"],
            "reply": res["reply"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.post("/extract-document")
async def extract_document(
    file: UploadFile = File(...),
    current_draft: Optional[str] = Form(None)
):
    raw_bytes = await file.read()
    text = extract_text(file.filename, raw_bytes)
    
    draft_dict = {}
    if current_draft:
        try:
            draft_dict = json.loads(current_draft)
        except Exception:
            pass

    state = {
        "mode": "document",
        "raw_text": text,
        "current_draft": draft_dict,
        "extracted": {},
        "merged_draft": {},
        "risk": {},
        "missing_fields": [],
        "completeness_score": 0,
        "reply": ""
    }
    try:
        res = await complaint_graph.ainvoke(state)
        return {
            "draft": res["merged_draft"],
            "risk": res["risk"],
            "reply": res["reply"]
        }
    except Exception as e:
        raise HTTPException(status_code=500, detail=str(e))

@router.get("/check-duplicates")
def check_duplicates(
    product_name: Optional[str] = None,
    batch_lot_number: Optional[str] = None,
    db: Session = Depends(get_db)
):
    if not product_name and not batch_lot_number:
        return {"count": 0, "duplicates": []}
    
    from sqlalchemy import or_
    filters = []
    if product_name and product_name.strip():
        filters.append(Complaint.product_name.ilike(product_name.strip()))
    if batch_lot_number and batch_lot_number.strip():
        filters.append(Complaint.batch_lot_number.ilike(batch_lot_number.strip()))
        
    if not filters:
        return {"count": 0, "duplicates": []}
        
    items = db.query(Complaint).filter(or_(*filters)).all()
    return {
        "count": len(items),
        "duplicates": [
            {
                "id": item.id,
                "product_name": item.product_name,
                "batch_lot_number": item.batch_lot_number,
                "created_at": item.created_at.strftime("%Y-%m-%d")
            } for item in items
        ]
    }

@router.post("")
def save_complaint(draft: ComplaintDraft, db: Session = Depends(get_db)):
    missing = [f for f in ["product_name", "batch_lot_number", "complaint_type", "detailed_description", "customer_name"] if not getattr(draft, f, None)]
    score = round(100 * (5 - len(missing)) / 5)
    
    summary = draft.detailed_description[:100] + "..." if draft.detailed_description else "New Complaint"

    complaint = Complaint(
        complaint_source=draft.complaint_source,
        customer_name=draft.customer_name,
        product_name=draft.product_name,
        product_strength_grade=draft.product_strength_grade,
        batch_lot_number=draft.batch_lot_number,
        manufacturing_date=draft.manufacturing_date,
        expiry_date=draft.expiry_date,
        quantity_affected=draft.quantity_affected,
        complaint_type=draft.complaint_type,
        complaint_date=draft.complaint_date,
        detailed_description=draft.detailed_description,
        initial_severity=draft.initial_severity,
        priority=draft.priority,
        ai_next_action=draft.next_action or "Investigation initialized",
        ai_reasoning=draft.reasoning or "Risk assessment completed",
        ai_summary=summary,
        ai_missing_fields=", ".join(missing),
        ai_completeness_score=score,
        root_cause_category=draft.root_cause_category,
        capa_recommendation=draft.capa_recommendation,
        status="Pending Triage"
    )
    db.add(complaint)
    db.commit()
    db.refresh(complaint)
    return {"id": complaint.id}

@router.get("", response_model=List[ComplaintResponse])
def list_complaints(db: Session = Depends(get_db)):
    items = db.query(Complaint).order_by(Complaint.created_at.desc()).all()
    res = []
    for item in items:
        res.append(ComplaintResponse(
            id=item.id,
            complaint_source=item.complaint_source,
            customer_name=item.customer_name,
            product_name=item.product_name,
            product_strength_grade=item.product_strength_grade,
            batch_lot_number=item.batch_lot_number,
            manufacturing_date=item.manufacturing_date,
            expiry_date=item.expiry_date,
            quantity_affected=item.quantity_affected,
            complaint_type=item.complaint_type,
            complaint_date=item.complaint_date,
            detailed_description=item.detailed_description,
            initial_severity=item.initial_severity,
            priority=item.priority,
            ai_next_action=item.ai_next_action,
            ai_reasoning=item.ai_reasoning,
            ai_summary=item.ai_summary,
            ai_missing_fields=item.ai_missing_fields,
            ai_completeness_score=item.ai_completeness_score,
            root_cause_category=item.root_cause_category,
            capa_recommendation=item.capa_recommendation,
            status=item.status,
            created_at=item.created_at.strftime("%Y-%m-%d %H:%M:%S")
        ))
    return res

@router.get("/{id}", response_model=ComplaintResponse)
def get_complaint(id: int, db: Session = Depends(get_db)):
    item = db.query(Complaint).filter(Complaint.id == id).first()
    if not item:
        raise HTTPException(status_code=404, detail="Complaint not found")
    return ComplaintResponse(
        id=item.id,
        complaint_source=item.complaint_source,
        customer_name=item.customer_name,
        product_name=item.product_name,
        product_strength_grade=item.product_strength_grade,
        batch_lot_number=item.batch_lot_number,
        manufacturing_date=item.manufacturing_date,
        expiry_date=item.expiry_date,
        quantity_affected=item.quantity_affected,
        complaint_type=item.complaint_type,
        complaint_date=item.complaint_date,
        detailed_description=item.detailed_description,
        initial_severity=item.initial_severity,
        priority=item.priority,
        ai_next_action=item.ai_next_action,
        ai_reasoning=item.ai_reasoning,
        ai_summary=item.ai_summary,
        ai_missing_fields=item.ai_missing_fields,
        ai_completeness_score=item.ai_completeness_score,
        root_cause_category=item.root_cause_category,
        capa_recommendation=item.capa_recommendation,
        status=item.status,
        created_at=item.created_at.strftime("%Y-%m-%d %H:%M:%S")
    )
