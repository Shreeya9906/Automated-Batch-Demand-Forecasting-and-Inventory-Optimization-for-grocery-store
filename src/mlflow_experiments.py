from __future__ import annotations

import os
import sys
from pathlib import Path
from typing import Dict, List, Optional, Tuple

import mlflow
import mlflow.sklearn
import pandas as pd


SYSTEM_SITE_PACKAGES = Path(r"C:\Users\SHREEYASWINI P\AppData\Local\Programs\Python\Python312\Lib\site-packages")
if SYSTEM_SITE_PACKAGES.exists() and str(SYSTEM_SITE_PACKAGES) not in sys.path:
    sys.path.insert(0, str(SYSTEM_SITE_PACKAGES))

from src.common import PROCESSED_DIR, REPORTS_DIR, RANDOM_SEED, SALES_DATE_COL, SALES_TARGET, ensure_directories, save_dataframe, save_json
from src.modeling import compute_feature_importance, evaluation_metrics, fit_pipeline, load_sales_frame, train_test_from_frame


EXPERIMENT_NAME = "Grocery_Demand_Forecasting"
REGISTERED_MODEL_NAME = "GroceryDemandForecasting"
TRACKING_URI = "http://127.0.0.1:5000"
FEATURE_MODE = "safe"
INPUT_DATASET = str(PROCESSED_DIR / "sales_processed.csv")


def configure_mlflow() -> None:
    tracking_uri = os.environ.get("MLFLOW_TRACKING_URI", TRACKING_URI)
    mlflow.set_tracking_uri(tracking_uri)
    mlflow.set_registry_uri(tracking_uri)
    mlflow.set_experiment(EXPERIMENT_NAME)


def serializable_params(model) -> Dict[str, object]:
    params = model.get_params(deep=False)
    serializable: Dict[str, object] = {}
    for key, value in params.items():
        if isinstance(value, (str, int, float, bool)) or value is None:
            serializable[key] = value
    return serializable


def infer_model_path(algorithm: str) -> str:
    return f"runs:/{{run_id}}/model".format(run_id="{run_id}")


def log_feature_importance(algorithm: str, feature_mode: str, run_id: str, pipeline, reported_name: str) -> Optional[Path]:
    importance_frame = compute_feature_importance(pipeline, algorithm)
    if importance_frame.empty:
        return None

    ensure_directories()
    output_path = REPORTS_DIR / f"mlflow_feature_importance_{reported_name}_{feature_mode}.csv"
    save_dataframe(importance_frame, output_path)
    mlflow.log_artifact(str(output_path), artifact_path="feature_importance")
    return output_path


def run_single_experiment(
    algorithm: str,
    reported_name: str,
    X_train: pd.DataFrame,
    X_test: pd.DataFrame,
    y_train: pd.Series,
    y_test: pd.Series,
    train_df: pd.DataFrame,
    test_df: pd.DataFrame,
) -> Dict[str, object]:
    run_name = f"{reported_name}_safe"
    with mlflow.start_run(run_name=run_name) as run:
        pipeline = fit_pipeline(algorithm, X_train, y_train)
        predictions = pipeline.predict(X_test)
        metrics = evaluation_metrics(y_test, predictions)

        mlflow.log_params(
            {
                "algorithm": reported_name,
                "feature_mode": FEATURE_MODE,
                "target": SALES_TARGET,
                "train_rows": int(train_df.shape[0]),
                "test_rows": int(test_df.shape[0]),
                "split_type": "chronological",
                "input_dataset": INPUT_DATASET,
                **serializable_params(pipeline.named_steps["model"]),
            }
        )
        mlflow.log_metric("R2", metrics["R2"])
        mlflow.log_metric("MAE", metrics["MAE"])
        mlflow.log_metric("RMSE", metrics["RMSE"])

        mlflow.sklearn.log_model(
            sk_model=pipeline,
            artifact_path="model",
            serialization_format="cloudpickle",
        )

        feature_importance_path = log_feature_importance(algorithm, FEATURE_MODE, run.info.run_id, pipeline, reported_name)
        if feature_importance_path is not None:
            pass

        mlflow.set_tag("run_name", run_name)
        mlflow.set_tag("model_family", reported_name)

        return {
            "Algorithm": reported_name,
            "R2": metrics["R2"],
            "MAE": metrics["MAE"],
            "RMSE": metrics["RMSE"],
            "Run_ID": run.info.run_id,
            "Model_URI": f"runs:/{run.info.run_id}/model",
        }


