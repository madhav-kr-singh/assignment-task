from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware
from .db import engine, Base
from .routers import complaints

# Create tables
Base.metadata.create_all(bind=engine)

# Dynamic schema migration for new columns
try:
    from sqlalchemy import text
    with engine.begin() as conn:
        try:
            conn.execute(text("ALTER TABLE complaints ADD COLUMN root_cause_category VARCHAR(255)"))
        except Exception:
            pass
        try:
            conn.execute(text("ALTER TABLE complaints ADD COLUMN capa_recommendation TEXT"))
        except Exception:
            pass
except Exception as e:
    print(f"Migration notice: {e}")

app = FastAPI(title="AIVOA Customer Complaint Management API", version="1.0.0")

# Setup CORS
app.add_middleware(
    CORSMiddleware,
    allow_origins=["*"],
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.include_router(complaints.router)

@app.get("/health")
def health_check():
    return {"status": "ok"}
