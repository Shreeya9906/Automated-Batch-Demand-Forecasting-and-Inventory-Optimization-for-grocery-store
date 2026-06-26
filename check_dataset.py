import pandas as pd
import numpy as np

from sklearn.model_selection import train_test_split
from sklearn.preprocessing import LabelEncoder
from sklearn.metrics import (
    r2_score,
    mean_absolute_error,
    mean_squared_error
)

from sklearn.linear_model import LinearRegression
from sklearn.tree import DecisionTreeRegressor
from sklearn.ensemble import RandomForestRegressor

print("=" * 70)
print("GROCERY DEMAND FORECASTING AND INVENTORY OPTIMIZATION")
print("=" * 70)

# =====================================================
# LOAD DATASET
# =====================================================

df = pd.read_csv("sales_data.csv")

print("\nDataset Loaded Successfully")

print("\nDataset Shape:")
print(df.shape)

print("\nTotal Rows:", df.shape[0])
print("Total Columns:", df.shape[1])

# =====================================================
# COLUMN NAMES
# =====================================================

print("\nColumns:")
for col in df.columns:
    print("-", col)

# =====================================================
# DATA TYPES
# =====================================================

print("\nData Types:")
print(df.dtypes)

# =====================================================
# MISSING VALUES
# =====================================================

print("\nMissing Values:")
print(df.isnull().sum())

# =====================================================
# ENCODE CATEGORICAL COLUMNS
# =====================================================

categorical_columns = [
    "Store ID",
    "Product ID",
    "Category",
    "Region",
    "Weather Condition",
    "Seasonality"
]

label_encoders = {}

for col in categorical_columns:
    encoder = LabelEncoder()
    df[col] = encoder.fit_transform(df[col])
    label_encoders[col] = encoder

print("\nCategorical Features Encoded")

# =====================================================
# DATE CONVERSION
# =====================================================

df["Date"] = pd.to_datetime(df["Date"])

df["Year"] = df["Date"].dt.year
df["Month"] = df["Date"].dt.month
df["Day"] = df["Date"].dt.day

df.drop("Date", axis=1, inplace=True)

print("\nDate Features Extracted")

# =====================================================
# FEATURES & TARGET
# =====================================================

X = df.drop("Demand", axis=1)
y = df["Demand"]

print("\nTarget Variable:")
print("Demand")

print("\nNumber of Features:", len(X.columns))

# =====================================================
# TRAIN TEST SPLIT
# =====================================================

X_train, X_test, y_train, y_test = train_test_split(
    X,
    y,
    test_size=0.20,
    random_state=42
)

print("\nTrain-Test Split Completed")

print("Training Records :", len(X_train))
print("Testing Records  :", len(X_test))

# =====================================================
# MODEL EVALUATION FUNCTION
# =====================================================

results = []

def evaluate_model(model, name):

    model.fit(X_train, y_train)

    predictions = model.predict(X_test)

    r2 = r2_score(y_test, predictions)

    mae = mean_absolute_error(y_test, predictions)

    rmse = np.sqrt(
        mean_squared_error(y_test, predictions)
    )

    print("\n" + "=" * 70)
    print(name)
    print("=" * 70)

    print(f"R2 Score : {r2:.4f}")
    print(f"MAE      : {mae:.4f}")
    print(f"RMSE     : {rmse:.4f}")

    results.append(
        [name, r2, mae, rmse]
    )

    return model, r2

# =====================================================
# LINEAR REGRESSION
# =====================================================

lr_model, lr_score = evaluate_model(
    LinearRegression(),
    "Linear Regression"
)

# =====================================================
# DECISION TREE
# =====================================================

dt_model, dt_score = evaluate_model(
    DecisionTreeRegressor(random_state=42),
    "Decision Tree Regressor"
)

# =====================================================
# RANDOM FOREST
# =====================================================

rf_model, rf_score = evaluate_model(
    RandomForestRegressor(
        n_estimators=100,
        random_state=42,
        n_jobs=-1
    ),
    "Random Forest Regressor"
)

# =====================================================
# BEST MODEL SELECTION
# =====================================================

scores = {
    "Linear Regression": lr_score,
    "Decision Tree Regressor": dt_score,
    "Random Forest Regressor": rf_score
}

best_model_name = max(
    scores,
    key=scores.get
)

if best_model_name == "Linear Regression":
    best_model = lr_model

elif best_model_name == "Decision Tree Regressor":
    best_model = dt_model

else:
    best_model = rf_model

print("\n" + "=" * 70)
print("BEST MODEL")
print("=" * 70)

print("Best Algorithm :", best_model_name)
print("Best R2 Score  :", round(scores[best_model_name], 4))

# =====================================================
# SAMPLE DEMAND PREDICTION
# =====================================================

print("\n" + "=" * 70)
print("SAMPLE DEMAND PREDICTION")
print("=" * 70)

sample = X_test.iloc[[0]]

predicted_demand = best_model.predict(sample)[0]

actual_demand = y_test.iloc[0]

print("Actual Demand    :", actual_demand)
print("Predicted Demand :", round(predicted_demand, 2))

# =====================================================
# INVENTORY OPTIMIZATION
# =====================================================

inventory = sample["Inventory Level"].values[0]

print("\nInventory Level :", inventory)

if predicted_demand > inventory:

    shortage = predicted_demand - inventory

    print("Inventory Status : LOW STOCK")
    print(
        "Recommended Order Quantity :",
        round(shortage)
    )

else:

    excess = inventory - predicted_demand

    print("Inventory Status : SUFFICIENT STOCK")
    print(
        "Excess Inventory :",
        round(excess)
    )

# =====================================================
# FEATURE IMPORTANCE
# =====================================================

if best_model_name == "Random Forest Regressor":

    print("\n" + "=" * 70)
    print("TOP 10 IMPORTANT FEATURES")
    print("=" * 70)

    importance_df = pd.DataFrame({
        "Feature": X.columns,
        "Importance":
        best_model.feature_importances_
    })

    importance_df = importance_df.sort_values(
        by="Importance",
        ascending=False
    )

    print(importance_df.head(10))

# =====================================================
# FINAL MODEL COMPARISON
# =====================================================

print("\n" + "=" * 70)
print("MODEL PERFORMANCE COMPARISON")
print("=" * 70)

comparison_df = pd.DataFrame(
    results,
    columns=[
        "Algorithm",
        "R2 Score",
        "MAE",
        "RMSE"
    ]
)

comparison_df = comparison_df.sort_values(
    by="R2 Score",
    ascending=False
)

print(comparison_df)

# =====================================================
# ACCURACY COMPARISON
# =====================================================

print("\n" + "=" * 70)
print("ACCURACY COMPARISON (%)")
print("=" * 70)

print(
    f"Linear Regression      : {lr_score*100:.2f}%"
)

print(
    f"Decision Tree          : {dt_score*100:.2f}%"
)

print(
    f"Random Forest          : {rf_score*100:.2f}%"
)

best_accuracy = max(
    lr_score*100,
    dt_score*100,
    rf_score*100
)

print("\nBest Algorithm :", best_model_name)
print(f"Best Accuracy  : {best_accuracy:.2f}%")