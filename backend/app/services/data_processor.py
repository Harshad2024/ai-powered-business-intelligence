"""
Data processor — Pandas-powered analytics from user-uploaded CSV data.

Every function accepts:
  - df:      pd.DataFrame  (the user's uploaded data)
  - col_map: dict          (maps generic names → user's actual column names)

Expected col_map keys:
  Required: "date", and at least one of "quantity" or "total"
  Optional: "city", "category", "cogs", "gross_income"

Example col_map:
  {
    "date": "Order Date",
    "quantity": "Units Sold",
    "total": "Revenue",
    "city": "Region",
    "category": "Product Category"
  }
"""

import pandas as pd

CATEGORY_COLORS = [
    "hsl(215, 90%, 50%)",
    "hsl(145, 65%, 42%)",
    "hsl(38, 92%, 50%)",
    "hsl(265, 80%, 55%)",
    "hsl(350, 80%, 55%)",
    "hsl(180, 60%, 45%)",
    "hsl(30, 85%, 50%)",
    "hsl(300, 70%, 50%)",
    "hsl(200, 75%, 45%)",
    "hsl(60, 80%, 45%)",
]


def _prepare_df(df: pd.DataFrame, col_map: dict) -> pd.DataFrame:
    """Parse date column and add Month/MonthNum helper columns."""
    df = df.copy()
    df["_date"] = pd.to_datetime(df[col_map["date"]], format="mixed", dayfirst=False)
    df["_month"] = df["_date"].dt.strftime("%b %Y")
    df["_month_num"] = df["_date"].dt.to_period("M").astype(str)
    df["_month_sort"] = df["_date"].dt.to_period("M")
    return df


def _safe_numeric(df: pd.DataFrame, col_name: str) -> pd.Series:
    """Safely coerce a column to numeric (handles $1,234 style formatting)."""
    s = df[col_name].astype(str).str.replace(r"[$,]", "", regex=True)
    return pd.to_numeric(s, errors="coerce").fillna(0)


def _has(col_map: dict, key: str) -> bool:
    """Check if a key exists and is non-empty in col_map."""
    return bool(col_map.get(key))


# ─── KPI Stats ────────────────────────────────────────────────────────────────

def get_kpi_stats(df: pd.DataFrame, col_map: dict) -> dict:
    """Calculate KPI statistics from the user's data."""
    prepped = _prepare_df(df, col_map)

    total_sales = len(prepped)
    total_revenue = 0.0
    total_profit = 0.0

    if _has(col_map, "total"):
        total_revenue = round(float(_safe_numeric(prepped, col_map["total"]).sum()), 2)

    if _has(col_map, "gross_income"):
        total_profit = round(float(_safe_numeric(prepped, col_map["gross_income"]).sum()), 2)
    elif _has(col_map, "cogs") and _has(col_map, "total"):
        cogs = _safe_numeric(prepped, col_map["cogs"]).sum()
        total_profit = round(total_revenue - float(cogs), 2)

    total_quantity = 0
    if _has(col_map, "quantity"):
        total_quantity = int(_safe_numeric(prepped, col_map["quantity"]).sum())

    # Calculate month-over-month trend
    revenue_trend = _calc_trend(prepped, col_map, "total")
    sales_trend = _calc_trend(prepped, col_map, "quantity")

    return {
        "total_revenue": total_revenue,
        "total_profit": total_profit,
        "total_sales": total_quantity if total_quantity > 0 else total_sales,
        "predicted_sales": 0,  # Filled by ML model in route handler
        "revenue_trend": revenue_trend,
        "profit_trend": revenue_trend,  # Approximate with revenue trend
        "sales_trend": sales_trend,
        "predicted_trend": "+0%",
    }


