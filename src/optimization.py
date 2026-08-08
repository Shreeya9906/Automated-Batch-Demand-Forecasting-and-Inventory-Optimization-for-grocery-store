from __future__ import annotations

from pathlib import Path

import numpy as np
import pandas as pd

from src.common import REPORTS_DIR, ensure_directories, save_dataframe, save_json


def optimize_inventory_decisions(decision_df: pd.DataFrame, synthetic_params_df: pd.DataFrame) -> pd.DataFrame:
    merged = decision_df.copy()
    if "Warehouse_ID" not in merged.columns and "Location_ID" in merged.columns:
        merged["Warehouse_ID"] = merged["Location_ID"]
    merged = merged.merge(synthetic_params_df, on=["Warehouse_ID", "SKU_ID"], how="left")

    predicted = pd.to_numeric(merged["Predicted_Demand"], errors="coerce").fillna(0)
    inventory = pd.to_numeric(merged["Inventory_Level"], errors="coerce").fillna(0)
    safety_stock = pd.to_numeric(merged["Safety_Stock"], errors="coerce").fillna(0)
    capacity = pd.to_numeric(merged["Warehouse_Capacity"], errors="coerce").fillna(np.inf)
    holding_cost = pd.to_numeric(merged["Holding_Cost"], errors="coerce").fillna(0)
    ordering_cost = pd.to_numeric(merged["Ordering_Cost"], errors="coerce").fillna(0)
    reorder_point = pd.to_numeric(merged["Reorder_Point"], errors="coerce").fillna(0)

    target_stock = np.maximum(predicted + safety_stock, reorder_point)
    recommended_order = np.maximum(0, np.ceil(target_stock - inventory).astype(int))
    recommended_order = np.minimum(recommended_order, np.maximum(0, np.floor(capacity - inventory).astype(int)))

    expected_inventory = inventory + recommended_order - predicted
    reorder_decision = recommended_order > 0
    stock_status = np.where(expected_inventory >= safety_stock, "STABLE", "AT_RISK")
    potential_stockout = expected_inventory < 0
    inventory_cost = holding_cost * np.maximum(expected_inventory, 0) + ordering_cost * reorder_decision.astype(int) + 5.0 * np.maximum(-expected_inventory, 0)

    result = merged.copy()
    result["Recommended_Order_Quantity"] = recommended_order.astype(int)
    result["Reorder_Decision"] = reorder_decision
    result["Expected_Inventory"] = np.round(expected_inventory, 2)
    result["Stock_Status"] = stock_status
    result["Potential_Stockout"] = potential_stockout
    result["Estimated_Inventory_Cost"] = np.round(inventory_cost, 2)

    return result


def save_optimization_result(result_df: pd.DataFrame, output_path: str | Path) -> None:
    ensure_directories()
    save_dataframe(result_df, output_path)
    save_json(
        {
            "rows": int(result_df.shape[0]),
            "recommended_orders_nonzero": int((result_df["Recommended_Order_Quantity"] > 0).sum()),
            "potential_stockout_rows": int(result_df["Potential_Stockout"].sum()),
        },
        REPORTS_DIR / "inventory_optimization_summary.json",
    )
