from __future__ import annotations

import argparse
import sys
from pathlib import Path

if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parents[1]))

import pandas as pd

from src.common import PROCESSED_DIR, RAW_SALES_PATH, REPORTS_DIR, ensure_directories, save_dataframe, save_json
from pipeline.modeling import save_model_metrics, train_models_for_mode


def main() -> None:
    parser = argparse.ArgumentParser(description="Train Linear Regression, Decision Tree, and Random Forest models.")
    parser.add_argument("--input", default=str(PROCESSED_DIR / "sales_processed.csv"), help="Processed sales CSV")
    parser.add_argument("--feature-mode", choices=["baseline", "safe"], default="safe", help="Feature set to use")
    parser.add_argument("--sample-size", type=int, default=None, help="Optional row limit for smoke testing")
    parser.add_argument("--comparison-output", default=None, help="Override comparison CSV output path")
    parser.add_argument("--metrics-output", default=None, help="Override metrics JSON output path")
    args = parser.parse_args()

    ensure_directories()
    comparison_name = "model_comparison_baseline.csv" if args.feature_mode == "baseline" else "model_comparison_safe_baseline.csv"
    metrics_name = "baseline_model_metrics.json" if args.feature_mode == "baseline" else "safe_model_metrics.json"
    feature_importance_name = "feature_importance_baseline.csv" if args.feature_mode == "baseline" else "feature_importance_safe.csv"
    comparison_path = Path(args.comparison_output) if args.comparison_output else (REPORTS_DIR / comparison_name)
    metrics_path = Path(args.metrics_output) if args.metrics_output else (REPORTS_DIR / metrics_name)

    _, comparison_frame, metrics_by_model, _, feature_importance_frame = train_models_for_mode(
        ["linear_regression", "decision_tree", "random_forest"],
        feature_mode=args.feature_mode,
        input_path=args.input,
        sample_size=args.sample_size,
    )

    save_dataframe(comparison_frame, comparison_path)
    save_model_metrics(metrics_path, metrics_by_model)

    feature_importance_path = REPORTS_DIR / feature_importance_name
    if not feature_importance_frame.empty:
        save_dataframe(feature_importance_frame, feature_importance_path)

    print(f"Baseline model training completed for feature mode: {args.feature_mode}")
    print(comparison_frame.to_string(index=False))
    print("Saved comparison to:", comparison_path)
    print("Saved metrics to:", metrics_path)


if __name__ == "__main__":
    main()
