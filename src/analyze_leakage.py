from __future__ import annotations

import argparse
import sys
from pathlib import Path

if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parents[1]))

import pandas as pd

from src.common import RAW_SALES_PATH, REPORTS_DIR, ensure_directories, save_json
from src.feature_engineering import leakage_analysis_notes


def main() -> None:
    parser = argparse.ArgumentParser(description="Write a leakage analysis report for the sales dataset.")
    parser.add_argument("--input", default=str(RAW_SALES_PATH), help="Path to the raw sales CSV")
    parser.add_argument("--output", default=str(REPORTS_DIR / "leakage_analysis_report.json"), help="Output JSON report path")
    args = parser.parse_args()

    ensure_directories()
    frame = pd.read_csv(args.input)
    report = leakage_analysis_notes(frame)
    save_json(report, args.output)

    print("Leakage analysis completed.")
    print(report)


if __name__ == "__main__":
    main()
