from flask import Flask, request, jsonify
import pyodbc
import pandas as pd
from sklearn.ensemble import RandomForestClassifier
from sklearn.model_selection import train_test_split
from sklearn.metrics import classification_report
import pickle
import os

app = Flask(__name__)
CUSTOMER_MODEL_FILE = "customer_purchase_model.pkl"

# Connect to SQL Server
def get_connection():
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost\MSSQLSERVER03;DATABASE=DataWarehouseClassic;UID=admin;PWD=admin"
    )
    return conn

# Fetch customer purchase behavior data
def fetch_customer_data():
    query = """
    SELECT 
        c.CustomerKey,
        d.Year,
        d.Month,
        SUM(f.TotalDue) AS TotalSpent,
        SUM(f.OrderQty) AS TotalQuantity,
        COUNT(f.SalesOrderID) AS PurchaseCount,
        c.Gender,
        c.EmailPromotion,
        c.CountryRegionName
    FROM FactSalesOrderDetail f
    JOIN DimDate d ON f.OrderDateKey = d.DateKey
    JOIN DimCustomer c ON f.CustomerKey = c.CustomerKey
    GROUP BY c.CustomerKey, d.Year, d.Month, c.Gender, c.EmailPromotion, c.CountryRegionName
    ORDER BY c.CustomerKey, d.Year, d.Month;
    """
    conn = get_connection()
    df = pd.read_sql(query, conn)
    conn.close()
    return df

# Prepare dataset with "purchase next month" label
def prepare_customer_data(df):
    df['Year'] = df['Year'].astype(int)
    df['Month'] = df['Month'].astype(int)

    # Sort for lagging
    df = df.sort_values(by=['CustomerKey', 'Year', 'Month'])

    # Create label: did this customer purchase again next month?
    df['NextPurchase'] = df.groupby('CustomerKey')['PurchaseCount'].shift(-1)
    df['NextPurchase'] = df['NextPurchase'].apply(lambda x: 1 if x > 0 else 0)

    # Drop last records where next month is unknown
    df = df.dropna(subset=['NextPurchase'])

    # Encode categorical vars
    df = pd.get_dummies(df, columns=['Gender', 'CountryRegionName', 'EmailPromotion'], drop_first=True)

    X = df.drop(columns=['CustomerKey', 'NextPurchase'])
    y = df['NextPurchase'].astype(int)

    return X, y, df

# Train model
@app.route('/train_customer', methods=['POST', 'GET'])
def train_customer_model():
    df = fetch_customer_data()
    X, y, _ = prepare_customer_data(df)

    model = RandomForestClassifier(n_estimators=100, random_state=42)
    model.fit(X, y)

    with open(CUSTOMER_MODEL_FILE, "wb") as f:
        pickle.dump(model, f)

    return jsonify({"message": "Customer purchase behavior model trained successfully"})

# Predict purchase likelihood for customers in latest month
@app.route('/predict_customer', methods=['GET'])
def predict_customer():
    if not os.path.exists(CUSTOMER_MODEL_FILE):
        return jsonify({"error": "Model not trained. Call /train_customer first"}), 400

    with open(CUSTOMER_MODEL_FILE, "rb") as f:
        model = pickle.load(f)

    df = fetch_customer_data()
    X, y, full_df = prepare_customer_data(df)

    # Predict probabilities
    preds = model.predict_proba(X)[:, 1]

    # Attach predictions
    full_df['PurchaseProbability'] = preds
    full_df['Prediction'] = (preds > 0.5).astype(int)

    # Take only the latest month data per customer
    latest = full_df.groupby("CustomerKey").tail(1)

    results = latest[['CustomerKey', 'Year', 'Month', 'PurchaseProbability', 'Prediction']].to_dict(orient="records")
    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)