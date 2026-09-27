/**
 * API Service for communicating with the FastAPI backend
 * Docs reference: docs/api-contract.md
 */

const API_BASE_URL = import.meta.env.VITE_API_URL || 'http://127.0.0.1:8000';

export async function checkBackendHealth() {
  const startTime = performance.now();
  try {
    const response = await fetch(`${API_BASE_URL}/health`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    const latency = Math.round(performance.now() - startTime);
    if (!response.ok) {
      throw new Error(`HTTP ${response.status}`);
    }
    const data = await response.json();
    return { isOnline: true, latency, data };
  } catch (error) {
    const latency = Math.round(performance.now() - startTime);
    return { isOnline: false, latency, error: error.message };
  }
}

export async function getApiInfo() {
  try {
    const response = await fetch(`${API_BASE_URL}/`, {
      method: 'GET',
      headers: { 'Accept': 'application/json' },
    });
    if (!response.ok) throw new Error(`HTTP ${response.status}`);
    return await response.json();
  } catch (error) {
    return null;
  }
}

export async function predictDemand(payload) {
  const startTime = performance.now();
  try {
    const response = await fetch(`${API_BASE_URL}/predict`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const latency = Math.round(performance.now() - startTime);
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        latency,
        error: data.detail ? (Array.isArray(data.detail) ? data.detail.map(d => `${d.loc?.join('.')}: ${d.msg}`).join(', ') : data.detail) : 'Prediction failed',
      };
    }

    return {
      success: true,
      status: response.status,
      latency,
      data,
    };
  } catch (error) {
    const latency = Math.round(performance.now() - startTime);
    return {
      success: false,
      status: 0,
      latency,
      error: `Network error connecting to backend: ${error.message}. Ensure uvicorn is running on port 8000.`,
      isMock: true,
    };
  }
}

export async function optimizeInventory(payload) {
  const startTime = performance.now();
  try {
    const response = await fetch(`${API_BASE_URL}/optimize`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        'Accept': 'application/json',
      },
      body: JSON.stringify(payload),
    });
    const latency = Math.round(performance.now() - startTime);
    const data = await response.json();
    
    if (!response.ok) {
      return {
        success: false,
        status: response.status,
        latency,
        error: data.detail ? (Array.isArray(data.detail) ? data.detail.map(d => `${d.loc?.join('.')}: ${d.msg}`).join(', ') : data.detail) : 'Optimization failed',
      };
    }

    return {
      success: true,
      status: response.status,
      latency,
      data,
    };
  } catch (error) {
    const latency = Math.round(performance.now() - startTime);
    return {
      success: false,
      status: 0,
      latency,
      error: `Network error connecting to backend: ${error.message}. Ensure uvicorn is running on port 8000.`,
      isMock: true,
    };
  }
}

/**
 * Optimize an individual SKU from catalog data using FastAPI /optimize
 */
export async function optimizeSingleSku(item) {
  const payload = {
    "Store ID": item.storeId || "S001",
    "Product ID": item.sku || "P0001",
    "Category": item.category || "Dairy",
    "Region": "North",
    "Price": item.price || 4.0,
    "Discount": 0.0,
    "Weather Condition": "Sunny",
    "Promotion": 0,
    "Competitor Pricing": item.compPrice || 4.5,
    "Seasonality": "Winter",
    "Epidemic": 0,
    "Date": new Date().toISOString().split('T')[0],
    "Demand_lag_1": parseFloat(item.lag1) || 100.0,
    "Demand_lag_7": parseFloat(item.lag7) || 95.0,
    "Demand_roll_7": parseFloat(item.roll7) || 98.0,
    "Warehouse_ID": item.warehouse || "WH_1",
    "SKU_ID": item.sku || "SKU_1",
    "Inventory_Level": parseFloat(item.inStock) || 50.0,
    "Reorder_Point": parseFloat(item.rop) || 80.0,
  };
  return await optimizeInventory(payload);
}

/**
 * Multi-step autoregressive demand forecasting across horizon (7D / 14D / 30D)
 * Calls /predict for each step using recursive lag updating
 */
export async function generateLiveForecast(item, horizonDays = 7) {
  const points = [];
  const baseDate = new Date();
  let lag1 = item.lag1 || 100;
  let lag7 = item.lag7 || 95;
  let roll7 = item.roll7 || 98;

  for (let i = 0; i < horizonDays; i++) {
    const curDate = new Date(baseDate);
    curDate.setDate(curDate.getDate() + i);
    const dateStr = curDate.toISOString().split('T')[0];

    const payload = {
      "Store ID": item.storeId || "S001",
      "Product ID": item.sku || "P0001",
      "Category": item.category || "Dairy",
      "Region": "North",
      "Price": item.price || 4.0,
      "Discount": 0.0,
      "Weather Condition": "Sunny",
      "Promotion": 0,
      "Competitor Pricing": item.compPrice || 4.5,
      "Seasonality": "Winter",
      "Epidemic": 0,
      "Date": dateStr,
      "Demand_lag_1": lag1,
      "Demand_lag_7": lag7,
      "Demand_roll_7": roll7,
    };

    const res = await predictDemand(payload);
    if (res.success && res.data?.predicted_demand !== undefined) {
      const pred = Math.round(res.data.predicted_demand);
      points.push({
        date: dateStr,
        predicted: pred,
        lower: Math.round(pred * 0.9),
        upper: Math.round(pred * 1.1),
        isLive: true,
      });
      lag7 = lag1;
      lag1 = pred;
      roll7 = Math.round((roll7 * 6 + pred) / 7);
    } else {
      break;
    }
  }

  return points;
}
