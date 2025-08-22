from flask import Flask, request, jsonify
from flask_cors import CORS
import pyodbc
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import joblib
import os

app = Flask(__name__)
CORS(app) 
MODEL_FILE = "models/product_demand_model.pkl"

if not os.path.exists("models"):
    os.makedirs("models")

def get_connection():
    return pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost\MSSQLSERVER03;DATABASE=DataWarehouseClassic;UID=admin;PWD=admin"
    )

def fetch_data():
    query = """
    SELECT 
        f.ProductKey,
        f.OrderQty,
        f.UnitPrice,
        p.StandardCost,
        p.CategoryName,
        p.SubCategoryName,
        d.Month,
        d.Quarter,
        d.Year,
        d.IsHolidaySL
    FROM FactSalesOrderDetail f
    JOIN DimProduct p ON f.ProductKey = p.ProductKey
    JOIN DimDate d ON f.OrderDateKey = d.DateKey
    """
    conn = get_connection()
    df = pd.read_sql(query, conn)
    conn.close()
    return df

def preprocess(df):
    df = df.fillna(0)
    categorical_cols = ['CategoryName', 'SubCategoryName']
    df = pd.get_dummies(df, columns=categorical_cols, drop_first=True)
    return df

@app.route('/train_product_demand', methods=['GET', 'POST'])
def train_model():
    df = fetch_data()
    df = preprocess(df)
    X = df.drop(columns=['OrderQty'])
    y = df['OrderQty']

    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)
    joblib.dump(model, MODEL_FILE)

    return jsonify({"message": "Product demand model trained successfully"})

@app.route('/predict_product_demand', methods=['GET', 'POST'])
def predict():
    if not os.path.exists(MODEL_FILE):
        return jsonify({"error": "Model not trained. Call /train_product_demand first"}), 400

    df = fetch_data()
    last_month = df['Month'].max()
    last_year = df[df['Month'] == last_month]['Year'].max()

    # Default 6 months if no input
    months_to_predict = int(request.args.get("months", 6))

    product_key = int(request.args.get("ProductKey", 1))
    unit_price = float(request.args.get("UnitPrice", 10))
    standard_cost = float(request.args.get("StandardCost", 5))
    category_name = request.args.get("CategoryName", "No Category")
    subcategory_name = request.args.get("SubCategoryName", "No SubCategory")
    is_holiday = int(request.args.get("IsHolidaySL", 0))

    future_inputs = []
    for i in range(1, months_to_predict + 1):
        month = int(last_month) + i
        year = int(last_year) + (month - 1) // 12
        month = ((month - 1) % 12) + 1
        quarter = ((month - 1) // 3) + 1
        future_inputs.append({
            "ProductKey": int(product_key),
            "UnitPrice": float(unit_price),
            "StandardCost": float(standard_cost),
            "Month": int(month),
            "Quarter": int(quarter),
            "Year": int(year),
            "IsHolidaySL": int(is_holiday),
            "CategoryName": category_name,
            "SubCategoryName": subcategory_name
    })


    df_input = pd.DataFrame(future_inputs)
    df_input = preprocess(df_input)

    model = joblib.load(MODEL_FILE)
    trained_cols = model.feature_names_in_
    for col in trained_cols:
        if col not in df_input.columns:
            df_input[col] = 0
    df_input = df_input[trained_cols]

    preds = model.predict(df_input)
    results = []
    for i, row in enumerate(future_inputs):
        results.append({
            "Year": row["Year"],
            "Month": row["Month"],
            "PredictedQty": round(float(preds[i]), 2),
            "PredictedRevenue": round(float(preds[i] * unit_price), 2)
        })

    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)
