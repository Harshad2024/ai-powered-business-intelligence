"""Pydantic schemas for request/response validation."""

from pydantic import BaseModel
from typing import Optional


# ─── Auth ─────────────────────────────────────────────────────────────────────

class LoginRequest(BaseModel):
    email: str
    password: str


class SignupRequest(BaseModel):
    name: str
    email: str
    password: str


class AuthResponse(BaseModel):
    access_token: str
    user: dict


# ─── Upload ───────────────────────────────────────────────────────────────────

class UploadResponse(BaseModel):
    file_key: str
    original_name: str
    row_count: int
    columns: list[str]
    col_map: dict = {}
    mapping_done: bool = True


class UploadStatusResponse(BaseModel):
    has_file: bool
    file_key: Optional[str] = None
    original_name: Optional[str] = None
    row_count: Optional[int] = None
    columns: Optional[list[str]] = None
    mapping_done: bool = False
    col_map: Optional[dict] = None


# ─── Dashboard ────────────────────────────────────────────────────────────────

class KPIStats(BaseModel):
    total_revenue: float
    total_profit: float
    total_sales: int
    predicted_sales: int
    revenue_trend: str
    profit_trend: str
    sales_trend: str
    predicted_trend: str


class MonthlySale(BaseModel):
    month: str
    sales: Optional[float] = None
    revenue: Optional[float] = None


class CitySale(BaseModel):
    city: str
    sales: float


class CategoryData(BaseModel):
    name: str
    value: float
    fill: str


class TopProduct(BaseModel):
    rank: int
    name: str
    category: str
    sales: int
    revenue: str
    growth: str


# ─── Reports ──────────────────────────────────────────────────────────────────

class CityReport(BaseModel):
    city: str
    totalSales: int
    revenue: str
    avgOrder: str
    topCategory: str


class ProfitReport(BaseModel):
    category: str
    revenue: str
    cost: str
    profit: str
    margin: str


# ─── Prediction ───────────────────────────────────────────────────────────────

class PredictionRequest(BaseModel):
    months: int = 3


class PredictionResponse(BaseModel):
    predicted_sales: str
    months: int
    breakdown: list[int] = []
    chart_data: list[dict] = []


class PredictionHistoryItem(BaseModel):
    month: str
    actual: Optional[float] = None
    predicted: Optional[float] = None


# ─── Insights & Action Plan ─────────────────────────────────────────────────────

class InsightItem(BaseModel):
    type: str  # "success" | "warning" | "danger" | "info"
    title: str
    description: str
    metric: str

class ActionItem(BaseModel):
    category: str  # e.g., "Inventory", "Marketing", "Pricing", "Operations"
    action: str
    impact: str    # e.g., "High Impact", "Medium Impact"
    effort: str    # e.g., "Quick Win", "Requires Planning"

class InsightsResponse(BaseModel):
    insights: list[InsightItem]
    action_plan: list[ActionItem]


