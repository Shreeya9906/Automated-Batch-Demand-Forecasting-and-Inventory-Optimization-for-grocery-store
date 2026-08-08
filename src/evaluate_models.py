from __future__ import annotations

import argparse
import json
import sys
from pathlib import Path

if __package__ is None or __package__ == "":
    sys.path.append(str(Path(__file__).resolve().parents[1]))

import pandas as pd

from src.common import REPORTS_DIR, ensure_directories, save_dataframe, save_json


def load_metrics(path: Path) -> dict:
    if not path.exists():
        return {}
    with path.open("r", encoding="utf-8") as handle:
        return json.load(handle)


def main() -> None:
    parser = argparse.ArgumentParser(description="Build the model comparison table.")
    parser.add_argument("--baseline-metrics", default=str(REPORTS_DIR / "safe_model_metrics.json"), help="Metrics JSON from baseline models")
    parser.add_argument("--xgboost-metrics", default=str(REPORTS_DIR / "safe_xgboost_metrics.json"), help="Metrics JSON from XGBoost")
    parser.add_argument("--output", default=str(Path("model_comparison.csv")), help="Output CSV path")
    parser.add_argument("--feature-importance-output", default=str(Path("feature_importance.csv")), help="Output feature-importance CSV path")
    args = parser.parse_args()

    ensure_directories()
    baseline_metrics = load_metrics(Path(args.baseline_metrics))
    xgboost_metrics = load_metrics(Path(args.xgboost_metrics))

    rows = []
    for algorithm, metrics in baseline_metrics.items():
        rows.append({"Algorithm": algorithm, **metrics})
    if "xgboost" in xgboost_metrics:
        rows.append({"Algorithm": "xgboost", **xgboost_metrics["xgboost"]})

    comparison_frame = pd.DataFrame(rows).sort_values(["R2", "MAE"], ascending=[False, True]).reset_index(drop=True)
    save_dataframe(comparison_frame, args.output)

    feature_frames = []
    baseline_feature_path = REPORTS_DIR / "feature_importance_safe.csv"
    xgb_feature_path = REPORTS_DIR / "feature_importance_xgboost_safe.csv"
    for path in [baseline_feature_path, xgb_feature_path]:
        if path.exists():
            feature_frames.append(pd.read_csv(path))
    if feature_frames:
        feature_importance_frame = pd.concat(feature_frames, ignore_index=True)
        save_dataframe(feature_importance_frame, args.feature_importance_output)
    elif Path(args.feature_importance_output).exists():
        Path(args.feature_importance_output).unlink()

    save_json(
        {
            "best_model": comparison_frame.iloc[0]["Algorithm"] if not comparison_frame.empty else None,
            "comparison": comparison_frame.to_dict(orient="records"),
        },
        REPORTS_DIR / "model_selection_summary.json",
    )

    print("Model comparison completed.")
    print(comparison_frame.to_string(index=False))
    print("Saved comparison to:", args.output)


if __name__ == "__main__":
    main()
