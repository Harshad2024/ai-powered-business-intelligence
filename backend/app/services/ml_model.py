"""
ML Model — scikit-learn Linear Regression for sales prediction.

Architecture (Senior-Engineer Approach):
  1. TRAIN ONCE on the Kaggle supermarket_sales.csv reference dataset
  2. PERSIST the trained model + scaler + metadata to a .pkl file using joblib
  3. On every subsequent startup, LOAD the .pkl from disk — zero retraining
  4. PREDICT on each user's uploaded data using the pre-trained model's
     learned growth trend
  5. GENERATE INSIGHTS — actionable business intelligence from user data

The .pkl file stores: { model, scaler, slope, intercept, avg_monthly,
growth_rate, training_months, training_total }
"""

import os
import numpy as np
import pandas as pd
import joblib
from sklearn.linear_model import LinearRegression
from sklearn.preprocessing import StandardScaler
import logging

logger = logging.getLogger(__name__)

MONTH_NAMES = ["Jan", "Feb", "Mar", "Apr", "May", "Jun",
               "Jul", "Aug", "Sep", "Oct", "Nov", "Dec"]


# ─── Load or Train ───────────────────────────────────────────────────────────

def load_or_train_model(kaggle_csv_path: str, model_pkl_path: str) -> dict:
    """
    Smart model loader:
      - If model_pkl_path exists → load from disk (instant).
      - Otherwise → train on kaggle_csv_path, save to model_pkl_path.

    Returns the ml_state dict used by all prediction/insight functions.
    """
    if os.path.exists(model_pkl_path):
        return _load_model(model_pkl_path)
    else:
        return _train_and_save(kaggle_csv_path, model_pkl_path)


def _load_model(pkl_path: str) -> dict:
    """Load a pre-trained model from .pkl file."""
    logger.info(f"Loading pre-trained model from: {pkl_path}")
    ml_state = joblib.load(pkl_path)
    logger.info(
        f"✅ Model loaded — Growth rate: {ml_state['growth_rate']:.4f}, "
        f"Trained on {ml_state['training_months']} months, "
        f"{ml_state['training_total']} total sales"
    )
    return ml_state


def _train_and_save(kaggle_csv_path: str, pkl_path: str) -> dict:
    """Train model on Kaggle dataset, persist to .pkl, return ml_state."""
    logger.info(f"No pre-trained model found. Training from: {kaggle_csv_path}")

    df = pd.read_csv(kaggle_csv_path)
    df["Date"] = pd.to_datetime(df["Date"], format="mixed", dayfirst=False)

    # Aggregate monthly sales
    df["MonthNum"] = (
        (df["Date"].dt.year - df["Date"].dt.year.min()) * 12
        + df["Date"].dt.month
    )
    monthly = df.groupby("MonthNum")["Quantity"].sum().reset_index()
    monthly.columns = ["month_num", "sales"]
    monthly = monthly.sort_values("month_num")

    # Normalize month numbers to start from 1
    monthly["month_idx"] = range(1, len(monthly) + 1)

    X = monthly["month_idx"].values.reshape(-1, 1)
    y = monthly["sales"].values

    # Scale features
    scaler = StandardScaler()
    X_scaled = scaler.fit_transform(X)

    # Train model
    model = LinearRegression()
    model.fit(X_scaled, y)

    slope = float(model.coef_[0])
    intercept = float(model.intercept_)
    avg_monthly = float(y.mean())

    # Calculate normalized growth rate (% growth per month)
    growth_rate = slope / avg_monthly if avg_monthly > 0 else 0

    ml_state = {
        "model": model,
        "scaler": scaler,
        "slope": slope,
        "intercept": intercept,
        "avg_monthly": avg_monthly,
        "growth_rate": growth_rate,
        "training_months": len(monthly),
        "training_total": int(monthly["sales"].sum()),
    }

    # Persist to .pkl
    os.makedirs(os.path.dirname(pkl_path), exist_ok=True)
    joblib.dump(ml_state, pkl_path)
    logger.info(
        f"✅ Model trained & saved to {pkl_path} — "
        f"Slope: {slope:.2f}, Intercept: {intercept:.2f}, "
        f"Avg monthly sales: {avg_monthly:.0f}, Growth rate: {growth_rate:.4f}"
    )

    return ml_state


