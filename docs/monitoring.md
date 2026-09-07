# Evidently Monitoring

This project uses Evidently to inspect prediction input and output distributions locally. Monitoring is separate from model training, MLflow tracking, and the DVC pipeline.

## Monitored data

- Reference data: `data/monitoring/reference.csv`, built from earlier rows in the existing processed sales data.
- Current fixture data: `data/monitoring/current.csv`, built from later rows in the same processed data and intended to represent production-like test batches.
- Runtime prediction records: `data/monitoring/prediction_log.csv`, created when `/predict` succeeds and ignored by Git.

The fixtures use the actual `/predict` input schema and predictions from the frozen `models/xgboost_v1.pkl` model. They contain no fabricated accuracy labels.

## Checks

The report includes:

- Data summary and missing-value checks.
- Feature distribution drift for the categorical and numeric API inputs.
- Prediction drift for `predicted_demand`.
- Prediction availability from the `prediction_status` field.

No accuracy, RMSE, or ground-truth performance claim is made because runtime monitoring records do not contain observed demand labels. Drift indicates a distribution change, not a model-quality measurement.

## Run locally

```bash
python -m src.run_monitoring
```

Reports are written to the ignored `reports/monitoring/` directory as `evidently_report.html` and `evidently_report.json`.

The `/predict` endpoint records only request features, prediction output, status, and model metadata. Monitoring write failures are logged and do not change the prediction response.