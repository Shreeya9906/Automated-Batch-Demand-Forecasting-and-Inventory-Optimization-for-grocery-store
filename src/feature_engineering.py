from __future__ import annotations

import pandas as pd

from src.common import INVENTORY_DATE_COL, SALES_DATE_COL, SALES_LEAKAGE_COLUMNS


SALES_CATEGORICAL_COLUMNS = [
    "Store ID",
    "Product ID",
    "Category",
    "Region",
    "Weather Condition",
    "Seasonality",
]

INVENTORY_CATEGORICAL_COLUMNS = [
    "SKU_ID",
    "Warehouse_ID",
    "Supplier_ID",
    "Region",
]


def engineer_sales_features(df: pd.DataFrame, leakage_safe: bool = False) -> pd.DataFrame:
    frame = df.copy()
    frame[SALES_DATE_COL] = pd.to_datetime(frame[SALES_DATE_COL], errors="coerce")
    frame = frame.sort_values(["Store ID", "Product ID", SALES_DATE_COL]).reset_index(drop=True)

    frame["Year"] = frame[SALES_DATE_COL].dt.year
    frame["Month"] = frame[SALES_DATE_COL].dt.month
    frame["Day"] = frame[SALES_DATE_COL].dt.day
    frame["DayOfWeek"] = frame[SALES_DATE_COL].dt.dayofweek
    frame["IsMonthStart"] = frame[SALES_DATE_COL].dt.is_month_start.astype(int)
    frame["IsMonthEnd"] = frame[SALES_DATE_COL].dt.is_month_end.astype(int)

    grouped = frame.groupby(["Store ID", "Product ID"], sort=False)["Demand"]
    frame["Demand_lag_1"] = grouped.shift(1)
    frame["Demand_lag_7"] = grouped.shift(7)
    frame["Demand_roll_7"] = grouped.transform(lambda series: series.shift(1).rolling(window=7, min_periods=3).mean())

    if leakage_safe:
        frame = frame.drop(columns=SALES_LEAKAGE_COLUMNS)

    return frame


def engineer_inventory_features(df: pd.DataFrame) -> pd.DataFrame:
    frame = df.copy()
    frame[INVENTORY_DATE_COL] = pd.to_datetime(frame[INVENTORY_DATE_COL], errors="coerce")
    frame = frame.sort_values(["Warehouse_ID", "SKU_ID", INVENTORY_DATE_COL]).reset_index(drop=True)

    frame["Year"] = frame[INVENTORY_DATE_COL].dt.year
    frame["Month"] = frame[INVENTORY_DATE_COL].dt.month
    frame["Day"] = frame[INVENTORY_DATE_COL].dt.day
    frame["DayOfWeek"] = frame[INVENTORY_DATE_COL].dt.dayofweek
    frame["IsMonthStart"] = frame[INVENTORY_DATE_COL].dt.is_month_start.astype(int)
    frame["IsMonthEnd"] = frame[INVENTORY_DATE_COL].dt.is_month_end.astype(int)

    return frame


def leakage_analysis_notes(df: pd.DataFrame) -> dict:
    frame = df.copy()
    frame[SALES_DATE_COL] = pd.to_datetime(frame[SALES_DATE_COL], errors="coerce")
    correlations = {}
    for column in [
        "Units Sold",
        "Inventory Level",
        "Units Ordered",
        "Price",
        "Discount",
        "Promotion",
        "Competitor Pricing",
        "Epidemic",
    ]:
        if column in frame.columns:
            correlations[column] = float(frame[[column, "Demand"]].corr(numeric_only=True).iloc[0, 1])

    availability = {
        "Units Sold": {
            "available_at_forecast_time": False,
            "reason": "Same-period realized sales; it is an outcome, not an input known before the forecast.",
        },
        "Inventory Level": {
            "available_at_forecast_time": False,
            "reason": "Likely same-period stock position after demand is realized; not safe unless explicitly recorded as a prior snapshot.",
        },
        "Units Ordered": {
            "available_at_forecast_time": False,
            "reason": "A replenishment action that can be endogenous to demand and inventory policy.",
        },
    }

    return {
        "feature_correlations_with_target": correlations,
        "availability_assessment": availability,
        "safe_feature_set": [
            "Date-derived features",
            "Store ID",
            "Product ID",
            "Category",
            "Region",
            "Price",
            "Discount",
            "Weather Condition",
            "Promotion",
            "Competitor Pricing",
            "Seasonality",
            "Epidemic",
            "Lagged Demand features",
        ],
    }
