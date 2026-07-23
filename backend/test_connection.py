import os
import sys
from sqlalchemy import create_engine
from dotenv import load_dotenv

# Load env variables manually from the project folder
load_dotenv(r"c:\Users\ADMIN\Desktop\AIVOA.ai\backend\.env")

db_url = os.environ.get("DATABASE_URL")
if not db_url:
    print("Error: DATABASE_URL is not set in backend/.env")
    sys.exit(1)

# Clean up brackets around IPv6 hosts if sqlalchemy needs it
# But standard psycopg2 parses db.miylidlcupljiuexjjqo.supabase.co directly!
print(f"Testing database connection using: {db_url[:40]}...")

try:
    engine = create_engine(db_url)
    conn = engine.connect()
    print("\n=========================================")
    print("SUCCESS: Connected to database successfully!")
    print("=========================================\n")
    conn.close()
    sys.exit(0)
except Exception as e:
    print("\n=========================================")
    print(f"FAILED to connect to database: {e}")
    print("=========================================\n")
    sys.exit(1)
