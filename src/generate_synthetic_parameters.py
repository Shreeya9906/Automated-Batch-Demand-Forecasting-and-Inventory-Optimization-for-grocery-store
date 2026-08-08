from __future__ import annotations

import argparse
import sys
from pathlib import Path

if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parents[1]))

import numpy as np
import pandas as pd

from src.common import RAW_INVENTORY_PATH, SYNTHETIC_DIR, ensure_directories, save_dataframe


def generate_synthetic_parameters(input_path: str, output_path: str, seed: int = 42) -> pd.DataFrame:
    inventory_df = pd.read_csv(input_path)
    grouped = (
        inventory_df.groupby(["Warehouse_ID", "SKU_ID"], as_index=False)
        .agg(
            {
                "Unit_Cost": "mean",
                "Unit_Price": "mean",
                "Reorder_Point": "mean",
                "Supplier_Lead_Time_Days": "mean",
                "Inventory_Level": "mean",
            }
        )
        .rename(
            columns={
                "Unit_Cost": "Average_Unit_Cost",
                "Unit_Price": "Average_Unit_Price",
                "Reorder_Point": "Average_Reorder_Point",
                "Supplier_Lead_Time_Days": "Average_Lead_Time_Days",
                "Inventory_Level": "Average_Inventory_Level",
            }
        )
    )

    rng = np.random.default_rng(seed)
    size = len(grouped)

    holding_rate = rng.uniform(0.05, 0.15, size=size)
    ordering_multiplier = rng.uniform(1.5, 3.5, size=size)
    safety_multiplier = rng.uniform(0.1, 0.3, size=size)
    warehouse_capacity = rng.uniform(4000, 10000, size=size)

    grouped["Holding_Cost"] = np.round(grouped["Average_Unit_Cost"] * holding_rate + 0.1, 2)
    grouped["Ordering_Cost"] = np.round(grouped["Average_Unit_Price"] * ordering_multiplier + 10.0, 2)
    grouped["Safety_Stock"] = np.maximum(10, np.round(grouped["Average_Reorder_Point"] * safety_multiplier).astype(int))
    grouped["Warehouse_Capacity"] = np.round(warehouse_capacity + grouped["Average_Inventory_Level"] * 2).astype(int)
    grouped["Source"] = "SYNTHETIC / ASSUMED PARAMETERS"

    grouped = grouped[
        [
            "Warehouse_ID",
            "SKU_ID",
            "Holding_Cost",
            "Ordering_Cost",
            "Safety_Stock",
            "Warehouse_Capacity",
            "Source",
        ]
    ]

    save_dataframe(grouped, output_path)
    return grouped


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate synthetic inventory optimization parameters.")
    parser.add_argument("--input", default=str(RAW_INVENTORY_PATH), help="Path to the raw inventory CSV")
    parser.add_argument("--output", default=str(SYNTHETIC_DIR / "synthetic_inventory_parameters.csv"), help="Output CSV path")
    parser.add_argument("--seed", type=int, default=42, help="Random seed")
    args = parser.parse_args()

    ensure_directories()
    frame = generate_synthetic_parameters(args.input, args.output, seed=args.seed)
    print("Synthetic parameter generation completed.")
    print("Output shape:", frame.shape)
    print("Saved to:", args.output)


if __name__ == "__main__":
    main()
