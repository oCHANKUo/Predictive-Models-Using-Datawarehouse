from flask import Flask, request, jsonify
import pyodbc
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import pickle
import os

app = Flask(__name__)
MODEL_FILE = "sales_model.pkl"

# Connect to SQL Server
def get_connection():
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost\MSSQLSERVER03;DATABASE=DataWarehouseClassic;UID=admin;PWD=admin"
    )
    return conn

# Fetch sales data
def fetch_data():
    query = """
    SELECT d.Year, d.Month, SUM(f.TotalDue) AS TotalSales
    FROM FactSalesOrderDetail f
    JOIN DimDate d ON f.OrderDateKey = d.DateKey
    GROUP BY d.Year, d.Month
    ORDER BY d.Year, d.Month;
    """
    conn = get_connection()
    df = pd.read_sql(query, conn)
    conn.close()
    return df

# Train model
@app.route('/train', methods=['POST', 'GET'])
def train_model():
    df = fetch_data()
    
    df['Year'] = df['Year'].astype(int)
    df['Month'] = df['Month'].astype(int)
    
    df['MonthIndex'] = (df['Year'] - df['Year'].min()) * 12 + df['Month']

    X = df[['MonthIndex']]
    y = df['TotalSales']

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)

    with open(MODEL_FILE, "wb") as f:
        pickle.dump(model, f)

    return jsonify({"message": "Model trained successfully!"})

# Predict future sales
@app.route('/predict', methods=['GET'])
def predict_sales():
    months = int(request.args.get("months", 6))

    with open(MODEL_FILE, "rb") as f:
        model = pickle.load(f)

    df = fetch_data()
    last_index = ((df['Year'].max() - df['Year'].min()) * 12 + df['Month'].max())

    future = pd.DataFrame({"MonthIndex": [last_index + i for i in range(1, months+1)]})
    preds = model.predict(future)

    results = [{"MonthIndex": int(future.iloc[i,0]), "PredictedSales": float(preds[i])} for i in range(months)]
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)