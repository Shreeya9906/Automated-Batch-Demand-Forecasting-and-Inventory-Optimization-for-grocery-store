from pathlib import Path

from src.monitoring import (
    MONITORING_COLUMNS,
    build_monitoring_report,
    load_monitoring_data,
    save_monitoring_report,
)


DATA_DIR = Path(__file__).parents[1] / "data" / "monitoring"


def test_monitoring_data_can_be_loaded():
    reference = load_monitoring_data(DATA_DIR / "reference.csv")
    current = load_monitoring_data(DATA_DIR / "current.csv")

    assert len(reference) == 8
    assert len(current) == 8
    assert list(reference.columns)[0] == "timestamp"
    assert set(MONITORING_COLUMNS).issubset(reference.columns)


def test_reference_and_current_schemas_are_compatible():
    reference = load_monitoring_data(DATA_DIR / "reference.csv")
    current = load_monitoring_data(DATA_DIR / "current.csv")

    assert list(reference.columns) == list(current.columns)
    assert reference[MONITORING_COLUMNS].dtypes.astype(str).tolist() == current[
        MONITORING_COLUMNS
    ].dtypes.astype(str).tolist()


def test_evidently_report_is_generated(tmp_path):
    reference = load_monitoring_data(DATA_DIR / "reference.csv")
    current = load_monitoring_data(DATA_DIR / "current.csv")

    snapshot = build_monitoring_report(reference, current)
    html_path, json_path = save_monitoring_report(snapshot, tmp_path)

    assert html_path.exists()
    assert json_path.exists()
    assert html_path.stat().st_size > 0
    assert json_path.stat().st_size > 0