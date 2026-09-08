from __future__ import annotations

from pathlib import Path

from src.monitoring import (
    MONITORING_DATA_DIR,
    MONITORING_REPORT_DIR,
    build_monitoring_report,
    load_monitoring_data,
    save_monitoring_report,
)


def main() -> None:
    reference_path = MONITORING_DATA_DIR / "reference.csv"
    current_path = MONITORING_DATA_DIR / "current.csv"
    reference_data = load_monitoring_data(reference_path)
    current_data = load_monitoring_data(current_path)
    snapshot = build_monitoring_report(reference_data, current_data)
    html_path, json_path = save_monitoring_report(snapshot, MONITORING_REPORT_DIR)

    successful = (current_data["prediction_status"] == "success").sum()
    missing_values = int(current_data.isna().sum().sum())
    print(f"Reference records: {len(reference_data)}")
    print(f"Current records: {len(current_data)}")
    print(f"Prediction availability: {successful}/{len(current_data)} successful")
    print(f"Missing values: {missing_values}")
    print(f"HTML report: {Path(html_path)}")
    print(f"JSON report: {Path(json_path)}")


if __name__ == "__main__":
    main()