# ─── Predict on User Data ────────────────────────────────────────────────────

def predict_sales(ml_state: dict, user_df: pd.DataFrame, col_map: dict, months_ahead: int = 3) -> dict:
    """
    Predict future sales for a user using the pre-trained model.
    """
    user_monthly = _get_user_monthly(user_df, col_map)

    if not user_monthly:
        return {
            "predicted_sales": "0 units",
            "months": months_ahead,
            "breakdown": [0] * months_ahead,
            "chart_data": [],
        }

    growth_rate = ml_state["growth_rate"]

    # User's baseline: average of last 2 months or all available
    recent = list(user_monthly.values())
    baseline = np.mean(recent[-min(2, len(recent)):])

    # Predict future months using growth rate
    breakdown = []
    for i in range(1, months_ahead + 1):
        # Apply learned growth rate to user's baseline
        predicted = baseline * (1 + growth_rate * i)
        predicted = max(0, int(predicted))  # No negative sales
        breakdown.append(predicted)

    total_predicted = sum(breakdown)

    # Build chart data
    chart_data = []
    for month_label, actual_val in user_monthly.items():
        chart_data.append({
            "month": month_label,
            "actual": int(actual_val),
            "predicted": None,
        })

    if chart_data:
        chart_data[-1]["predicted"] = chart_data[-1]["actual"]

    last_date = pd.to_datetime(user_df[col_map["date"]], format="mixed", dayfirst=False).max()
    for i, pred_val in enumerate(breakdown, 1):
        future_date = last_date + pd.DateOffset(months=i)
        month_label = future_date.strftime("%b %Y")
        chart_data.append({
            "month": month_label,
            "actual": None,
            "predicted": pred_val,
        })

    return {
        "predicted_sales": f"{total_predicted:,} units",
        "months": months_ahead,
        "breakdown": breakdown,
        "chart_data": chart_data,
    }


def get_prediction_history(ml_state: dict, user_df: pd.DataFrame, col_map: dict) -> list[dict]:
    result = predict_sales(ml_state, user_df, col_map, months_ahead=3)
    return result.get("chart_data", [])


def get_predicted_total(ml_state: dict, user_df: pd.DataFrame, col_map: dict) -> int:
    result = predict_sales(ml_state, user_df, col_map, months_ahead=3)
    return sum(result.get("breakdown", [0]))


# ─── Business Insights Engine ────────────────────────────────────────────────

