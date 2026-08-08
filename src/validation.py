from __future__ import annotations

from pathlib import Path
from typing import Dict, Tuple

import pandas as pd

from src.common import (
    INVENTORY_BENCHMARK_COLUMN,
    INVENTORY_DATE_COL,
    RAW_INVENTORY_PATH,
    RAW_SALES_PATH,
    REPORTS_DIR,
    SALES_DATE_COL,
    SALES_ID_COLUMNS,
    SALES_LEAKAGE_COLUMNS,
    ensure_directories,
    report_to_markdown,
    save_json,
    summarize_dataframe,
)
from src.feature_engineering import leakage_analysis_notes


def validate_sales_dataframe(df: pd.DataFrame) -> Dict:
    report = summarize_dataframe(df, date_col=SALES_DATE_COL)
    report["unique_id_counts"] = {
        column: int(df[column].nunique(dropna=True)) for column in SALES_ID_COLUMNS if column in df.columns
    }
    report["potential_leakage_features"] = {
        column: {
            "status": "flagged",
            "note": leakage_analysis_notes(df)["availability_assessment"][column]["reason"],
        }
        for column in SALES_LEAKAGE_COLUMNS
        if column in df.columns
    }
    report["leakage_analysis"] = leakage_analysis_notes(df)
    return report


def validate_inventory_dataframe(df: pd.DataFrame) -> Dict:
    report = summarize_dataframe(df, date_col=INVENTORY_DATE_COL)
    report["unique_id_counts"] = {
        column: int(df[column].nunique(dropna=True))
        for column in ["SKU_ID", "Warehouse_ID", "Supplier_ID"]
        if column in df.columns
    }
    report["inventory_checks"] = {
        "stockout_values": df["Stockout_Flag"].value_counts(dropna=False).to_dict() if "Stockout_Flag" in df.columns else {},
        "lead_time_range": {
            "min": int(df["Supplier_Lead_Time_Days"].min()) if "Supplier_Lead_Time_Days" in df.columns else None,
            "max": int(df["Supplier_Lead_Time_Days"].max()) if "Supplier_Lead_Time_Days" in df.columns else None,
        },
        "reorder_point_range": {
            "min": int(df["Reorder_Point"].min()) if "Reorder_Point" in df.columns else None,
            "max": int(df["Reorder_Point"].max()) if "Reorder_Point" in df.columns else None,
        },
        "order_quantity_range": {
            "min": int(df["Order_Quantity"].min()) if "Order_Quantity" in df.columns else None,
            "max": int(df["Order_Quantity"].max()) if "Order_Quantity" in df.columns else None,
        },
        "benchmark_field_decision": {
            "field": INVENTORY_BENCHMARK_COLUMN,
            "decision": "reference_only",
            "note": "The existing Demand_Forecast is treated as a benchmark/reference field and excluded from the final optimization input.",
        },
    }
    return report


def write_validation_report(report: Dict, stem: str) -> Tuple[Path, Path]:
    ensure_directories()
    json_path = REPORTS_DIR / f"{stem}.json"
    md_path = REPORTS_DIR / f"{stem}.md"
    save_json(report, json_path)
    md_path.write_text(report_to_markdown(report, stem.replace("_", " ").title()), encoding="utf-8")
    return json_path, md_path


def run_sales_validation(path: Path | str = RAW_SALES_PATH) -> Dict:
    df = pd.read_csv(path)
    report = validate_sales_dataframe(df)
    write_validation_report(report, "sales_validation_report")
    return report


def run_inventory_validation(path: Path | str = RAW_INVENTORY_PATH) -> Dict:
    df = pd.read_csv(path)
    report = validate_inventory_dataframe(df)
    write_validation_report(report, "inventory_validation_report")
    return report
