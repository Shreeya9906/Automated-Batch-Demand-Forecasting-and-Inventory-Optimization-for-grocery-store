from __future__ import annotations

import argparse
import sys
from pathlib import Path

if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parents[1]))

from src.common import RAW_SALES_PATH, ensure_directories, save_json
from src.validation import run_sales_validation


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate the historical sales dataset.")
    parser.add_argument("--input", default=str(RAW_SALES_PATH), help="Path to the raw sales CSV")
    parser.add_argument("--output", default=None, help="Optional JSON report path")
    args = parser.parse_args()

    ensure_directories()
    report = run_sales_validation(args.input)
    if args.output:
        save_json(report, args.output)

    print("Sales dataset validation completed.")
    print("Shape:", tuple(report["shape"]))
    print("Date range:", report["date_range"]["min"], "->", report["date_range"]["max"])
    print("Duplicate rows:", report["duplicate_rows"])
    print("Potential leakage features:", list(report["potential_leakage_features"].keys()))


if __name__ == "__main__":
    main()
