from __future__ import annotations

import argparse
import sys
from pathlib import Path

if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parents[1]))

from src.common import PROCESSED_DIR, REPORTS_DIR, ensure_directories, save_dataframe
from pipeline.modeling import compute_feature_importance, evaluation_metrics, fit_pipeline, load_sales_frame, save_model_metrics, train_test_from_frame, model_filename
import joblib


def main() -> None:
    parser = argparse.ArgumentParser(description="Train the XGBoost regressor.")
    parser.add_argument("--input", default=str(PROCESSED_DIR / "sales_processed.csv"), help="Processed sales CSV")
    parser.add_argument("--feature-mode", choices=["baseline", "safe"], default="safe", help="Feature set to use")
    parser.add_argument("--sample-size", type=int, default=None, help="Optional row limit for smoke testing")
    parser.add_argument("--metrics-output", default=None, help="Override metrics JSON output path")
    args = parser.parse_args()

    ensure_directories()
    metrics_name = "baseline_xgboost_metrics.json" if args.feature_mode == "baseline" else "safe_xgboost_metrics.json"
    metrics_path = Path(args.metrics_output) if args.metrics_output else (REPORTS_DIR / metrics_name)

    frame = load_sales_frame(args.input, feature_mode=args.feature_mode, sample_size=args.sample_size)
    _, _, X_train, X_test, y_train, y_test = train_test_from_frame(frame)
    pipeline = fit_pipeline("xgboost", X_train, y_train)
    predictions = pipeline.predict(X_test)
    metrics = evaluation_metrics(y_test, predictions)
    save_model_metrics(metrics_path, {"xgboost": metrics})

    artifact_path = Path("models") / model_filename("xgboost", args.feature_mode)
    joblib.dump(pipeline, artifact_path)

    importance_frame = compute_feature_importance(pipeline, "xgboost")
    if not importance_frame.empty:
        save_dataframe(importance_frame, REPORTS_DIR / ("feature_importance_xgboost_baseline.csv" if args.feature_mode == "baseline" else "feature_importance_xgboost_safe.csv"))

    print(f"XGBoost training completed for feature mode: {args.feature_mode}")
    print(metrics)
    print("Saved model to:", artifact_path)
    print("Saved metrics to:", metrics_path)


if __name__ == "__main__":
    main()
