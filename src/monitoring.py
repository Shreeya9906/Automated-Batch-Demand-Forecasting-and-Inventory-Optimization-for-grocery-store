from __future__ import annotations

from datetime import datetime, timezone
from pathlib import Path
from typing import Mapping

import pandas as pd
from evidently import Report
from evidently.presets import DataDriftPreset, DataSummaryPreset

PROJECT_ROOT = Path(__file__).resolve().parents[1]
MONITORING_DATA_DIR = PROJECT_ROOT / "data" / "monitoring"
MONITORING_REPORT_DIR = PROJECT_ROOT / "reports" / "monitoring"
PREDICTION_LOG_PATH = MONITORING_DATA_DIR / "prediction_log.csv"

INPUT_COLUMNS = [
    "Store ID",
    "Product ID",
    "Category",
    "Region",
    "Price",
    "Discount",
    "Weather Condition",
    "Promotion",
    "Competitor Pricing",
    "Seasonality",
    "Epidemic",
    "Date",
    "Demand_lag_1",
    "Demand_lag_7",
    "Demand_roll_7",
]
MONITORING_COLUMNS = INPUT_COLUMNS + ["predicted_demand"]
RECORD_COLUMNS = [
    "timestamp",
    *INPUT_COLUMNS,
    "predicted_demand",
    "prediction_status",
    "model_name",
    "model_version",
]


def load_monitoring_data(path: str | Path) -> pd.DataFrame:
    """Load and validate a monitoring dataset with the API input schema."""
    data = pd.read_csv(path)
    missing = [column for column in RECORD_COLUMNS if column not in data.columns]
    if missing:
        raise ValueError(f"Monitoring data is missing columns: {missing}")
    return data[RECORD_COLUMNS].copy()


def record_prediction(
    input_data: Mapping[str, object],
    predicted_demand: float,
    model_name: str,
    model_version: str,
    path: str | Path = PREDICTION_LOG_PATH,
) -> None:
    """Append a lightweight prediction record for asynchronous monitoring."""
    record = {
        "timestamp": datetime.now(timezone.utc).isoformat(),
        **{column: input_data.get(column) for column in INPUT_COLUMNS},
        "predicted_demand": predicted_demand,
        "prediction_status": "success",
        "model_name": model_name,
        "model_version": model_version,
    }
    output_path = Path(path)
    output_path.parent.mkdir(parents=True, exist_ok=True)
    pd.DataFrame([record], columns=RECORD_COLUMNS).to_csv(
        output_path,
        mode="a",
        header=not output_path.exists(),
        index=False,
    )


def build_monitoring_report(
    reference_data: pd.DataFrame, current_data: pd.DataFrame
):
    """Build an Evidently report for quality, feature drift, and prediction drift."""
    reference = reference_data[MONITORING_COLUMNS]
    current = current_data[MONITORING_COLUMNS]
    return Report(
        metrics=[DataSummaryPreset(), DataDriftPreset(columns=MONITORING_COLUMNS)],
        include_tests=True,
        reference_id="reference",
        model_id="grocery-demand-xgboost",
    ).run(current_data=current, reference_data=reference)


def save_monitoring_report(snapshot, output_dir: str | Path = MONITORING_REPORT_DIR):
    output_path = Path(output_dir)
    output_path.mkdir(parents=True, exist_ok=True)
    html_path = output_path / "evidently_report.html"
    json_path = output_path / "evidently_report.json"
    snapshot.save_html(str(html_path))
    snapshot.save_json(str(json_path))
    return html_path, json_path