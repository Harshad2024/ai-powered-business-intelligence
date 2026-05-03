"""FastAPI application factory — with ML model training at startup."""

import logging
from contextlib import asynccontextmanager
from fastapi import FastAPI
from fastapi.middleware.cors import CORSMiddleware

from app.config import KAGGLE_DATA_PATH, TRAINED_MODEL_PATH
from app.routes import auth, upload, dashboard, sales, predict, reports
from app.services.ml_model import load_or_train_model

logging.basicConfig(level=logging.INFO)
logger = logging.getLogger(__name__)


@asynccontextmanager
async def lifespan(app: FastAPI):
    """Startup: train ML model on Kaggle data. Shutdown: cleanup."""
    # ── Startup ──────────────────────────────────────────────────────────
    logger.info("=" * 60)
    logger.info("Starting AI-Powered Business Intelligence API")
    logger.info("=" * 60)

    try:
        ml_state = load_or_train_model(KAGGLE_DATA_PATH, TRAINED_MODEL_PATH)
        app.state.ml_model = ml_state
        logger.info(
            f"✅ ML Model ready — "
            f"Growth rate: {ml_state['growth_rate']:.4f}, "
            f"Trained on {ml_state['training_months']} months, "
            f"{ml_state['training_total']} total sales"
        )
    except Exception as e:
        logger.error(f"❌ ML Model training failed: {e}")
        app.state.ml_model = None

    logger.info("=" * 60)
    logger.info("API is ready to accept requests")
    logger.info("=" * 60)

    yield  # App runs

    # ── Shutdown ─────────────────────────────────────────────────────────
    logger.info("Shutting down API")


app = FastAPI(
    title="AI-Powered Business Intelligence API",
    description="Backend API — trains ML model on Kaggle data, serves insights from user-uploaded CSVs",
    version="2.0.0",
    lifespan=lifespan,
)

# CORS — allow frontend dev server
app.add_middleware(
    CORSMiddleware,
    allow_origins=["http://localhost:5173", "http://127.0.0.1:5173", "http://localhost:5174", "http://127.0.0.1:5174", "http://localhost:3000"],
    allow_origin_regex=r"https://.*\.vercel\.app",
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

# Register route blueprints
app.include_router(auth.router, prefix="/api/auth", tags=["Authentication"])
app.include_router(upload.router, prefix="/api/upload", tags=["Upload"])
app.include_router(dashboard.router, prefix="/api/dashboard", tags=["Dashboard"])
app.include_router(sales.router, prefix="/api/sales", tags=["Sales"])
app.include_router(predict.router, prefix="/api/predict", tags=["Prediction"])
app.include_router(reports.router, prefix="/api/reports", tags=["Reports"])


@app.get("/")
async def root():
    ml_ready = app.state.ml_model is not None
    return {
        "message": "AI-Powered Business Intelligence API v2.0",
        "ml_model_ready": ml_ready,
    }


@app.get("/api/health")
async def health_check():
    ml_ready = app.state.ml_model is not None
    return {"status": "healthy", "ml_model_ready": ml_ready}
