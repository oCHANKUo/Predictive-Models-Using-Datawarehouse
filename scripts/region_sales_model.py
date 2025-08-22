from flask import Flask, request, jsonify
import pyodbc
import pandas as pd
from sklearn.model_selection import train_test_split
from sklearn.ensemble import RandomForestClassifier
from sklearn.metrics import classification_report
import pickle
import os

app = Flask(__name__)
MODEL_FILE = "region_sales_model.pkl"

def get_connection():
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost\\MSSQLSERVER03;DATABASE=DataWarehouseClassic;UID=admin;PWD=admin"
    )
    return conn

def fetch_data():
    query = """
    SELECT 
        t.TerritoryName,
        p.Categoryname,
        SUM(f.OrderQty) AS TotalSales
    FROM FactSalesOrderDetail f
    JOIN DimProduct p ON f.ProductKey = p.ProductKey
    JOIN DimTerritory t ON f.TerritoryKey = t.TerritoryKey
    GROUP BY t.TerritoryName, p.Categoryname
    """
    conn = get_connection()
    df = pd.read_sql(query, conn)
    conn.close()
    return df

def preprocess(df):
    # Features = Territory
    # Target = CategoryName (best selling)
    pivot = df.pivot_table(index = "TerritoryName",
                           columns = "CategoryName",
                           values = "TotalSales",
                           aggfunc = "sum",
                           fill_value = 0).reset_index()
    
    # Target = best-selling category per territory
    pivot["TopCategory"] = pivot.drop(columns=["TerritoryName"]).idxmax(axis=1)

    x = pd.get_dummies(pivot["TerritorName"], drop_first=True)
    y = pivot["TopCategory"]

    return x, y, pivot

@app.route("/train_regional_sales", methods = ['POST', 'GET'])
def train_model():
    df = fetch_data()
    x, y, pivot = preprocess(df)

    x_train, x_test, y_train, y_test = train_test_split(x, y, test_size=0.2, random_state=42)

    model = RandomForestClassifier(random_state = 42)
    model.fit(x_train, y_train)

    y_pred = model.predict(x_test)
    report = classification_report(y_test, y_pred, output_dict=True)

    with open(MODEL_FILE, "wb") as f:
        pickle.dump(model, f)

    return jsonify({
        "message": "Regional Sales Model Trained Successfully",
        "classification_report": report
    })

@app.route("/predict_regional_sales", methods = ['POST', 'GET'])
def predict():
    data = request.get_json()
    territory = data.get("TerritoryName")

    if not os.path.exists(MODEL_FILE):
        return jsonify({"error": "Model not trained yet"}), 400
    
    with open(MODEL_FILE, "rb") as f:
        model = pickle.load(f)

        df = fetch_data()
        x, y, pivot = preprocess(df)

        if territory not in pivot["TerritoryName"].values:
            return jsonify({"error": "Territory not found"}), 400
        
        row = pd.DataFrame([territory], columns=["TerritoryName"])
        row = pd.get_dummies(row, drop_first=True)
        row = row.reindex(columns=x.columns, fill_value=0)


        prediction = model.predict(row)

        return jsonify({
            "TerritoryName": territory,
            "PredictedTopCategory": prediction[0]
        })
    
    
if __name__ == "__main__":
    app.run(debug=True)