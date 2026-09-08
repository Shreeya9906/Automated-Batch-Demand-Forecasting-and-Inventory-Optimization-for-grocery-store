import pandas as pd
from fastapi.testclient import TestClient
from src.api import app


PREDICT_PAYLOAD = {
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
}


OPTIMIZE_PAYLOAD = {
    **PREDICT_PAYLOAD,
    "Warehouse_ID": "WH_1",
    "SKU_ID": "SKU_1",
    "Inventory_Level": 195.0,
}

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
    with TestClient(app) as client:
        response = client.post("/predict", json=PREDICT_PAYLOAD)
        if response.status_code != 200:
            print("Predict error:", response.json())
        assert response.status_code == 200
        data = response.json()
        assert "predicted_demand" in data
        assert data["model_name"] == "XGBoost"
        assert data["model_version"] == "1"

def test_optimize():
    with TestClient(app) as client:
        response = client.post("/optimize", json=OPTIMIZE_PAYLOAD)
        if response.status_code != 200:
            print("Optimize error:", response.json())
        assert response.status_code == 200
        data = response.json()
        assert "predicted_demand" in data
        assert "recommended_order_quantity" in data
        assert "stock_status" in data


def test_invalid_predict_returns_structured_validation_error():
    with TestClient(app) as client:
        response = client.post("/predict", json={})

    assert response.status_code == 422
    assert isinstance(response.json()["detail"], list)


def test_invalid_optimize_returns_structured_validation_error():
    with TestClient(app) as client:
        response = client.post("/optimize", json={})

    assert response.status_code == 422
    assert isinstance(response.json()["detail"], list)


def test_cors_allows_configured_frontend_origin():
    with TestClient(app) as client:
        response = client.options(
            "/predict",
            headers={
                "Origin": "http://localhost:5173",
                "Access-Control-Request-Method": "POST",
            },
        )

    assert response.status_code == 200
    assert response.headers["access-control-allow-origin"] == "http://localhost:5173"


def test_monitoring_failure_does_not_break_prediction(monkeypatch):
    def fail_recording(*args, **kwargs):
        raise OSError("monitoring unavailable")

    monkeypatch.setattr("src.api.record_prediction", fail_recording)
    with TestClient(app) as client:
        response = client.post("/predict", json=PREDICT_PAYLOAD)

    assert response.status_code == 200
    assert "predicted_demand" in response.json()