def select_best_model(comparison_frame: pd.DataFrame) -> pd.Series:
    if comparison_frame.empty:
        raise ValueError("No MLflow experiment results were produced.")
    return comparison_frame.sort_values(["R2", "MAE", "RMSE"], ascending=[False, True, True]).iloc[0]


def register_best_model(run_id: str) -> None:
    model_uri = f"runs:/{run_id}/model"
    mlflow.register_model(model_uri=model_uri, name=REGISTERED_MODEL_NAME)


def main() -> None:
    ensure_directories()
    configure_mlflow()

    input_path = PROCESSED_DIR / "sales_processed.csv"
    if not input_path.exists():
        raise FileNotFoundError(f"Processed dataset not found: {input_path}")

    print("=" * 70)
    print("MLFLOW GROCERY DEMAND FORECASTING EXPERIMENT")
    print("=" * 70)
    print()
    print("Input:", input_path)
    print("Feature mode:", FEATURE_MODE)

    frame = load_sales_frame(input_path, feature_mode=FEATURE_MODE)
    train_df, test_df, X_train, X_test, y_train, y_test = train_test_from_frame(frame)

    print("Training records:", int(train_df.shape[0]))
    print("Testing records:", int(test_df.shape[0]))

    model_specs: List[Tuple[str, str]] = [
        ("linear_regression", "linear_regression"),
        ("decision_tree", "decision_tree"),
        ("random_forest", "random_forest"),
        ("xgboost", "xgboost"),
    ]

    results: List[Dict[str, object]] = []

    for algorithm, reported_name in model_specs:
        print()
        print("-" * 70)
        print(f"Training: {reported_name}")
        print("-" * 70)
        run_result = run_single_experiment(
            algorithm=algorithm,
            reported_name=reported_name,
            X_train=X_train,
            X_test=X_test,
            y_train=y_train,
            y_test=y_test,
            train_df=train_df,
            test_df=test_df,
        )
        results.append(run_result)
        print(f"R2   : {run_result['R2']:.6f}")
        print(f"MAE  : {run_result['MAE']:.6f}")
        print(f"RMSE : {run_result['RMSE']:.6f}")
        print(f"Run ID: {run_result['Run_ID']}")

    comparison_frame = pd.DataFrame(results).sort_values(["R2", "MAE", "RMSE"], ascending=[False, True, True]).reset_index(drop=True)
    comparison_path = REPORTS_DIR / "mlflow_model_comparison_safe.csv"
    save_dataframe(comparison_frame.drop(columns=["Model_URI"]), comparison_path)

    with mlflow.start_run(run_name="model_comparison_safe") as comparison_run:
        mlflow.log_params(
            {
                "experiment_name": EXPERIMENT_NAME,
                "feature_mode": FEATURE_MODE,
                "split_type": "chronological",
                "input_dataset": INPUT_DATASET,
            }
        )
        mlflow.log_artifact(str(comparison_path))
        mlflow.log_text(comparison_frame.to_json(orient="records", indent=2), "mlflow_model_comparison_safe.json")

    print()
    print("=" * 70)
    print("FINAL MODEL COMPARISON")
    print("=" * 70)
    print(comparison_frame[["Algorithm", "R2", "MAE", "RMSE", "Run_ID"]].to_string(index=False))

    best_row = select_best_model(comparison_frame)
    print()
    print("=" * 70)
    print("BEST LEAKAGE-SAFE MODEL")
    print("=" * 70)
    print(f"Algorithm : {best_row['Algorithm']}")
    print(f"R2        : {best_row['R2']:.6f}")
    print(f"MAE       : {best_row['MAE']:.6f}")
    print(f"RMSE      : {best_row['RMSE']:.6f}")

    register_best_model(str(best_row["Run_ID"]))

    save_json(
        {
            "best_model": best_row["Algorithm"],
            "run_id": best_row["Run_ID"],
            "comparison_csv": str(comparison_path),
        },
        REPORTS_DIR / "mlflow_best_model_summary_safe.json",
    )

    print()
    print("MLflow experiment completed successfully.")


if __name__ == "__main__":
    main()