def _calc_trend(df: pd.DataFrame, col_map: dict, key: str) -> str:
    """Calculate month-over-month trend percentage."""
    if not _has(col_map, key):
        return "+0%"

    monthly = df.groupby("_month_sort")[col_map[key]].apply(
        lambda x: _safe_numeric(pd.DataFrame({col_map[key]: x}), col_map[key]).sum()
    ).sort_index()

    if len(monthly) < 2:
        return "+0%"

    last = monthly.iloc[-1]
    prev = monthly.iloc[-2]
    if prev == 0:
        return "+0%"

    pct = ((last - prev) / prev) * 100
    sign = "+" if pct >= 0 else ""
    return f"{sign}{pct:.1f}%"


# ─── Monthly Trend ────────────────────────────────────────────────────────────

def get_monthly_trend(df: pd.DataFrame, col_map: dict) -> list[dict]:
    """Get monthly sales trend for line chart."""
    prepped = _prepare_df(df, col_map)

    groups = prepped.groupby(["_month_sort", "_month"])

    result = []
    for (sort_key, month_label), group in sorted(groups, key=lambda x: x[0][0]):
        entry = {"month": month_label}

        if _has(col_map, "quantity"):
            entry["sales"] = int(_safe_numeric(group, col_map["quantity"]).sum())
        elif _has(col_map, "total"):
            entry["sales"] = int(_safe_numeric(group, col_map["total"]).sum())

        if _has(col_map, "total"):
            entry["revenue"] = round(float(_safe_numeric(group, col_map["total"]).sum()), 2)

        result.append(entry)

    return result


# ─── City Sales ───────────────────────────────────────────────────────────────

def get_city_sales(df: pd.DataFrame, col_map: dict) -> list[dict]:
    """Get sales grouped by city for bar chart. Returns empty list if no city column."""
    if not _has(col_map, "city"):
        return []

    prepped = _prepare_df(df, col_map)
    city_col = col_map["city"]

    if _has(col_map, "total"):
        city = prepped.groupby(city_col).apply(
            lambda g: _safe_numeric(g, col_map["total"]).sum()
        ).reset_index()
        city.columns = ["city", "sales"]
    elif _has(col_map, "quantity"):
        city = prepped.groupby(city_col).apply(
            lambda g: _safe_numeric(g, col_map["quantity"]).sum()
        ).reset_index()
        city.columns = ["city", "sales"]
    else:
        return []

    city = city.sort_values("sales", ascending=False)
    return [
        {"city": str(row["city"]), "sales": round(float(row["sales"]), 2)}
        for _, row in city.iterrows()
    ]


# ─── Category Distribution ───────────────────────────────────────────────────

def get_category_data(df: pd.DataFrame, col_map: dict) -> list[dict]:
    """Get category distribution for pie chart. Returns empty list if no category column."""
    if not _has(col_map, "category"):
        return []

    prepped = _prepare_df(df, col_map)
    cat_col = col_map["category"]

    if _has(col_map, "total"):
        cat = prepped.groupby(cat_col).apply(
            lambda g: _safe_numeric(g, col_map["total"]).sum()
        )
    elif _has(col_map, "quantity"):
        cat = prepped.groupby(cat_col).apply(
            lambda g: _safe_numeric(g, col_map["quantity"]).sum()
        )
    else:
        return []

    total = cat.sum()
    if total == 0:
        return []

    result = []
    for i, (name, value) in enumerate(cat.items()):
        result.append({
            "name": str(name),
            "value": round(float((value / total) * 100), 1),
            "fill": CATEGORY_COLORS[i % len(CATEGORY_COLORS)],
        })

    return sorted(result, key=lambda x: x["value"], reverse=True)


# ─── Top Products ─────────────────────────────────────────────────────────────

