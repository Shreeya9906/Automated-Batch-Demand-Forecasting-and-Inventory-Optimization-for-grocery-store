# Grocery Demand Forecasting API

Production-oriented FastAPI backend for grocery demand forecasting and inventory optimization.

## Architecture

- Leakage-safe XGBoost demand model in `models/xgboost_v1.pkl`.
- FastAPI endpoints for prediction and inventory decisions.
- Deterministic inventory optimization using synthetic warehouse and SKU parameters.
- MLflow experiment history and DVC pipeline retained for reproducibility.
- Docker image and GitHub Actions CI for repeatable validation.
- Evidently monitoring for input drift, prediction drift, data quality, and prediction availability.

## Run locally

```bash
python -m pip install -r requirements.txt
uvicorn src.api:app --reload
```

The API is available at `http://localhost:8000`; Swagger/OpenAPI is at `http://localhost:8000/docs`. Configure frontend CORS with `FRONTEND_ORIGIN=http://localhost:5173`.

See [docs/api-contract.md](docs/api-contract.md) for request and response schemas.

## Docker

```bash
docker build -t grocery-demand-api:v1.3.0 .
docker run --rm -p 8000:8000 grocery-demand-api:v1.3.0
```

The container exposes `GET /`, `GET /health`, `POST /predict`, `POST /optimize`, and `GET /docs`.

## Monitoring

```bash
python -m src.run_monitoring
```

Reports are written to `reports/monitoring/`, which is ignored by Git. Runtime prediction records are written to `data/monitoring/prediction_log.csv`. Monitoring does not claim model accuracy because runtime records do not contain ground-truth demand labels.

## Reproducibility

DVC tracks the historical datasets and batch pipeline. MLflow tracks experiments and model registry metadata. The historical training and validation modules remain available for DVC reproducibility, while the deployed API uses only the frozen model and inventory parameters.
