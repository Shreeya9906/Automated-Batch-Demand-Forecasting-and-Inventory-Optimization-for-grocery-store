# Automated Batch Demand Forecasting and Inventory Optimization for Grocery Store

## Overview

This project helps grocery stores plan inventory by forecasting product demand from historical sales data and turning those forecasts into replenishment recommendations. A leakage-safe XGBoost model estimates demand, while the inventory optimization service combines that estimate with stock and warehouse constraints to support ordering decisions.

## Key Features

- XGBoost demand forecasting
- Leakage-safe feature engineering
- Inventory optimization using warehouse and SKU parameters
- FastAPI REST API
- React/Vite business dashboard
- DVC-based data and pipeline reproducibility
- Evidently monitoring for data and prediction drift
- Dockerized backend
- GitHub Actions CI and continuous-training workflow
- Prediction logging

## System Architecture

```text
Historical Sales & Inventory Data
			|
			v
Data Processing & Feature Engineering
			|
			v
		DVC Pipeline
			|
			v
  XGBoost Demand Forecasting
			|
			v
	  FastAPI Backend
		 /       \
		v         v
Demand Prediction  Inventory Optimization
		\         /
		 v       v
	  React/Vite Dashboard
```

## Machine Learning Model

The production model in `models/xgboost_v1.pkl` uses XGBoost regression to forecast grocery demand. It uses leakage-safe historical demand features, product and store attributes, pricing and promotion signals, calendar information, and weather or seasonality inputs.

Production model metrics:

| Metric | Value |
|---|---:|
| R² | 0.7503 |
| MAE | 16.2089 |
| RMSE | 22.0442 |

## Inventory Optimization

The optimization service combines predicted demand with current inventory, reorder point, safety stock, warehouse capacity, holding cost, and ordering cost. It produces a recommended order quantity and inventory decision information for each warehouse and SKU scenario.

## Technology Stack

| Area | Technologies |
|---|---|
| Backend | Python, FastAPI, Pydantic |
| Machine learning | XGBoost, scikit-learn, Pandas, NumPy, SciPy |
| Data and MLOps | DVC, Evidently, joblib |
| Frontend | React, Vite, JavaScript, Lucide React |
| Deployment | Docker |
| Automation | GitHub Actions |
| Testing | pytest |

## Project Structure

```text
src/                 FastAPI application and shared services
pipeline/            Data processing, training, optimization, and monitoring stages
models/              Production model artifacts
data/                Historical, inventory, processed, synthetic, and monitoring data
reports/             Evaluation, mapping, optimization, and monitoring outputs
tests/               Backend API and monitoring tests
frontend/            React/Vite dashboard
.github/workflows/   CI and continuous-training workflows
Dockerfile           Backend container definition
dvc.yaml             DVC pipeline stages
dvc.lock             Locked DVC pipeline state
requirements.txt     Python dependencies
```

## Installation

```bash
git clone https://github.com/Shreeya9906/Automated-Batch-Demand-Forecasting-and-Inventory-Optimization-for-grocery-store.git
cd grocery-demand-forecasting
python -m venv .venv
.venv\Scripts\Activate.ps1
pip install -r requirements.txt
```

DVC tracks the versioned datasets and pipeline outputs. Install the dependencies above before using the DVC pipeline locally.

## Run Backend

```bash
python -m uvicorn src.api:app --reload
```

- API: http://localhost:8000
- Swagger: http://localhost:8000/docs
- Health: http://localhost:8000/health

Set `FRONTEND_ORIGIN` when the dashboard is served from a different origin.

## Run Frontend

```bash
cd frontend
npm install
npm run dev
```

Open http://localhost:5173. The dashboard communicates with the FastAPI backend. Set `VITE_API_URL` to configure the backend base URL.

## API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| GET | `/` | API information |
| GET | `/health` | Health check |
| POST | `/predict` | Demand prediction |
| POST | `/optimize` | Demand forecasting and inventory optimization |
| GET | `/docs` | Swagger API documentation |

See [docs/api-contract.md](docs/api-contract.md) for request and response schemas.

## Docker

```bash
docker build -t grocery-demand-api .
docker run --rm -p 8000:8000 grocery-demand-api
```

The image packages the FastAPI backend, production model, and inventory artifacts.

## Monitoring

Evidently monitors data quality, feature drift, prediction drift, prediction availability, and schema validation. Prediction records are written to `data/monitoring/prediction_log.csv`, and generated reports are stored under `reports/monitoring/`.

```bash
python -m pipeline.run_monitoring
```

## Testing

```bash
python -m pytest tests/test_api.py tests/test_monitoring.py -s
```

For the frontend:

```bash
cd frontend
npm run lint
npm run build
```

## MLOps Workflow

```text
Data -> DVC -> preprocessing -> feature engineering -> XGBoost training
	 -> evaluation -> production model -> FastAPI serving
	 -> inventory optimization -> monitoring
```

GitHub Actions provides continuous integration and a continuous-training workflow for the model lifecycle.
