"""
Column auto-detector — intelligently detects CSV column mappings.

Eliminates the need for manual user column mapping by using
heuristic pattern matching on column names and data types.
"""

import pandas as pd
import re

# Known patterns for each semantic field (case-insensitive regex)
_PATTERNS = {
    "date": [
        r"^date$", r"^order.?date$", r"^transaction.?date$", r"^sale.?date$",
        r"^invoice.?date$", r"^purchase.?date$", r"^created.?at$", r"^timestamp$",
        r"^dt$", r"^bill.?date$",
    ],
    "quantity": [
        r"^quantity$", r"^qty$", r"^units?$", r"^units?.?sold$", r"^items?$",
        r"^count$", r"^no.?of.?items$", r"^num.?items$", r"^pieces$",
    ],
    "total": [
        r"^total$", r"^revenue$", r"^amount$", r"^sales?$", r"^total.?amount$",
        r"^total.?revenue$", r"^gross.?sales$", r"^net.?amount$", r"^price$",
        r"^total.?price$", r"^bill.?amount$", r"^order.?total$", r"^value$",
    ],
    "city": [
        r"^city$", r"^region$", r"^location$", r"^branch$", r"^store$",
        r"^area$", r"^zone$", r"^district$", r"^state$", r"^outlet$",
    ],
    "category": [
        r"^category$", r"^product.?line$", r"^product.?category$",
        r"^item.?type$", r"^product.?type$", r"^department$",
        r"^product.?group$", r"^segment$", r"^class$", r"^product$",
        r"^item$", r"^commodity$", r"^goods$",
    ],
    "cogs": [
        r"^cogs$", r"^cost$", r"^cost.?of.?goods$", r"^cost.?price$",
        r"^purchase.?price$", r"^buying.?price$", r"^expense$",
    ],
    "gross_income": [
        r"^gross.?income$", r"^profit$", r"^gross.?profit$", r"^margin$",
        r"^net.?income$", r"^net.?profit$", r"^earnings$", r"^gain$",
    ],
}


def auto_detect_columns(df: pd.DataFrame) -> dict:
    """
    Auto-detect column mapping from a DataFrame.

    Returns a dict like:
      { "date": "Order Date", "quantity": "Qty", "total": "Revenue", ... }

    Only includes keys for columns that were successfully detected.
    Raises ValueError if no date column or no quantity/total found.
    """
    columns = list(df.columns)
    col_map = {}
    used_columns = set()

    # Pass 1: Match by name patterns
    for field, patterns in _PATTERNS.items():
        for col in columns:
            if col in used_columns:
                continue
            col_clean = col.strip().lower().replace("_", " ").replace("-", " ")
            for pattern in patterns:
                if re.match(pattern, col_clean):
                    col_map[field] = col
                    used_columns.add(col)
                    break
            if field in col_map:
                break

    # Pass 2: If date not found, try detecting by dtype
    if "date" not in col_map:
        for col in columns:
            if col in used_columns:
                continue
            try:
                sample = df[col].dropna().head(20)
                parsed = pd.to_datetime(sample, format="mixed", dayfirst=False)
                if len(parsed.dropna()) >= len(sample) * 0.8:
                    col_map["date"] = col
                    used_columns.add(col)
                    break
            except (ValueError, TypeError):
                continue

    # Pass 3: If quantity/total not found, pick numeric columns
    if "quantity" not in col_map and "total" not in col_map:
        for col in columns:
            if col in used_columns:
                continue
            if pd.api.types.is_numeric_dtype(df[col]):
                # If it looks like a large number, map as total; small as quantity
                mean_val = df[col].mean()
                if mean_val > 100:
                    col_map["total"] = col
                else:
                    col_map["quantity"] = col
                used_columns.add(col)
                break

    # Validation
    if "date" not in col_map:
        raise ValueError(
            "Could not auto-detect a date column. "
            f"Available columns: {columns}. "
            "Please ensure your CSV has a column with dates."
        )

    if "quantity" not in col_map and "total" not in col_map:
        raise ValueError(
            "Could not detect a sales quantity or revenue column. "
            f"Available columns: {columns}. "
            "Please ensure your CSV has numeric sales data."
        )

    # Validate date is actually parseable
    try:
        pd.to_datetime(df[col_map["date"]].head(10), format="mixed", dayfirst=False)
    except Exception:
        raise ValueError(
            f"Column '{col_map['date']}' was detected as date but "
            "doesn't contain parseable dates."
        )

    return col_map


def detect_columns(df: pd.DataFrame) -> list[str]:
    """Return all column names found in the uploaded CSV."""
    return list(df.columns)


def validate_mapping(df: pd.DataFrame, col_map: dict) -> dict:
    """
    Validate that mapped columns exist in the DataFrame and have correct types.
    Kept for backward compatibility but auto_detect_columns is preferred.
    """
    all_columns = set(df.columns)

    if "date" not in col_map or not col_map["date"]:
        raise ValueError("Column mapping must include a 'date' column.")

    if col_map["date"] not in all_columns:
        raise ValueError(f"Date column '{col_map['date']}' not found in CSV.")

    has_quantity = col_map.get("quantity") and col_map["quantity"] in all_columns
    has_total = col_map.get("total") and col_map["total"] in all_columns

    if not has_quantity and not has_total:
        raise ValueError("Column mapping must include at least 'quantity' or 'total'.")

    return col_map
