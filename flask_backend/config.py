import os
from dotenv import load_dotenv

load_dotenv()

class Config:
    PORT = int(os.getenv("PORT", 5000))
    DEBUG = os.getenv("DEBUG", "True").lower() in ("true", "1", "t")
    SECRET_KEY = os.getenv("SECRET_KEY", "dhanya-cmr-secret-2025")
    
    # Supabase credentials
    SUPABASE_URL = os.getenv("SUPABASE_URL", "")
    SUPABASE_KEY = os.getenv("SUPABASE_KEY", "")
    SUPABASE_STORAGE_BUCKET = os.getenv("SUPABASE_STORAGE_BUCKET", "dhanya-documents")
    
    UPLOAD_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "uploads")
    CERT_FOLDER = os.path.join(os.path.dirname(os.path.abspath(__file__)), "generated_certs")
