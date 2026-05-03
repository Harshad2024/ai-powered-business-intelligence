"""Reports routes — detailed business reports from user's data."""

from fastapi import APIRouter, Depends, HTTPException
from app.utils.helpers import verify_token
from app.services.file_manager import load_user_dataframe
from app.services.data_processor import get_sales_by_city_report, get_profit_by_category

router = APIRouter()


def _load_user_data(user: dict):
    user_id = user.get("sub", "demo-user")
    try:
        return load_user_dataframe(user_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/sales-by-city")
async def report_sales_by_city(user: dict = Depends(verify_token)):
    """Get detailed city-wise sales report from user's data."""
    df, col_map = _load_user_data(user)
    return get_sales_by_city_report(df, col_map)


@router.get("/profit-by-category")
async def report_profit_by_category(user: dict = Depends(verify_token)):
    """Get category-wise profitability report from user's data."""
    df, col_map = _load_user_data(user)
    return get_profit_by_category(df, col_map)
