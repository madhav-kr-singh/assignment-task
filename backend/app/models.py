from sqlalchemy import Column, Integer, String, Text, DateTime
from datetime import datetime
from .db import Base

class Complaint(Base):
    __tablename__ = "complaints"

    id = Column(Integer, primary_key=True, index=True)
    complaint_source = Column(String(255), nullable=True)
    customer_name = Column(String(255), nullable=True)
    product_name = Column(String(255), nullable=True)
    product_strength_grade = Column(String(255), nullable=True)
    batch_lot_number = Column(String(100), nullable=True)
    manufacturing_date = Column(String(50), nullable=True)
    expiry_date = Column(String(50), nullable=True)
    quantity_affected = Column(String(150), nullable=True)
    complaint_type = Column(String(150), nullable=True)
    complaint_date = Column(String(50), nullable=True)
    detailed_description = Column(Text, nullable=True)
    initial_severity = Column(String(50), nullable=True)
    priority = Column(String(50), nullable=True)
    ai_next_action = Column(Text, nullable=True)
    ai_reasoning = Column(Text, nullable=True)
    ai_summary = Column(Text, nullable=True)
    ai_missing_fields = Column(Text, nullable=True)
    ai_completeness_score = Column(Integer, nullable=True)
    root_cause_category = Column(String(255), nullable=True)
    capa_recommendation = Column(Text, nullable=True)
    status = Column(String(50), default="Pending Triage")
    created_at = Column(DateTime, default=datetime.utcnow)
    updated_at = Column(DateTime, default=datetime.utcnow, onupdate=datetime.utcnow)
