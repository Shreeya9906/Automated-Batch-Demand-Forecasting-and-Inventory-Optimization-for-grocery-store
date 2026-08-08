from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parents[1]))

from src.common import PROCESSED_DIR, RAW_INVENTORY_PATH, ensure_directories, save_dataframe
from src.feature_engineering import engineer_inventory_features


def preprocess_inventory(input_path: str, output_path: str) -> pd.DataFrame:
    frame = pd.read_csv(input_path)
    frame = frame.drop_duplicates().copy()
    frame = engineer_inventory_features(frame)

    for column in frame.columns:
        if frame[column].isna().any():
            if pd.api.types.is_numeric_dtype(frame[column]):
                frame[column] = frame[column].fillna(frame[column].median())
            else:
                frame[column] = frame[column].fillna(frame[column].mode(dropna=True).iloc[0])

    save_dataframe(frame, output_path)
    return frame


def main() -> None:
    parser = argparse.ArgumentParser(description="Preprocess the inventory dataset.")
    parser.add_argument("--input", default=str(RAW_INVENTORY_PATH), help="Path to the raw inventory CSV")
    parser.add_argument("--output", default=str(PROCESSED_DIR / "inventory_processed.csv"), help="Path for the processed CSV")
    args = parser.parse_args()

    ensure_directories()
    frame = preprocess_inventory(args.input, args.output)
    print("Inventory preprocessing completed.")
    print("Output shape:", frame.shape)
    print("Saved to:", args.output)


if __name__ == "__main__":
    main()
