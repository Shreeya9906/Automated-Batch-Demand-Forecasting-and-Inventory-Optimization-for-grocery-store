from __future__ import annotations

import json
from pathlib import Path
from typing import Any, Dict, Iterable, List, Sequence, Tuple

import numpy as np
import pandas as pd


ROOT_DIR = Path(__file__).resolve().parents[1]
DATA_DIR = ROOT_DIR / "data"
HISTORICAL_DIR = DATA_DIR / "historical"
INVENTORY_DIR = DATA_DIR / "inventory"
PROCESSED_DIR = DATA_DIR / "processed"
SYNTHETIC_DIR = DATA_DIR / "synthetic"
MODELS_DIR = ROOT_DIR / "models"
REPORTS_DIR = ROOT_DIR / "reports"
CONFIG_DIR = ROOT_DIR / "config"

RAW_SALES_PATH = ROOT_DIR / "sales_data.csv"
RAW_INVENTORY_PATH = ROOT_DIR / "supply_chain_dataset1.csv"

RANDOM_SEED = 42
TEST_SIZE = 0.2

SALES_TARGET = "Demand"
SALES_DATE_COL = "Date"
SALES_ID_COLUMNS = ["Store ID", "Product ID"]
SALES_LEAKAGE_COLUMNS = ["Units Sold", "Inventory Level", "Units Ordered"]

INVENTORY_DATE_COL = "Date"
INVENTORY_ID_COLUMNS = ["SKU_ID", "Warehouse_ID", "Supplier_ID"]
INVENTORY_BENCHMARK_COLUMN = "Demand_Forecast"


def ensure_directories() -> None:
    for directory in [
        DATA_DIR,
        HISTORICAL_DIR,
        INVENTORY_DIR,
        PROCESSED_DIR,
        SYNTHETIC_DIR,
        MODELS_DIR,
        REPORTS_DIR,
        CONFIG_DIR,
    ]:
        directory.mkdir(parents=True, exist_ok=True)


def load_dataframe(path: Path | str) -> pd.DataFrame:
    return pd.read_csv(path)


def save_dataframe(df: pd.DataFrame, path: Path | str) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    df.to_csv(target, index=False)


def json_default(value: Any) -> Any:
    if isinstance(value, (np.integer,)):
        return int(value)
    if isinstance(value, (np.floating,)):
        return float(value)
    if isinstance(value, (np.ndarray,)):
        return value.tolist()
    if isinstance(value, (pd.Timestamp,)):
        return value.isoformat()
    if isinstance(value, Path):
        return str(value)
    return value


def save_json(data: Dict[str, Any], path: Path | str) -> None:
    target = Path(path)
    target.parent.mkdir(parents=True, exist_ok=True)
    with target.open("w", encoding="utf-8") as handle:
        json.dump(data, handle, indent=2, default=json_default)


def format_number(value: Any) -> Any:
    if pd.isna(value):
        return None
    if isinstance(value, (np.integer, int)):
        return int(value)
    if isinstance(value, (np.floating, float)):
        return float(value)
    return value


def iqr_outlier_count(series: pd.Series) -> int:
    cleaned = pd.to_numeric(series, errors="coerce").dropna()
    if cleaned.empty:
        return 0
    q1 = cleaned.quantile(0.25)
    q3 = cleaned.quantile(0.75)
    iqr = q3 - q1
    if iqr == 0:
        return 0
    lower = q1 - 1.5 * iqr
    upper = q3 + 1.5 * iqr
    return int(((cleaned < lower) | (cleaned > upper)).sum())


def summarize_dataframe(df: pd.DataFrame, date_col: str | None = None) -> Dict[str, Any]:
    report: Dict[str, Any] = {
        "shape": [int(df.shape[0]), int(df.shape[1])],
        "columns": list(df.columns),
        "data_types": {column: str(dtype) for column, dtype in df.dtypes.items()},
        "missing_values": {column: int(value) for column, value in df.isna().sum().items()},
        "duplicate_rows": int(df.duplicated().sum()),
    }

    if date_col and date_col in df.columns:
        date_series = pd.to_datetime(df[date_col], errors="coerce")
        report["date_range"] = {
            "min": date_series.min(),
            "max": date_series.max(),
            "invalid_dates": int(date_series.isna().sum()),
        }

    numeric_columns = df.select_dtypes(include=["number"]).columns.tolist()
    report["numeric_ranges"] = {
        column: {
            "min": format_number(df[column].min()),
            "max": format_number(df[column].max()),
            "mean": format_number(df[column].mean()),
            "std": format_number(df[column].std()),
            "median": format_number(df[column].median()),
            "q1": format_number(df[column].quantile(0.25)),
            "q3": format_number(df[column].quantile(0.75)),
            "outlier_count": iqr_outlier_count(df[column]),
        }
        for column in numeric_columns
    }

    categorical_columns = df.select_dtypes(exclude=["number"]).columns.tolist()
    report["categorical_distributions"] = {
        column: df[column].astype(str).value_counts(dropna=False).head(5).to_dict()
        for column in categorical_columns
    }

    return report


def chronological_split(
    df: pd.DataFrame,
    date_col: str = SALES_DATE_COL,
    test_size: float = TEST_SIZE,
) -> Tuple[pd.DataFrame, pd.DataFrame, pd.Series, pd.Series]:
    ordered = df.copy()
    ordered[date_col] = pd.to_datetime(ordered[date_col], errors="coerce")
    ordered = ordered.sort_values(date_col).reset_index(drop=True)
    unique_dates = ordered[date_col].dropna().sort_values().unique()
    split_index = max(1, int(len(unique_dates) * (1 - test_size)))
    split_date = unique_dates[split_index - 1]

    train_mask = ordered[date_col] <= split_date
    train_df = ordered.loc[train_mask].copy()
    test_df = ordered.loc[~train_mask].copy()

    return train_df, test_df, train_df[date_col], test_df[date_col]


def safe_feature_columns(columns: Sequence[str], excluded: Iterable[str]) -> List[str]:
    excluded_set = set(excluded)
    return [column for column in columns if column not in excluded_set]


def report_to_markdown(report: Dict[str, Any], title: str) -> str:
    lines = [f"# {title}", ""]
    lines.append(f"- Shape: {tuple(report.get('shape', []))}")
    if "duplicate_rows" in report:
        lines.append(f"- Duplicate rows: {report['duplicate_rows']}")
    if "date_range" in report:
        date_range = report["date_range"]
        lines.append(f"- Date range: {date_range.get('min')} to {date_range.get('max')}")
        lines.append(f"- Invalid dates: {date_range.get('invalid_dates')}")

    lines.append("")
    lines.append("## Columns")
    for column in report.get("columns", []):
        lines.append(f"- {column}")

    lines.append("")
    lines.append("## Missing Values")
    for column, value in report.get("missing_values", {}).items():
        lines.append(f"- {column}: {value}")

    lines.append("")
    lines.append("## Numeric Ranges")
    for column, stats in report.get("numeric_ranges", {}).items():
        lines.append(
            f"- {column}: min={stats.get('min')}, max={stats.get('max')}, mean={stats.get('mean')}, outliers={stats.get('outlier_count')}"
        )

    return "\n".join(lines)
