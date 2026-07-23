# AIVOA | AI-Powered QMS Customer Complaint Copilot

An AI-driven Quality Management System (QMS) Customer Complaint module built for the pharmaceutical manufacturing industry. The system automates logging, editing, risk assessment, and completeness checking of customer complaints.

## ?? Key Features

1. **AI-Powered Extraction**: Instantly extracts customer names, product names, strengths, batch numbers, manufacturing/expiry dates, and quantities from text or uploaded documents (PDF, DOCX, TXT, EML).
2. **Complaint Completeness Checker**: Dynamically calculates what % of required QMS fields are filled and displays a colored progress bar (Red/Amber/Green) showing exactly what is missing.
3. **Duplicate Complaint Detection & Guard**: Automatically queries the database to detect duplicate records with the same Product Name or Batch Number and blocks double-logging by disabling submit buttons.
4. **Suggested CAPA & Root Cause Recommendations**: Generates recommended corrective and preventive actions (CAPA) and root cause classifications automatically.
5. **Interactive Chat Assistant**: Operators can chat with the assistant to refine details, make edits, or ask questions in real-time.

---

## ??? Technology Stack

- **Frontend**: React, Redux Toolkit, TypeScript, Premium Vanilla CSS, Google Fonts.
- **Backend**: FastAPI, SQLAlchemy, LangGraph, SQLite/PostgreSQL.
- **LLM Engine**: Gemini (`gemini-3.1-flash-lite`) / Groq.

---

## ?? Setup & Run Instructions

### 1. Prerequisites
- Python 3.10+ installed.
- Node.js 18+ installed.

### 2. Backend Setup
1. Navigate to the `backend` directory:
   ```bash
   cd backend
   ```
2. Create and activate a virtual environment:
   ```bash
   python -m venv venv
   # On Windows:
   .\venv\Scripts\activate
   # On macOS/Linux:
   source venv/bin/activate
   ```
3. Install dependencies:
   ```bash
   pip install -r requirements.txt
   ```
4. Set up environment variables. Create a `.env` file in the `backend/` directory:
   ```env
   GEMINI_API_KEY="your-gemini-api-key"
   GEMINI_MODEL="gemini-3.1-flash-lite"
   # fallback (optional)
   GROQ_API_KEY="your-groq-api-key"
   DATABASE_URL="sqlite:///./complaints.db"
   ```
5. Start the backend development server:
   ```bash
   uvicorn app.main:app --port 8000 --reload
   ```

### 3. Frontend Setup
1. Navigate to the `frontend` directory:
   ```bash
   cd frontend
   ```
2. Install dependencies:
   ```bash
   npm install
   ```
3. Start the Vite development server:
   ```bash
   npm run dev
   ```
4. Open your browser and navigate to [http://localhost:3000](http://localhost:3000).
