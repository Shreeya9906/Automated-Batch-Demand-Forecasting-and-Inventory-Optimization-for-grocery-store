from __future__ import annotations

import argparse
import sys
from pathlib import Path

if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parents[1]))

from src.common import RAW_INVENTORY_PATH, ensure_directories, save_json
from src.validation import run_inventory_validation


def main() -> None:
    parser = argparse.ArgumentParser(description="Validate the inventory dataset.")
    parser.add_argument("--input", default=str(RAW_INVENTORY_PATH), help="Path to the raw inventory CSV")
    parser.add_argument("--output", default=None, help="Optional JSON report path")
    args = parser.parse_args()

    ensure_directories()
    report = run_inventory_validation(args.input)
    if args.output:
        save_json(report, args.output)

    print("Inventory dataset validation completed.")
    print("Shape:", tuple(report["shape"]))
    print("Date range:", report["date_range"]["min"], "->", report["date_range"]["max"])
    print("Duplicate rows:", report["duplicate_rows"])
    print("Benchmark field decision:", report["inventory_checks"]["benchmark_field_decision"]["decision"])


if __name__ == "__main__":
    main()
