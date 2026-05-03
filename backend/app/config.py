"""Configuration loaded from environment variables."""

import os
from dotenv import load_dotenv

load_dotenv()

# ─── Supabase Configuration ────────────────────────────────────────────────────
SUPABASE_URL: str = os.getenv("SUPABASE_URL", "")
SUPABASE_KEY: str = os.getenv("SUPABASE_KEY", "")
SUPABASE_SERVICE_ROLE_KEY: str = os.getenv("SUPABASE_SERVICE_ROLE_KEY", "")
SUPABASE_STORAGE_BUCKET: str = os.getenv("SUPABASE_STORAGE_BUCKET", "user-uploads")

# ─── Database (Supabase PostgreSQL) ──────────────────────────────────────────
DB_NAME: str = os.getenv("DB_NAME", "postgres")
DB_USER: str = os.getenv("DB_USER", "")
DB_PASSWORD: str = os.getenv("DB_PASSWORD", "")
DB_HOST: str = os.getenv("DB_HOST", "")
DB_PORT: str = os.getenv("DB_PORT", "6543")

# ─── JWT ─────────────────────────────────────────────────────────────────────
JWT_SECRET: str = os.getenv("JWT_SECRET", "dev-secret-change-in-production")
JWT_ALGORITHM: str = os.getenv("JWT_ALGORITHM", "HS256")
JWT_EXPIRATION_MINUTES: int = int(os.getenv("JWT_EXPIRATION_MINUTES", "1440"))

# ─── Data Paths ──────────────────────────────────────────────────────────────
BASE_DIR: str = os.path.dirname(os.path.dirname(__file__))
DATA_DIR: str = os.path.join(BASE_DIR, "data")
KAGGLE_DATA_PATH: str = os.getenv(
    "KAGGLE_DATA_PATH",
    os.path.join(DATA_DIR, "supermarket_sales.csv"),
)
TRAINED_MODEL_PATH: str = os.getenv(
    "TRAINED_MODEL_PATH",
    os.path.join(DATA_DIR, "trained_model.pkl"),
)
