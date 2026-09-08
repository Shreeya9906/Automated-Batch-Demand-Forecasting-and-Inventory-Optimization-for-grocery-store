from __future__ import annotations

import argparse
import sys
from pathlib import Path

if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parents[1]))

import pandas as pd

from src.common import REPORTS_DIR, SYNTHETIC_DIR, ensure_directories
from pipeline.optimization import optimize_inventory_decisions, save_optimization_result


def main() -> None:
    parser = argparse.ArgumentParser(description="Optimize inventory decisions using predicted demand.")
    parser.add_argument("--decision-input", default=str(Path("data/processed/decision_dataset.csv")), help="Decision dataset CSV")
    parser.add_argument("--parameters-input", default=str(SYNTHETIC_DIR / "synthetic_inventory_parameters.csv"), help="Synthetic parameter CSV")
    parser.add_argument("--output", default=str(Path("data/processed/inventory_optimization_result.csv")), help="Optimization output CSV")
    args = parser.parse_args()

    ensure_directories()
    decision_df = pd.read_csv(args.decision_input)
    params_df = pd.read_csv(args.parameters_input)
    result_df = optimize_inventory_decisions(decision_df, params_df)
    save_optimization_result(result_df, args.output)

    print("Inventory optimization completed.")
    print("Saved to:", args.output)
    print("Rows:", result_df.shape[0])


if __name__ == "__main__":
    main()
