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