def generate_insights(ml_state: dict, user_df: pd.DataFrame, col_map: dict) -> list[dict]:
    """
    Analyze user data and generate actionable business insights.
    Each insight: { type: success|warning|danger|info, title, description, metric }
    """
    insights = []
    df = user_df.copy()

    # Parse date
    df["_date"] = pd.to_datetime(df[col_map["date"]], format="mixed", dayfirst=False)

    # Determine value columns
    has_quantity = col_map.get("quantity") and col_map["quantity"] in df.columns
    has_total = col_map.get("total") and col_map["total"] in df.columns
    has_category = col_map.get("category") and col_map["category"] in df.columns
    has_city = col_map.get("city") and col_map["city"] in df.columns
    has_cogs = col_map.get("cogs") and col_map["cogs"] in df.columns
    has_gross = col_map.get("gross_income") and col_map["gross_income"] in df.columns

    # Helper: safe numeric
    def _num(col: str) -> pd.Series:
        return pd.to_numeric(
            df[col].astype(str).str.replace(r"[$,]", "", regex=True),
            errors="coerce"
        ).fillna(0)

    # ── 1. Overall Sales Trend ────────────────────────────────────────────
    df["_period"] = df["_date"].dt.to_period("M")
    val_col = col_map.get("quantity") if has_quantity else col_map.get("total")
    if val_col:
        df["_val"] = _num(val_col)
        monthly = df.groupby("_period")["_val"].sum().sort_index()

        if len(monthly) >= 2:
            last_month = monthly.iloc[-1]
            prev_month = monthly.iloc[-2]
            if prev_month > 0:
                change_pct = ((last_month - prev_month) / prev_month) * 100
                if change_pct > 0:
                    insights.append({
                        "type": "success",
                        "title": "Sales Growing",
                        "description": (
                            f"Your sales grew {change_pct:.1f}% from "
                            f"{monthly.index[-2]} to {monthly.index[-1]}. "
                            f"Keep this momentum — consider increasing inventory for high-demand items."
                        ),
                        "metric": f"+{change_pct:.1f}%",
                    })
                else:
                    insights.append({
                        "type": "danger",
                        "title": "Sales Declining",
                        "description": (
                            f"Your sales dropped {abs(change_pct):.1f}% from "
                            f"{monthly.index[-2]} to {monthly.index[-1]}. "
                            f"Investigate pricing, stock availability, or consider running promotions."
                        ),
                        "metric": f"{change_pct:.1f}%",
                    })

            # Peak & lowest month
            peak_month = monthly.idxmax()
            low_month = monthly.idxmin()
            insights.append({
                "type": "info",
                "title": "Best Month",
                "description": (
                    f"Your highest sales were in {peak_month} with "
                    f"{int(monthly.max()):,} units. Plan your inventory "
                    f"and staffing to capitalize on this seasonal peak."
                ),
                "metric": f"{int(monthly.max()):,}",
            })
            if str(peak_month) != str(low_month):
                insights.append({
                    "type": "warning",
                    "title": "Weakest Month",
                    "description": (
                        f"Your lowest sales were in {low_month} with "
                        f"{int(monthly.min()):,} units. Consider discounts "
                        f"or special offers during this period to boost sales."
                    ),
                    "metric": f"{int(monthly.min()):,}",
                })

    # ── 2. Category Insights ──────────────────────────────────────────────
    if has_category:
        cat_col = col_map["category"]

        # Sales by category
        if has_quantity:
            cat_sales = df.groupby(cat_col).apply(
                lambda g: _num(col_map["quantity"]).loc[g.index].sum()
            ).sort_values(ascending=False)
        elif has_total:
            cat_sales = df.groupby(cat_col).apply(
                lambda g: _num(col_map["total"]).loc[g.index].sum()
            ).sort_values(ascending=False)
        else:
            cat_sales = pd.Series(dtype=float)

        if len(cat_sales) > 0:
            top_cat = cat_sales.index[0]
            top_val = cat_sales.iloc[0]
            total = cat_sales.sum()
            top_share = (top_val / total * 100) if total > 0 else 0

            insights.append({
                "type": "success",
                "title": f"Top Category: {top_cat}",
                "description": (
                    f"\"{top_cat}\" is your best seller, contributing "
                    f"{top_share:.0f}% of total sales ({int(top_val):,} units). "
                    f"Ensure consistent stock and consider expanding this category."
                ),
                "metric": f"{top_share:.0f}%",
            })

            if len(cat_sales) > 1:
                worst_cat = cat_sales.index[-1]
                worst_val = cat_sales.iloc[-1]
                worst_share = (worst_val / total * 100) if total > 0 else 0
                insights.append({
                    "type": "warning",
                    "title": f"Lowest Category: {worst_cat}",
                    "description": (
                        f"\"{worst_cat}\" accounts for only {worst_share:.0f}% of sales "
                        f"({int(worst_val):,} units). Consider promotions, bundling with "
                        f"popular items, or reducing shelf space to cut costs."
                    ),
                    "metric": f"{worst_share:.0f}%",
                })

        # Profitability by category
        if has_total and (has_cogs or has_gross):
            cat_profits = []
            for cat_name, group in df.groupby(cat_col):
                revenue = _num(col_map["total"]).loc[group.index].sum()
                if has_gross:
                    profit = _num(col_map["gross_income"]).loc[group.index].sum()
                elif has_cogs:
                    cogs = _num(col_map["cogs"]).loc[group.index].sum()
                    profit = revenue - cogs
                else:
                    profit = 0
                margin = (profit / revenue * 100) if revenue > 0 else 0
                cat_profits.append({
                    "name": str(cat_name),
                    "revenue": revenue,
                    "profit": profit,
                    "margin": margin,
                })

            cat_profits.sort(key=lambda x: x["margin"], reverse=True)

            if cat_profits:
                best = cat_profits[0]
                insights.append({
                    "type": "success",
                    "title": f"Most Profitable: {best['name']}",
                    "description": (
                        f"\"{best['name']}\" has the highest profit margin at "
                        f"{best['margin']:.1f}%. Revenue: ${best['revenue']:,.0f}, "
                        f"Profit: ${best['profit']:,.0f}. Prioritize this category "
                        f"for maximum profitability."
                    ),
                    "metric": f"{best['margin']:.1f}%",
                })

                if len(cat_profits) > 1:
                    worst = cat_profits[-1]
                    if worst["margin"] < 10:
                        insights.append({
                            "type": "danger",
                            "title": f"Low Margin: {worst['name']}",
                            "description": (
                                f"\"{worst['name']}\" has only {worst['margin']:.1f}% profit margin. "
                                f"Revenue: ${worst['revenue']:,.0f}, Profit: ${worst['profit']:,.0f}. "
                                f"Review supplier costs or adjust pricing to improve margins."
                            ),
                            "metric": f"{worst['margin']:.1f}%",
                        })

    # ── 3. City/Region Insights ───────────────────────────────────────────
    if has_city:
        city_col = col_map["city"]
        if has_total:
            city_sales = df.groupby(city_col).apply(
                lambda g: _num(col_map["total"]).loc[g.index].sum()
            ).sort_values(ascending=False)
        elif has_quantity:
            city_sales = df.groupby(city_col).apply(
                lambda g: _num(col_map["quantity"]).loc[g.index].sum()
            ).sort_values(ascending=False)
        else:
            city_sales = pd.Series(dtype=float)

        if len(city_sales) > 0:
            best_city = city_sales.index[0]
            best_val = city_sales.iloc[0]
            insights.append({
                "type": "info",
                "title": f"Top Region: {best_city}",
                "description": (
                    f"\"{best_city}\" is your strongest market with "
                    f"${best_val:,.0f} in total sales. Consider opening "
                    f"more outlets or increasing marketing spend here."
                ),
                "metric": f"${best_val:,.0f}",
            })

            if len(city_sales) > 1:
                worst_city = city_sales.index[-1]
                worst_val = city_sales.iloc[-1]
                gap = best_val - worst_val
                insights.append({
                    "type": "warning",
                    "title": f"Lowest Region: {worst_city}",
                    "description": (
                        f"\"{worst_city}\" lags behind by ${gap:,.0f} compared to "
                        f"the top region. Investigate local demand, competition, "
                        f"or delivery issues."
                    ),
                    "metric": f"${worst_val:,.0f}",
                })

    # ── 4. Revenue Insights ───────────────────────────────────────────────
    if has_total:
        total_rev = _num(col_map["total"]).sum()
        avg_transaction = total_rev / len(df) if len(df) > 0 else 0
        insights.append({
            "type": "info",
            "title": "Average Transaction Value",
            "description": (
                f"Each transaction averages ${avg_transaction:,.2f}. "
                f"Total revenue: ${total_rev:,.0f} from {len(df):,} transactions. "
                f"Upselling and cross-selling can help increase this value."
            ),
            "metric": f"${avg_transaction:,.2f}",
        })

    # ── 5. ML Prediction Insight ──────────────────────────────────────────
    if ml_state:
        pred = predict_sales(ml_state, user_df, col_map, months_ahead=3)
        total_predicted = sum(pred.get("breakdown", []))
        if total_predicted > 0:
            insights.append({
                "type": "info",
                "title": "3-Month Sales Forecast",
                "description": (
                    f"Based on ML analysis, your predicted sales for the next "
                    f"3 months are {total_predicted:,} units. The model uses "
                    f"growth trends learned from retail reference data applied "
                    f"to your actual sales pattern."
                ),
                "metric": f"{total_predicted:,}",
            })

    return insights


