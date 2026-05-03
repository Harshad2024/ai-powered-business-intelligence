"""Dashboard routes — KPI stats and monthly trend from user's data."""

from fastapi import APIRouter, Depends, HTTPException, Request
from app.utils.helpers import verify_token
from app.services.file_manager import load_user_dataframe
from app.services.data_processor import get_kpi_stats, get_monthly_trend
from app.services.ml_model import get_predicted_total

router = APIRouter()


def _load_user_data(user: dict):
    """Helper to load user's data or raise appropriate error."""
    user_id = user.get("sub", "demo-user")
    try:
        return load_user_dataframe(user_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/stats")
async def dashboard_stats(request: Request, user: dict = Depends(verify_token)):
    """Get KPI statistics from the user's uploaded data."""
    df, col_map = _load_user_data(user)
    stats = get_kpi_stats(df, col_map)

    # Fill predicted sales from ML model
    ml_state = request.app.state.ml_model
    if ml_state is not None:
        predicted = get_predicted_total(ml_state, df, col_map)
        stats["predicted_sales"] = predicted
        stats["predicted_trend"] = f"+{(predicted / max(stats['total_sales'], 1) * 100):.1f}%"

    return stats


@router.get("/monthly-trend")
async def monthly_trend(user: dict = Depends(verify_token)):
    """Get monthly sales trend from the user's uploaded data."""
    df, col_map = _load_user_data(user)
    return get_monthly_trend(df, col_map)
