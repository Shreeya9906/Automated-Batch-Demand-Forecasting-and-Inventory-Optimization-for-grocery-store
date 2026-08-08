from src.validation import run_inventory_validation, run_sales_validation


def main() -> None:
    print("=" * 70)
    print("GROCERY DEMAND FORECASTING AND INVENTORY OPTIMIZATION")
    print("=" * 70)

    sales_report = run_sales_validation()
    inventory_report = run_inventory_validation()

    print("\nHistorical Sales Dataset")
    print("Shape:", tuple(sales_report["shape"]))
    print("Columns:", sales_report["columns"])
    print("Date range:", sales_report["date_range"]["min"], "->", sales_report["date_range"]["max"])
    print("Missing values:", sales_report["missing_values"])
    print("Duplicate rows:", sales_report["duplicate_rows"])

    print("\nInventory Dataset")
    print("Shape:", tuple(inventory_report["shape"]))
    print("Columns:", inventory_report["columns"])
    print("Date range:", inventory_report["date_range"]["min"], "->", inventory_report["date_range"]["max"])
    print("Missing values:", inventory_report["missing_values"])
    print("Duplicate rows:", inventory_report["duplicate_rows"])


if __name__ == "__main__":
    main()

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