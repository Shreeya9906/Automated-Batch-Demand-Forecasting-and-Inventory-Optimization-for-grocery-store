from __future__ import annotations

import argparse
import sys
from pathlib import Path

if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parents[1]))

import pandas as pd

from src.common import RAW_INVENTORY_PATH, RAW_SALES_PATH, ensure_directories
from pipeline.mapping import build_location_mapping, build_product_mapping, save_mapping_tables


def main() -> None:
    parser = argparse.ArgumentParser(description="Create deterministic mapping tables between sales and inventory identifiers.")
    parser.add_argument("--sales-input", default=str(RAW_SALES_PATH), help="Raw sales CSV")
    parser.add_argument("--inventory-input", default=str(RAW_INVENTORY_PATH), help="Raw inventory CSV")
    args = parser.parse_args()

    ensure_directories()
    sales_df = pd.read_csv(args.sales_input)
    inventory_df = pd.read_csv(args.inventory_input)
    location_mapping = build_location_mapping(sales_df, inventory_df)
    product_mapping = build_product_mapping(sales_df, inventory_df)
    save_mapping_tables(location_mapping, product_mapping)

    print("Mapping tables created.")
    print("Location mapping rows:", len(location_mapping))
    print("Product mapping rows:", len(product_mapping))


if __name__ == "__main__":
    main()
