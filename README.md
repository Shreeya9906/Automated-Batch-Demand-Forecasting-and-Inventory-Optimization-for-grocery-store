# Grocery Demand Forecasting API

Production-oriented FastAPI backend for grocery demand forecasting and inventory optimization.

## Architecture

- Leakage-safe XGBoost demand model in `models/xgboost_v1.pkl`.
- FastAPI endpoints for prediction and inventory decisions.
- Deterministic inventory optimization using synthetic warehouse and SKU parameters.
- DVC pipeline retained for reproducibility.
- Docker image and GitHub Actions CI for repeatable validation.
- Evidently monitoring for input drift, prediction drift, data quality, and prediction availability.

Production code lives in `src/`. Training, preprocessing, validation, and DVC stages live in `pipeline/`. Project data is organized under `data/historical/`, `data/inventory/`, `data/processed/`, `data/monitoring/`, and `data/synthetic/`.

## Run locally

```bash
python -m pip install -r requirements.txt
uvicorn src.api:app --reload
```

The API is available at `http://localhost:8000`; Swagger/OpenAPI is at `http://localhost:8000/docs`. Configure frontend CORS with `FRONTEND_ORIGIN=http://localhost:5173`.

See [docs/api-contract.md](docs/api-contract.md) for request and response schemas.

## Web Frontend Dashboard (StockFlow AI)

An interactive React + Vite dashboard is located in `frontend/`:

```bash
cd frontend
npm install
npm run dev
```

The UI is hosted at `http://localhost:5173/`, featuring:
- **Demand Forecaster**: Interactive scenario simulator for XGBoost model inference.
- **Inventory Optimizer**: Deterministic stock replenishment calculator with safety stock and shortage penalty constraints.
- **Scenario Matrix**: Side-by-side sensitivity simulation across promotion and supply scenarios.
- **Model & Drift Health**: Real-time inference latency telemetry and Evidently AI feature drift tracking.
- **API Inspector**: JSON payload schemas and cURL command exporter.


## Docker

```bash
docker build -t grocery-demand-api:v1.3.0 .
docker run --rm -p 8000:8000 grocery-demand-api:v1.3.0
```

The container exposes `GET /`, `GET /health`, `POST /predict`, `POST /optimize`, and `GET /docs`.

## Monitoring

```bash
python -m pipeline.run_monitoring
```

Reports are written to `reports/monitoring/`, which is ignored by Git. Runtime prediction records are written to `data/monitoring/prediction_log.csv`. Monitoring does not claim model accuracy because runtime records do not contain ground-truth demand labels.

## Reproducibility

DVC tracks the historical datasets and batch pipeline. The historical training and validation modules remain available for DVC reproducibility, while the deployed API uses only the frozen model and inventory parameters.

## Continuous Training Status

The raw training datasets are represented in Git by DVC pointer files, not by the CSV data itself. This repository currently has no configured DVC remote, so the Continuous Training workflow cannot retrieve the training data on a clean GitHub Actions runner. The workflow is available for manual dispatch, but it fails before training when no DVC remote is configured and does not promote a model.

Local DVC training remains possible when the required data is available locally. A real DVC remote and the required GitHub Actions access configuration must be added before scheduled automated retraining can be enabled.
