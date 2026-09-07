FROM python:3.12-slim

WORKDIR /app

# Copy the requirements file
COPY requirements.txt .

# Install dependencies
RUN pip install --no-cache-dir -r requirements.txt

# Copy the application source code
COPY src/ src/

# Copy the required model artifact
COPY models/xgboost_v1.pkl models/

# Copy the required synthetic inventory parameters
COPY data/synthetic/synthetic_inventory_parameters.csv data/synthetic/

# Expose port 8000
EXPOSE 8000

# Start FastAPI using Uvicorn
CMD ["uvicorn", "src.api:app", "--host", "0.0.0.0", "--port", "8000"]