def generate_action_plan(insights: list[dict]) -> list[dict]:
    """
    Generate actionable business recommendations based on the generated insights.
    Returns list of: { category, action, impact, effort }
    """
    plan = []
    
    for i in insights:
        title = i.get("title", "")
        desc = i.get("description", "")
        
        if "Sales Declining" in title:
            plan.append({
                "category": "Marketing & Sales",
                "action": "Run a targeted promotional campaign or discount offer to reverse the declining sales trend.",
                "impact": "High",
                "effort": "Medium"
            })
            plan.append({
                "category": "Pricing Strategy",
                "action": "Review pricing against competitors to ensure you are not losing market share due to pricing.",
                "impact": "High",
                "effort": "Low"
            })
            
        if "Weakest Month" in title:
            plan.append({
                "category": "Inventory Management",
                "action": f"Reduce inventory ordering prior to your historically weakest month to minimize holding costs.",
                "impact": "Medium",
                "effort": "Low"
            })
            
        if "Best Month" in title:
            plan.append({
                "category": "Operations",
                "action": "Ensure adequate staffing and stock levels before your peak month to maximize revenue.",
                "impact": "High",
                "effort": "Medium"
            })

        if "Lowest Category" in title:
            cat_name = title.replace("Lowest Category: ", "")
            plan.append({
                "category": "Product Strategy",
                "action": f"Bundle '{cat_name}' with high-performing products, or consider reducing shelf space if margins are also low.",
                "impact": "Medium",
                "effort": "Low"
            })
            
        if "Low Margin" in title:
            cat_name = title.replace("Low Margin: ", "")
            plan.append({
                "category": "Pricing Strategy",
                "action": f"Renegotiate supplier costs or slightly increase retail price for '{cat_name}' to improve the profit margin.",
                "impact": "High",
                "effort": "Medium"
            })
            
        if "Lowest Region" in title:
            reg_name = title.replace("Lowest Region: ", "")
            plan.append({
                "category": "Marketing & Sales",
                "action": f"Increase localized marketing spend or run regional promotions in '{reg_name}' to close the sales gap.",
                "impact": "Medium",
                "effort": "Medium"
            })

    # Default general plans if few insights
    if not any(p["category"] == "Customer Loyalty" for p in plan):
         plan.append({
             "category": "Customer Loyalty",
             "action": "Implement a customer reward program to increase the average transaction value and return visits.",
             "impact": "Medium",
             "effort": "High"
         })

    return plan

def get_insights_and_action_plan(ml_state: dict, user_df: pd.DataFrame, col_map: dict) -> dict:
    insights = generate_insights(ml_state, user_df, col_map)
    action_plan = generate_action_plan(insights)
    return {
        "insights": insights,
        "action_plan": action_plan
    }



# ─── Helpers ──────────────────────────────────────────────────────────────────

def _get_user_monthly(df: pd.DataFrame, col_map: dict) -> dict:
    df = df.copy()
    df["_date"] = pd.to_datetime(df[col_map["date"]], format="mixed", dayfirst=False)

    if col_map.get("quantity") and col_map["quantity"] in df.columns:
        val_col = col_map["quantity"]
    elif col_map.get("total") and col_map["total"] in df.columns:
        val_col = col_map["total"]
    else:
        return {}

    df["_val"] = pd.to_numeric(
        df[val_col].astype(str).str.replace(r"[$,]", "", regex=True),
        errors="coerce",
    ).fillna(0)

    df["_period"] = df["_date"].dt.to_period("M")
    monthly = df.groupby("_period")["_val"].sum().sort_index()

    return {
        period.strftime("%b %Y"): float(val)
        for period, val in monthly.items()
    }
