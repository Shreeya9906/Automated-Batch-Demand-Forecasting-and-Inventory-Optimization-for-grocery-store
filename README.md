# Automated Batch Demand Forecasting and Inventory Optimization for Grocery Supply Chains

This workspace implements two independent pipelines:

1. Historical sales forecasting for `sales_data.csv`
2. Inventory optimization for `supply_chain_dataset1.csv`

The raw datasets are not combined directly. They are connected through deterministic mapping tables and a derived decision dataset after predicted demand is produced.

## Run order

1. `python -m src.validate_sales`
2. `python -m src.validate_inventory`
3. `python -m src.preprocess_sales`
4. `python -m src.preprocess_inventory`
5. `python -m src.analyze_leakage`
6. `python -m src.train_models --feature-mode baseline`
7. `python -m src.train_models --feature-mode safe`
8. `python -m src.train_xgboost --feature-mode safe`
9. `python -m src.evaluate_models`
10. `python -m src.generate_forecasts`
11. `python -m src.create_mapping`
12. `python -m src.integrate_datasets`
13. `python -m src.generate_synthetic_parameters`
14. `python -m src.optimize_inventory`

## Notes

- `Units Sold`, `Inventory Level`, and `Units Ordered` are treated as leakage risks for the forecasting model.
- `Demand_Forecast` in the inventory dataset is treated as a reference benchmark, not as the project prediction input.
- The mapping tables are deterministic prototype crosswalks, not claims of real-world equivalence.

## Phase 2: FastAPI Deployment

This project includes a FastAPI layer that exposes the leakage-safe forecasting model and the existing inventory optimization logic as a service. 

- **Model Used**: `models/xgboost_v1.pkl` (The leakage-safe XGBoost model)
- **MLflow Registered Model**: `GroceryDemandForecasting v1`

### Endpoints

- `GET /`: Returns API and project metadata.
- `GET /health`: Returns the health status, indicating if the model and parameters are loaded.
- `POST /predict`: Predicts demand using the loaded XGBoost model.
- `POST /optimize`: Generates demand prediction and passes it to the inventory optimization function to return recommended order quantities and status.

### How to Start

Run the API locally using uvicorn:
```bash
uvicorn src.api:app --reload
```

Once running, access the interactive Swagger documentation at:
http://127.0.0.1:8000/docs

### Note on Historical Lag Features

The current API prototype accepts historical lag features (`Demand_lag_1`, `Demand_lag_7`, `Demand_roll_7`) explicitly in the request schema. In a production implementation, these values should be obtained automatically from the historical data layer or feature store, rather than being manually provided by the API client.

## Phase 3: Docker Deployment

The FastAPI application can be packaged into a reproducible Docker container, eliminating local environment discrepancies.

### Prerequisites
- Docker Desktop (or standard Docker daemon) installed and running.

### Build the Image
To build the Docker image locally, run the following command from the project root:
```bash
docker build -t grocery-demand-api:v1.2.0 .
```

### Run the Container
Start the container and map port 8000:
```bash
docker run --rm -p 8000:8000 grocery-demand-api:v1.2.0
```

Once the container is running, the API will be available at:
- API Root: `http://localhost:8000`
- Swagger UI: `http://localhost:8000/docs`

The container exposes all the same endpoints (`/health`, `/predict`, `/optimize`) as the local deployment, powered by the exact same validated model (`models/xgboost_v1.pkl`).
