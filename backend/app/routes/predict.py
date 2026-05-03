"""Prediction routes — ML-powered sales forecasting + actionable business insights."""

from fastapi import APIRouter, Depends, HTTPException, Request
from app.models.schemas import PredictionRequest, PredictionResponse, InsightsResponse
from app.utils.helpers import verify_token
from app.services.file_manager import load_user_dataframe
from app.services.ml_model import predict_sales, get_prediction_history, get_insights_and_action_plan

router = APIRouter()


def _load_user_data(user: dict):
    user_id = user.get("sub", "demo-user")
    try:
        return load_user_dataframe(user_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.post("", response_model=PredictionResponse)
async def run_prediction(req: PredictionRequest, request: Request, user: dict = Depends(verify_token)):
    """
    Run ML prediction on user's uploaded data.

    Uses the pre-trained model (loaded from .pkl at startup)
    applied to the user's monthly sales pattern.
    """
    ml_state = request.app.state.ml_model
    if ml_state is None:
        raise HTTPException(status_code=503, detail="ML model not available. Please restart the server.")

    df, col_map = _load_user_data(user)
    result = predict_sales(ml_state, df, col_map, req.months)
    return PredictionResponse(**result)


@router.get("/history")
async def prediction_history(request: Request, user: dict = Depends(verify_token)):
    """Get actual vs predicted chart data from user's uploaded data."""
    ml_state = request.app.state.ml_model
    if ml_state is None:
        raise HTTPException(status_code=503, detail="ML model not available.")

    df, col_map = _load_user_data(user)
    return get_prediction_history(ml_state, df, col_map)


@router.get("/insights", response_model=InsightsResponse)
async def get_insights(request: Request, user: dict = Depends(verify_token)):
    """
    Get actionable business insights and strategic action plan from user's uploaded data.
    """
    ml_state = request.app.state.ml_model
    if ml_state is None:
        raise HTTPException(status_code=503, detail="ML model not available.")

    df, col_map = _load_user_data(user)
    return get_insights_and_action_plan(ml_state, df, col_map)

