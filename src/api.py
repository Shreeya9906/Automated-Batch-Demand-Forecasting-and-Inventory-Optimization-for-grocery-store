from __future__ import annotations

import logging
from contextlib import asynccontextmanager
from typing import Any, Dict

import joblib
import pandas as pd
from fastapi import FastAPI, HTTPException
from pydantic import BaseModel, Field

from src.common import MODELS_DIR, SYNTHETIC_DIR
from src.optimization import optimize_inventory_decisions

logger = logging.getLogger(__name__)

# Global state
app_state = {
    "model": None,
    "inventory_parameters": None,
    "model_name": "XGBoost",
    "model_version": "1",
    "registered_model": "GroceryDemandForecasting",
    "model_loaded": False,
    "inventory_parameters_loaded": False,
}


@asynccontextmanager
async def lifespan(app: FastAPI):
    # Load model
    model_path = MODELS_DIR / "xgboost_v1.pkl"
    try:
        app_state["model"] = joblib.load(model_path)
        app_state["model_loaded"] = True
        logger.info(f"Loaded model from {model_path}")
    except Exception as e:
        logger.error(f"Failed to load model from {model_path}: {e}")

    # Load inventory parameters
    params_path = SYNTHETIC_DIR / "synthetic_inventory_parameters.csv"
    try:
        app_state["inventory_parameters"] = pd.read_csv(params_path)
        app_state["inventory_parameters_loaded"] = True
        logger.info(f"Loaded inventory parameters from {params_path}")
    except Exception as e:
        logger.error(f"Failed to load inventory parameters from {params_path}: {e}")

    yield
    # Cleanup (if any)


app = FastAPI(
    title="Grocery Demand Forecasting API",
    description="API for Phase 2: FastAPI Deployment",
    version="1.0.0",
    lifespan=lifespan,
)


class PredictRequest(BaseModel):
    Store_ID: str = Field(..., alias="Store ID")
    Product_ID: str = Field(..., alias="Product ID")
    Category: str
    Region: str
    Price: float
    Discount: float
    Weather_Condition: str = Field(..., alias="Weather Condition")
    Promotion: int
    Competitor_Pricing: float = Field(..., alias="Competitor Pricing")
    Seasonality: str
    Epidemic: int
    Date: str
    Demand_lag_1: float
    Demand_lag_7: float
    Demand_roll_7: float


class PredictResponse(BaseModel):
    predicted_demand: float
    model_name: str
    model_version: str


class OptimizeRequest(PredictRequest):
    Warehouse_ID: str
    SKU_ID: str
    Inventory_Level: float
    Reorder_Point: float = 0.0



class OptimizeResponse(BaseModel):
    predicted_demand: float
    recommended_order_quantity: int
    reorder_decision: bool
    expected_inventory: float
    stock_status: str
    potential_stockout: bool
    estimated_inventory_cost: float


def prepare_features(request: PredictRequest) -> pd.DataFrame:
    df = pd.DataFrame([request.model_dump(by_alias=True)])
    # Derive Date features
    df["Date"] = pd.to_datetime(df["Date"], errors="coerce")
    df["Year"] = df["Date"].dt.year
    df["Month"] = df["Date"].dt.month
    df["Day"] = df["Date"].dt.day
    df["DayOfWeek"] = df["Date"].dt.dayofweek
    df["IsMonthStart"] = df["Date"].dt.is_month_start.astype(int)
    df["IsMonthEnd"] = df["Date"].dt.is_month_end.astype(int)
    # Ensure correct column order and drop Date
    columns = [
        "Store ID",
        "Product ID",
        "Category",
        "Region",
        "Price",
        "Discount",
        "Weather Condition",
        "Promotion",
        "Competitor Pricing",
        "Seasonality",
        "Epidemic",
        "Year",
        "Month",
        "Day",
        "DayOfWeek",
        "IsMonthStart",
        "IsMonthEnd",
        "Demand_lag_1",
        "Demand_lag_7",
        "Demand_roll_7",
    ]
    return df[columns]


@app.get("/")
def get_root():
    return {
        "project": "Grocery Demand Forecasting and Inventory Optimization",
        "api_name": app.title,
        "api_version": app.version,
        "model_name": app_state["model_name"],
        "model_version": app_state["model_version"],
    }


@app.get("/health")
def get_health():
    is_healthy = app_state["model_loaded"] and app_state["inventory_parameters_loaded"]
    return {
        "status": "healthy" if is_healthy else "unhealthy",
        "model_loaded": app_state["model_loaded"],
        "inventory_parameters_loaded": app_state["inventory_parameters_loaded"],
        "model_name": app_state["model_name"],
        "model_version": app_state["model_version"],
        "mlflow_registered_model": app_state["registered_model"],
    }


@app.post("/predict", response_model=PredictResponse)
def predict(request: PredictRequest):
    if not app_state["model_loaded"]:
        raise HTTPException(status_code=503, detail="Model is not loaded.")

    try:
        features = prepare_features(request)
        prediction = app_state["model"].predict(features)[0]
    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Prediction failed: {e}")

    return PredictResponse(
        predicted_demand=float(prediction),
        model_name=app_state["model_name"],
        model_version=app_state["model_version"],
    )


@app.post("/optimize", response_model=OptimizeResponse)
def optimize(request: OptimizeRequest):
    if not app_state["model_loaded"]:
        raise HTTPException(status_code=503, detail="Model is not loaded.")
    if not app_state["inventory_parameters_loaded"]:
        raise HTTPException(
            status_code=503, detail="Inventory parameters are not loaded."
        )

    try:
        # 1. Predict demand
        features = prepare_features(request)
        prediction = app_state["model"].predict(features)[0]

        # 2. Prepare decision DataFrame for optimization
        decision_data = request.model_dump(by_alias=True)
        decision_data["Predicted_Demand"] = prediction
        decision_df = pd.DataFrame([decision_data])

        # 3. Optimize inventory
        result_df = optimize_inventory_decisions(
            decision_df, app_state["inventory_parameters"]
        )

        # Ensure the output has the expected columns
        if result_df.empty:
            raise ValueError("Optimization returned empty result.")
        result_row = result_df.iloc[0]

    except Exception as e:
        raise HTTPException(status_code=400, detail=f"Optimization failed: {e}")

    return OptimizeResponse(
        predicted_demand=float(prediction),
        recommended_order_quantity=int(result_row["Recommended_Order_Quantity"]),
        reorder_decision=bool(result_row["Reorder_Decision"]),
        expected_inventory=float(result_row["Expected_Inventory"]),
        stock_status=str(result_row["Stock_Status"]),
        potential_stockout=bool(result_row["Potential_Stockout"]),
        estimated_inventory_cost=float(result_row["Estimated_Inventory_Cost"]),
    )
