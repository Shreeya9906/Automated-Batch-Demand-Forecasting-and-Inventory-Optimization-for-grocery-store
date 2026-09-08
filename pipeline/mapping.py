from __future__ import annotations

from pathlib import Path
from typing import Tuple

import pandas as pd

from src.common import REPORTS_DIR, ensure_directories, save_dataframe, save_json


def build_location_mapping(sales_df: pd.DataFrame, inventory_df: pd.DataFrame) -> pd.DataFrame:
    store_ids = sorted(sales_df["Store ID"].dropna().astype(str).unique().tolist())
    warehouse_ids = sorted(inventory_df["Warehouse_ID"].dropna().astype(str).unique().tolist())

    if len(store_ids) != len(warehouse_ids):
        raise ValueError("Store and warehouse counts must match for the prototype location mapping.")

    mapping = pd.DataFrame(
        {
            "Store ID": store_ids,
            "Warehouse_ID": warehouse_ids,
            "Mapping_Method": "deterministic_ordinal_pairing",
            "Notes": "Academic prototype mapping; no claim of real-world equivalence.",
        }
    )
    return mapping


def build_product_mapping(sales_df: pd.DataFrame, inventory_df: pd.DataFrame) -> pd.DataFrame:
    product_ids = sorted(sales_df["Product ID"].dropna().astype(str).unique().tolist())
    sku_ids = sorted(inventory_df["SKU_ID"].dropna().astype(str).unique().tolist())

    if len(product_ids) > len(sku_ids):
        raise ValueError("The inventory dataset must contain at least as many SKUs as sales products for the prototype mapping.")

    mapping = pd.DataFrame(
        {
            "Product ID": product_ids,
            "SKU_ID": sku_ids[: len(product_ids)],
            "Mapping_Method": "deterministic_ordinal_pairing",
            "Notes": "Academic prototype mapping; remaining SKUs are not used by the sales dataset.",
        }
    )
    return mapping


def apply_mappings(forecast_df: pd.DataFrame, location_mapping: pd.DataFrame, product_mapping: pd.DataFrame) -> pd.DataFrame:
    mapped = forecast_df.merge(location_mapping, on="Store ID", how="left").merge(product_mapping, on="Product ID", how="left")
    mapped["Location_ID"] = mapped["Warehouse_ID"]
    return mapped


def build_decision_dataset(merged_df: pd.DataFrame) -> pd.DataFrame:
    decision_columns = [
        "Date",
        "Product ID",
        "Store ID",
        "Location_ID",
        "SKU_ID",
        "Predicted_Demand",
        "Inventory_Level",
        "Supplier_Lead_Time_Days",
        "Reorder_Point",
        "Order_Quantity",
        "Unit_Cost",
        "Unit_Price",
        "Promotion_Flag",
        "Stockout_Flag",
    ]
    existing = [column for column in decision_columns if column in merged_df.columns]
    decision_dataset = merged_df[existing].copy()
    inventory_required_columns = [
        "Inventory_Level",
        "Supplier_Lead_Time_Days",
        "Reorder_Point",
        "Order_Quantity",
        "Unit_Cost",
        "Unit_Price",
        "Promotion_Flag",
        "Stockout_Flag",
    ]
    present_required_columns = [column for column in inventory_required_columns if column in decision_dataset.columns]
    if present_required_columns:
        decision_dataset = decision_dataset.dropna(subset=present_required_columns).reset_index(drop=True)
    return decision_dataset


def save_mapping_tables(location_mapping: pd.DataFrame, product_mapping: pd.DataFrame) -> Tuple[Path, Path]:
    ensure_directories()
    location_path = REPORTS_DIR / "location_mapping.csv"
    product_path = REPORTS_DIR / "product_mapping.csv"
    save_dataframe(location_mapping, location_path)
    save_dataframe(product_mapping, product_path)
    save_json(
        {
            "location_mapping_rows": int(location_mapping.shape[0]),
            "product_mapping_rows": int(product_mapping.shape[0]),
            "mapping_type": "academic_prototype_deterministic_ordinal_pairing",
        },
        REPORTS_DIR / "mapping_summary.json",
    )
    return location_path, product_path
