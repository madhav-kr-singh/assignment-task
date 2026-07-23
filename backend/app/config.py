import os
from dotenv import load_dotenv

# Load env variables from .env file if it exists
load_dotenv()

GROQ_API_KEY = os.environ.get("GROQ_API_KEY", "")
GEMINI_API_KEY = os.environ.get("GEMINI_API_KEY", "")
GROQ_MODEL = os.environ.get("GEMINI_MODEL") or os.environ.get("GROQ_MODEL") or "llama-3.3-70b-versatile"
DATABASE_URL = os.environ.get("DATABASE_URL")
if not DATABASE_URL:
    raise ValueError("DATABASE_URL environment variable is required. Please set it in your .env file.")
