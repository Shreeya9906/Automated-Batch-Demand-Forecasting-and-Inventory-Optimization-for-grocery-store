import pandas as pd
from fastapi.testclient import TestClient
from src.api import app

def test_root():
    with TestClient(app) as client:
        response = client.get("/")
        assert response.status_code == 200
        data = response.json()
        assert "api_name" in data
        assert data["model_name"] == "XGBoost"

def test_health():
    with TestClient(app) as client:
        response = client.get("/health")
        assert response.status_code == 200
        data = response.json()
        assert "status" in data
        assert "model_loaded" in data

def test_predict():
    payload = {
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
    with TestClient(app) as client:
        response = client.post("/predict", json=payload)
        if response.status_code != 200:
            print("Predict error:", response.json())
        assert response.status_code == 200
        data = response.json()
        assert "predicted_demand" in data
        assert data["model_name"] == "XGBoost"
        assert data["model_version"] == "1"

def test_optimize():
    payload = {
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
    with TestClient(app) as client:
        response = client.post("/optimize", json=payload)
        if response.status_code != 200:
            print("Optimize error:", response.json())
        assert response.status_code == 200
        data = response.json()
        assert "predicted_demand" in data
        assert "recommended_order_quantity" in data
        assert "stock_status" in data