def get_top_products(df: pd.DataFrame, col_map: dict) -> list[dict]:
    """Get top product categories. Returns empty list if no category column."""
    if not _has(col_map, "category"):
        return []

    prepped = _prepare_df(df, col_map)
    cat_col = col_map["category"]

    agg_dict = {}
    if _has(col_map, "quantity"):
        agg_dict["sales"] = (col_map["quantity"], lambda x: _safe_numeric(
            pd.DataFrame({col_map["quantity"]: x}), col_map["quantity"]).sum())

    if _has(col_map, "total"):
        agg_dict["revenue"] = (col_map["total"], lambda x: _safe_numeric(
            pd.DataFrame({col_map["total"]: x}), col_map["total"]).sum())

    if not agg_dict:
        return []

    # Build aggregation manually
    groups = prepped.groupby(cat_col)
    rows = []
    for cat_name, group in groups:
        row = {"name": str(cat_name)}
        if _has(col_map, "quantity"):
            row["sales"] = int(_safe_numeric(group, col_map["quantity"]).sum())
        if _has(col_map, "total"):
            row["revenue"] = round(float(_safe_numeric(group, col_map["total"]).sum()), 2)
        rows.append(row)

    rows.sort(key=lambda x: x.get("sales", x.get("revenue", 0)), reverse=True)
    total = sum(r.get("sales", r.get("revenue", 0)) for r in rows)

    result = []
    for i, row in enumerate(rows, 1):
        val = row.get("sales", row.get("revenue", 0))
        share = (val / total * 100) if total > 0 else 0
        result.append({
            "rank": i,
            "name": row["name"],
            "category": row["name"],
            "sales": row.get("sales", 0),
            "revenue": f"${row.get('revenue', 0):,.0f}" if "revenue" in row else "N/A",
            "growth": f"+{share:.0f}%",
        })

    return result


# ─── Reports ──────────────────────────────────────────────────────────────────

def get_sales_by_city_report(df: pd.DataFrame, col_map: dict) -> list[dict]:
    """Detailed city-wise sales report. Returns empty list if no city column."""
    if not _has(col_map, "city"):
        return []

    prepped = _prepare_df(df, col_map)
    city_col = col_map["city"]
    city_groups = prepped.groupby(city_col)

    result = []
    for city_name, group in city_groups:
        total_sales = int(_safe_numeric(group, col_map.get("quantity", col_map.get("total", ""))).sum()) if (_has(col_map, "quantity") or _has(col_map, "total")) else len(group)

        revenue = float(_safe_numeric(group, col_map["total"]).sum()) if _has(col_map, "total") else 0
        avg_order = revenue / len(group) if len(group) > 0 else 0

        top_cat = "N/A"
        if _has(col_map, "category"):
            cat_totals = group.groupby(col_map["category"]).size()
            if not cat_totals.empty:
                top_cat = str(cat_totals.idxmax())

        result.append({
            "city": str(city_name),
            "totalSales": total_sales,
            "revenue": f"${revenue:,.0f}",
            "avgOrder": f"${avg_order:,.0f}",
            "topCategory": top_cat,
        })

    return sorted(result, key=lambda x: x["totalSales"], reverse=True)


def get_profit_by_category(df: pd.DataFrame, col_map: dict) -> list[dict]:
    """Category-wise profitability report. Returns empty list if no category."""
    if not _has(col_map, "category"):
        return []

    prepped = _prepare_df(df, col_map)
    cat_col = col_map["category"]
    cat_groups = prepped.groupby(cat_col)

    result = []
    for cat_name, group in cat_groups:
        revenue = float(_safe_numeric(group, col_map["total"]).sum()) if _has(col_map, "total") else 0
        cost = float(_safe_numeric(group, col_map["cogs"]).sum()) if _has(col_map, "cogs") else 0
        profit = float(_safe_numeric(group, col_map["gross_income"]).sum()) if _has(col_map, "gross_income") else revenue - cost
        margin = (profit / revenue * 100) if revenue > 0 else 0

        result.append({
            "category": str(cat_name),
            "revenue": f"${revenue:,.0f}",
            "cost": f"${cost:,.0f}",
            "profit": f"${profit:,.0f}",
            "margin": f"{margin:.1f}%",
        })

    return sorted(result, key=lambda x: float(x["revenue"].replace("$", "").replace(",", "")), reverse=True)
