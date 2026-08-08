from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parents[1]))

import joblib
import pandas as pd

from src.common import PROCESSED_DIR, REPORTS_DIR, SALES_DATE_COL, SALES_TARGET, ensure_directories, save_dataframe
from src.modeling import load_sales_frame, train_test_from_frame


def main() -> None:
    parser = argparse.ArgumentParser(description="Generate demand forecasts from the selected model.")
    parser.add_argument("--input", default=str(PROCESSED_DIR / "sales_processed.csv"), help="Processed sales CSV")
    parser.add_argument("--feature-mode", choices=["baseline", "safe"], default="safe", help="Feature set to use")
    parser.add_argument("--model-path", default=None, help="Optional explicit model path")
    parser.add_argument("--output", default=str(Path("forecast_output.csv")), help="Output CSV path")
    args = parser.parse_args()

    ensure_directories()
    frame = load_sales_frame(args.input, feature_mode=args.feature_mode)
    _, test_df, _, X_test, _, y_test = train_test_from_frame(frame)

    if args.model_path:
        model_path = Path(args.model_path)
    else:
        summary_path = REPORTS_DIR / "model_selection_summary.json"
        if not summary_path.exists():
            raise FileNotFoundError("model_selection_summary.json is missing. Run evaluate_models.py first.")
        with summary_path.open("r", encoding="utf-8") as handle:
            summary = json.load(handle)
        best_model_name = str(summary.get("best_model"))
        if best_model_name == "xgboost":
            model_path = Path("models") / "xgboost_v1.pkl"
        elif best_model_name == "random_forest":
            model_path = Path("models") / "random_forest_v1.pkl"
        elif best_model_name == "decision_tree":
            model_path = Path("models") / "decision_tree_v1.pkl"
        else:
            model_path = Path("models") / "linear_regression_v1.pkl"

    pipeline = joblib.load(model_path)
    predictions = pipeline.predict(X_test)

    forecast_frame = pd.DataFrame(
        {
            "Date": pd.to_datetime(test_df[SALES_DATE_COL]).values,
            "Store ID": test_df["Store ID"].values,
            "Product ID": test_df["Product ID"].values,
            "Actual_Demand": y_test.values,
            "Predicted_Demand": predictions,
        }
    )

    save_dataframe(forecast_frame, args.output)
    print("Forecast generation completed.")
    print("Saved to:", args.output)


if __name__ == "__main__":
    main()
