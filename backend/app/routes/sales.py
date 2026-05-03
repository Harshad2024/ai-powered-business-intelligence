"""Sales routes — city, category, products from user's uploaded data."""

from fastapi import APIRouter, Depends, HTTPException
from app.utils.helpers import verify_token
from app.services.file_manager import load_user_dataframe
from app.services.data_processor import get_city_sales, get_category_data, get_top_products

router = APIRouter()


def _load_user_data(user: dict):
    user_id = user.get("sub", "demo-user")
    try:
        return load_user_dataframe(user_id)
    except FileNotFoundError as e:
        raise HTTPException(status_code=404, detail=str(e))
    except ValueError as e:
        raise HTTPException(status_code=400, detail=str(e))


@router.get("/by-city")
async def sales_by_city(user: dict = Depends(verify_token)):
    """Get sales grouped by city from user's data. Returns [] if no city column."""
    df, col_map = _load_user_data(user)
    return get_city_sales(df, col_map)


@router.get("/by-category")
async def sales_by_category(user: dict = Depends(verify_token)):
    """Get category distribution from user's data. Returns [] if no category column."""
    df, col_map = _load_user_data(user)
    return get_category_data(df, col_map)


@router.get("/top-products")
async def top_products(user: dict = Depends(verify_token)):
    """Get top selling product lines from user's data."""
    df, col_map = _load_user_data(user)
    return get_top_products(df, col_map)
