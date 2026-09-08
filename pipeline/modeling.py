from __future__ import annotations

import json
from pathlib import Path
from typing import Dict, List, Tuple

import joblib
import numpy as np
import pandas as pd
from sklearn.compose import ColumnTransformer
from sklearn.impute import SimpleImputer
from sklearn.linear_model import LinearRegression
from sklearn.metrics import mean_absolute_error, mean_squared_error, r2_score
from sklearn.pipeline import Pipeline
from sklearn.preprocessing import OneHotEncoder
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor
from xgboost import XGBRegressor

from src.common import MODELS_DIR, PROCESSED_DIR, RANDOM_SEED, SALES_DATE_COL, SALES_LEAKAGE_COLUMNS, SALES_TARGET, TEST_SIZE, chronological_split, ensure_directories, save_dataframe, save_json
from pipeline.feature_engineering import engineer_sales_features, SALES_CATEGORICAL_COLUMNS


LAG_COLUMNS = ["Demand_lag_1", "Demand_lag_7", "Demand_roll_7"]


def _categorical_encoder() -> OneHotEncoder:
    return OneHotEncoder(handle_unknown="ignore", sparse_output=False)


def build_preprocessor(features: pd.DataFrame) -> ColumnTransformer:
    categorical_columns = features.select_dtypes(include=["object", "category"]).columns.tolist()
    numeric_columns = [column for column in features.columns if column not in categorical_columns]

    return ColumnTransformer(
        transformers=[
            ("numeric", Pipeline([("imputer", SimpleImputer(strategy="median"))]), numeric_columns),
            ("categorical", Pipeline([("imputer", SimpleImputer(strategy="most_frequent")), ("encoder", _categorical_encoder())]), categorical_columns),
        ],
        remainder="drop",
        verbose_feature_names_out=True,
    )


def get_model(model_name: str):
    model_name = model_name.lower()
    if model_name == "linear_regression":
        return LinearRegression()
    if model_name == "decision_tree":
        return DecisionTreeRegressor(random_state=RANDOM_SEED, max_depth=None)
    if model_name == "random_forest":
        return RandomForestRegressor(n_estimators=200, random_state=RANDOM_SEED, n_jobs=-1)
    if model_name == "xgboost":
        return XGBRegressor(
            n_estimators=300,
            max_depth=6,
            learning_rate=0.05,
            subsample=0.9,
            colsample_bytree=0.9,
            objective="reg:squarederror",
            random_state=RANDOM_SEED,
            reg_alpha=0.0,
            reg_lambda=1.0,
            n_jobs=-1,
            tree_method="hist",
        )
    raise ValueError(f"Unsupported model name: {model_name}")


def evaluation_metrics(y_true, y_pred) -> Dict[str, float]:
    return {
        "R2": float(r2_score(y_true, y_pred)),
        "MAE": float(mean_absolute_error(y_true, y_pred)),
        "RMSE": float(np.sqrt(mean_squared_error(y_true, y_pred))),
    }


def load_sales_frame(path: str | Path, feature_mode: str, sample_size: int | None = None) -> pd.DataFrame:
    frame = pd.read_csv(path)
    leakage_safe = feature_mode == "safe"
    engineered = engineer_sales_features(frame, leakage_safe=leakage_safe)

    if feature_mode == "baseline":
        engineered = engineered.drop(columns=[column for column in LAG_COLUMNS if column in engineered.columns])
    else:
        engineered = engineered.dropna(subset=LAG_COLUMNS)

    engineered[SALES_DATE_COL] = pd.to_datetime(engineered[SALES_DATE_COL], errors="coerce")
    engineered = engineered.sort_values(SALES_DATE_COL).reset_index(drop=True)

    if sample_size is not None:
        engineered = engineered.head(sample_size).copy()

    return engineered


