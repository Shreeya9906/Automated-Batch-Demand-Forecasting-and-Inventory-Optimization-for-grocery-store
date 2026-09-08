from __future__ import annotations

import argparse
import sys
from pathlib import Path

import pandas as pd

if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parents[1]))

from src.common import PROCESSED_DIR, RAW_SALES_PATH, SALES_DATE_COL, ensure_directories, save_dataframe
from pipeline.feature_engineering import engineer_sales_features


def preprocess_sales(input_path: str, output_path: str) -> pd.DataFrame:
    frame = pd.read_csv(input_path)
    frame[SALES_DATE_COL] = pd.to_datetime(frame[SALES_DATE_COL], errors="coerce")
    frame = frame.drop_duplicates().copy()

    for column in frame.columns:
        if frame[column].isna().any():
            if pd.api.types.is_numeric_dtype(frame[column]):
                frame[column] = frame[column].fillna(frame[column].median())
            else:
                frame[column] = frame[column].fillna(frame[column].mode(dropna=True).iloc[0])

    engineered = engineer_sales_features(frame, leakage_safe=False)
    save_dataframe(engineered, output_path)
    return engineered


def main() -> None:
    parser = argparse.ArgumentParser(description="Preprocess the sales dataset.")
    parser.add_argument("--input", default=str(RAW_SALES_PATH), help="Path to the raw sales CSV")
    parser.add_argument("--output", default=str(PROCESSED_DIR / "sales_processed.csv"), help="Path for the processed CSV")
    args = parser.parse_args()

    ensure_directories()
    frame = preprocess_sales(args.input, args.output)
    print("Sales preprocessing completed.")
    print("Output shape:", frame.shape)
    print("Saved to:", args.output)


if __name__ == "__main__":
    main()
