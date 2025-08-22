from flask import Flask, request, jsonify
import pyodbc
import pandas as pd
from sklearn.linear_model import LinearRegression
import pickle
import os

app = Flask(__name__)
MODEL_FILE = "sales_model_lr.pkl"  # changed file name to avoid overwriting RF model

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

# Train Linear Regression model
@app.route('/train', methods=['POST', 'GET'])
def train_model():
    df = fetch_data()
    
    df['Year'] = df['Year'].astype(int)
    df['Month'] = df['Month'].astype(int)
    df['TotalSales'] = df['TotalSales'].astype(float)

    df['MonthIndex'] = (df['Year'] - df['Year'].min()) * 12 + df['Month']

    X = df[['MonthIndex']]
    y = df['TotalSales']

    model = LinearRegression()
    model.fit(X, y)

    with open(MODEL_FILE, "wb") as f:
        pickle.dump(model, f)

    return jsonify({"message": "Linear Regression model trained successfully"})

# Predict future sales
@app.route('/predict', methods=['GET'])
def predict_sales():
    months = int(request.args.get("months", 6))

    with open(MODEL_FILE, "rb") as f:
        model = pickle.load(f)

    df = fetch_data()

    df['Year'] = df['Year'].astype(int)
    df['Month'] = df['Month'].astype(int)

    last_index = ((df['Year'].max() - df['Year'].min()) * 12 + df['Month'].max())

    future = pd.DataFrame({"MonthIndex": [last_index + i for i in range(1, months+1)]})
    preds = model.predict(future)

    # Map MonthIndex to actual Year and Month
    last_year = df['Year'].max()
    last_month = df['Month'].max()
    future_dates = []
    for i in range(1, months + 1):
        month = last_month + i
        year = last_year + (month - 1) // 12
        month = ((month - 1) % 12) + 1
        future_dates.append((year, month))

    results = [
        {"Year": int(y), "Month": int(m), "PredictedSales": round(float(preds[i]), 2)}
        for i, (y, m) in enumerate(future_dates)
    ]
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)