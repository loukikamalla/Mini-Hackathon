import logging
from config import Config

logger = logging.getLogger(__name__)

supabase = None
is_supabase_connected = False

# Try initializing Supabase Cloud Client
if Config.SUPABASE_URL and Config.SUPABASE_KEY and "your-project-id" not in Config.SUPABASE_URL:
    try:
        from supabase import create_client, Client
        supabase: Client = create_client(Config.SUPABASE_URL, Config.SUPABASE_KEY)
        is_supabase_connected = True
        logger.info("Connected to Supabase Cloud Instance at %s", Config.SUPABASE_URL)
    except Exception as e:
        logger.warning("Supabase connection failed (%s), using local state storage.", e)
        is_supabase_connected = False
else:
    logger.info("Supabase URL/Key not configured yet. Running in local high-performance in-memory persistence mode.")