def train_test_from_frame(frame: pd.DataFrame) -> Tuple[pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    train_df, test_df, _, _ = chronological_split(frame, date_col=SALES_DATE_COL, test_size=TEST_SIZE)
    y_train = train_df[SALES_TARGET].copy()
    y_test = test_df[SALES_TARGET].copy()
    X_train = train_df.drop(columns=[SALES_TARGET, SALES_DATE_COL])
    X_test = test_df.drop(columns=[SALES_TARGET, SALES_DATE_COL])
    return train_df, test_df, X_train, X_test, y_train, y_test


def fit_pipeline(model_name: str, X_train: pd.DataFrame, y_train: pd.Series) -> Pipeline:
    preprocessor = build_preprocessor(X_train)
    model = get_model(model_name)
    pipeline = Pipeline([("preprocess", preprocessor), ("model", model)])
    pipeline.fit(X_train, y_train)
    return pipeline


def get_transformed_feature_names(pipeline: Pipeline) -> List[str]:
    preprocessor = pipeline.named_steps["preprocess"]
    return list(preprocessor.get_feature_names_out())


def compute_feature_importance(pipeline: Pipeline, model_name: str) -> pd.DataFrame:
    model_name = model_name.lower()
    if model_name not in {"decision_tree", "random_forest", "xgboost"}:
        return pd.DataFrame(columns=["Algorithm", "Feature", "Importance"])

    feature_names = get_transformed_feature_names(pipeline)
    model = pipeline.named_steps["model"]

    if hasattr(model, "feature_importances_"):
        importances = model.feature_importances_
    else:
        return pd.DataFrame(columns=["Algorithm", "Feature", "Importance"])

    importance_frame = pd.DataFrame(
        {
            "Algorithm": model_name,
            "Feature": feature_names,
            "Importance": importances,
        }
    ).sort_values("Importance", ascending=False)

    return importance_frame


def model_filename(model_name: str, feature_mode: str) -> str:
    safe_name = model_name.lower()
    if feature_mode == "baseline":
        return f"{safe_name}_baseline_v1.pkl"
    return f"{safe_name}_v1.pkl"


def train_models_for_mode(
    model_names: List[str],
    feature_mode: str,
    input_path: str | Path,
    sample_size: int | None = None,
) -> Tuple[pd.DataFrame, pd.DataFrame, Dict[str, Dict[str, float]], Dict[str, str], pd.DataFrame]:
    ensure_directories()
    frame = load_sales_frame(input_path, feature_mode=feature_mode, sample_size=sample_size)
    train_df, test_df, X_train, X_test, y_train, y_test = train_test_from_frame(frame)

    results: List[Dict[str, float | str]] = []
    model_paths: Dict[str, str] = {}
    all_feature_importance: List[pd.DataFrame] = []
    metrics_by_model: Dict[str, Dict[str, float]] = {}

    for model_name in model_names:
        pipeline = fit_pipeline(model_name, X_train, y_train)
        predictions = pipeline.predict(X_test)
        metrics = evaluation_metrics(y_test, predictions)
        metrics_by_model[model_name] = metrics
        results.append({"Algorithm": model_name, **metrics})

        artifact_path = MODELS_DIR / model_filename(model_name, feature_mode)
        joblib.dump(pipeline, artifact_path)
        model_paths[model_name] = str(artifact_path)

        feature_importance = compute_feature_importance(pipeline, model_name)
        if not feature_importance.empty:
            all_feature_importance.append(feature_importance)

    comparison_frame = pd.DataFrame(results).sort_values(["R2", "MAE"], ascending=[False, True]).reset_index(drop=True)
    feature_importance_frame = pd.concat(all_feature_importance, ignore_index=True) if all_feature_importance else pd.DataFrame(columns=["Algorithm", "Feature", "Importance"])
    return frame, comparison_frame, metrics_by_model, model_paths, feature_importance_frame


def save_model_metrics(output_path: str | Path, metrics: Dict[str, Dict[str, float]]) -> None:
    save_json(metrics, output_path)
