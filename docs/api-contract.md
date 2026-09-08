# Frontend API Contract

Base URL for local development:

```text
http://localhost:8000
```

The backend uses JSON request and response bodies. Field names containing spaces are intentional and must be sent exactly as shown.

## `GET /`

Returns API and model metadata.

Example response:

```json
{
  "project": "Grocery Demand Forecasting and Inventory Optimization",
  "api_name": "Grocery Demand Forecasting API",
  "api_version": "1.0.0",
  "model_name": "XGBoost",
  "model_version": "1"
}
```

## `GET /health`

Returns service readiness. `status` is `healthy` only when both `model_loaded` and `inventory_parameters_loaded` are true.

Example response:

```json
{
  "status": "healthy",
  "model_loaded": true,
  "inventory_parameters_loaded": true,
  "model_name": "XGBoost",
  "model_version": "1",
  "mlflow_registered_model": "GroceryDemandForecasting"
}
```

## `POST /predict`

Predicts demand using the loaded model. Every field is required and uses the indicated JSON type.

| Field | Type |
| --- | --- |
| `Store ID` | string |
| `Product ID` | string |
| `Category` | string |
| `Region` | string |
| `Price` | number |
| `Discount` | number |
| `Weather Condition` | string |
| `Promotion` | integer |
| `Competitor Pricing` | number |
| `Seasonality` | string |
| `Epidemic` | integer |
| `Date` | string, parseable as a date |
| `Demand_lag_1` | number |
| `Demand_lag_7` | number |
| `Demand_roll_7` | number |

Example request:

```json
{
  "Store ID": "S001",
  "Product ID": "P0001",
  "Category": "Electronics",
  "Region": "North",
  "Price": 72.72,
  "Discount": 5.0,
  "Weather Condition": "Snowy",
  "Promotion": 0,
  "Competitor Pricing": 85.73,
  "Seasonality": "Winter",
  "Epidemic": 0,
  "Date": "2022-01-01",
  "Demand_lag_1": 100.0,
  "Demand_lag_7": 110.0,
  "Demand_roll_7": 105.0
}
```

Example response shape:

```json
{
  "predicted_demand": -9.761829376220703,
  "model_name": "XGBoost",
  "model_version": "1"
}
```

The numeric prediction is produced by the existing model and is not fixed. Invalid or missing fields return HTTP 422 with FastAPI validation JSON in the form `{"detail": [...]}`. A processing failure returns HTTP 400 with `{"detail": "Unable to process prediction request."}`.

## `POST /optimize`

Runs the existing demand prediction and inventory optimization. It accepts every `/predict` field plus the following required fields:

| Field | Type | Required |
| --- | --- | --- |
| `Warehouse_ID` | string | yes |
| `SKU_ID` | string | yes |
| `Inventory_Level` | number | yes |
| `Reorder_Point` | number | no, defaults to `0.0` |

The shared prediction fields have the same types and requirements as `/predict`.

Example request:

```json
{
  "Store ID": "S001",
  "Product ID": "P0001",
  "Category": "Electronics",
  "Region": "North",
  "Price": 72.72,
  "Discount": 5.0,
  "Weather Condition": "Snowy",
  "Promotion": 0,
  "Competitor Pricing": 85.73,
  "Seasonality": "Winter",
  "Epidemic": 0,
  "Date": "2022-01-01",
  "Demand_lag_1": 100.0,
  "Demand_lag_7": 110.0,
  "Demand_roll_7": 105.0,
  "Warehouse_ID": "WH_1",
  "SKU_ID": "SKU_1",
  "Inventory_Level": 195.0
}
```

Example response shape:

```json
{
  "predicted_demand": -9.761829376220703,
  "recommended_order_quantity": 0,
  "reorder_decision": false,
  "expected_inventory": 204.76,
  "stock_status": "STABLE",
  "potential_stockout": false,
  "estimated_inventory_cost": 384.95
}
```

Invalid or missing fields return HTTP 422 with `{"detail": [...]}`. A processing failure returns HTTP 400 with `{"detail": "Unable to process optimization request."}`.

## `GET /docs`

Interactive Swagger/OpenAPI documentation is available at `http://localhost:8000/docs`.

## CORS

For local frontend development, configure the backend before starting it:

```text
FRONTEND_ORIGIN=http://localhost:5173
```

The backend allows GET and POST requests from that configured origin. The default is `http://localhost:5173`; production deployments should set `FRONTEND_ORIGIN` to the actual frontend origin rather than using a wildcard.