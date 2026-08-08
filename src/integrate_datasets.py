from __future__ import annotations

import argparse
import sys
from pathlib import Path

if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parents[1]))

import pandas as pd

from src.common import PROCESSED_DIR, RAW_INVENTORY_PATH, RAW_SALES_PATH, REPORTS_DIR, ensure_directories, save_dataframe, save_json
from src.mapping import apply_mappings, build_decision_dataset, build_location_mapping, build_product_mapping, save_mapping_tables


def integrate_forecast_and_inventory(forecast_df: pd.DataFrame, inventory_df: pd.DataFrame, location_mapping: pd.DataFrame, product_mapping: pd.DataFrame) -> pd.DataFrame:
    mapped_forecast = apply_mappings(forecast_df, location_mapping, product_mapping)
    mapped_forecast["Date"] = pd.to_datetime(mapped_forecast["Date"], errors="coerce")
    inventory_frame = inventory_df.copy()
    inventory_frame["Date"] = pd.to_datetime(inventory_frame["Date"], errors="coerce")

    merged = mapped_forecast.merge(
        inventory_frame,
        on=["Date", "Warehouse_ID", "SKU_ID"],
        how="left",
        suffixes=("_forecast", "_inventory"),
    )

    if "Demand_Forecast" in merged.columns:
        merged = merged.rename(columns={"Demand_Forecast": "Demand_Forecast_Reference"})

    return merged


def main() -> None:
    parser = argparse.ArgumentParser(description="Integrate forecast output with the processed inventory dataset.")
    parser.add_argument("--forecast-input", default=str(Path("forecast_output.csv")), help="Forecast output CSV")
    parser.add_argument("--inventory-input", default=str(PROCESSED_DIR / "inventory_processed.csv"), help="Processed inventory CSV")
    parser.add_argument("--sales-input", default=str(RAW_SALES_PATH), help="Raw sales CSV for mapping")
    parser.add_argument("--raw-inventory-input", default=str(RAW_INVENTORY_PATH), help="Raw inventory CSV for mapping")
    parser.add_argument("--output", default=str(Path("decision_dataset.csv")), help="Decision dataset output CSV")
    parser.add_argument("--integrated-output", default=str(REPORTS_DIR / "integrated_dataset.csv"), help="Optional integrated intermediate CSV")
    args = parser.parse_args()

    ensure_directories()
    forecast_df = pd.read_csv(args.forecast_input)
    sales_df = pd.read_csv(args.sales_input)
    inventory_df = pd.read_csv(args.inventory_input)
    raw_inventory_df = pd.read_csv(args.raw_inventory_input)

    location_mapping = build_location_mapping(sales_df, raw_inventory_df)
    product_mapping = build_product_mapping(sales_df, raw_inventory_df)
    save_mapping_tables(location_mapping, product_mapping)

    merged = integrate_forecast_and_inventory(forecast_df, inventory_df, location_mapping, product_mapping)
    save_dataframe(merged, args.integrated_output)

    decision_dataset = build_decision_dataset(merged)
    save_dataframe(decision_dataset, args.output)

    save_json(
        {
            "forecast_rows": int(forecast_df.shape[0]),
            "integrated_rows": int(merged.shape[0]),
            "decision_rows": int(decision_dataset.shape[0]),
            "matched_inventory_rows": int(decision_dataset.shape[0]),
            "unmatched_forecast_rows": int(merged.shape[0] - decision_dataset.shape[0]),
            "benchmark_field_decision": "Demand_Forecast used as reference only and excluded from decision_dataset.csv",
        },
        REPORTS_DIR / "integration_summary.json",
    )

    print("Dataset integration completed.")
    print("Integrated rows:", merged.shape[0])
    print("Decision rows:", decision_dataset.shape[0])
    print("Saved decision dataset to:", args.output)


if __name__ == "__main__":
    main()
