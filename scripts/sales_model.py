from flask import Flask, request, jsonify
from flask_cors import CORS
import pyodbc
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import pickle

app = Flask(__name__)
CORS(app)
MODEL_FILE = "sales_model.pkl"

# Connect to SQL Server
def get_connection():
    conn = pyodbc.connect(
        "DRIVER={ODBC Driver 17 for SQL Server};"
        "SERVER=localhost\\MSSQLSERVER03;DATABASE=DataWarehouseClassic;UID=admin;PWD=admin"
    )
    return conn

# Fetch sales data (with Quarter Holiday info from DimDate)
def fetch_data():
    query = """
    SELECT 
        d.Year,
        d.Month,
        ISNULL(d.Quarter, 0) AS Quarter,
        ISNULL(d.IsHolidaySL, 0) AS IsHolidaySL,
        SUM(f.TotalDue) AS TotalSales
    FROM FactSalesOrderDetail f
    JOIN DimDate d ON f.OrderDateKey = d.DateKey
    GROUP BY d.Year, d.Month, d.Quarter, d.IsHolidaySL
    ORDER BY d.Year, d.Month;
    """
    conn = get_connection()
    df = pd.read_sql(query, conn)
    conn.close()
    return df


# Train model
@app.route('/train_sales', methods=['POST', 'GET'])
def train_model():
    df = fetch_data()

    # Data preparation and Ensure correct datatypes
    df['Year'] = df['Year'].astype(int)
    df['Month'] = df['Month'].astype(int)
    df['Quarter'] = df['Quarter'].astype(int)
    df['IsHolidaySL'] = df['IsHolidaySL'].astype(int)
    df['TotalSales'] = df['TotalSales'].astype(float)

    # Create continuous MonthIndex
    df['MonthIndex'] = (df['Year'] - df['Year'].min()) * 12 + df['Month']

    # Features x and target y
    X = df[['MonthIndex', 'Month', 'Quarter', 'IsHolidaySL']]
    y = df['TotalSales']

    # Train Random Forest model
    model = RandomForestRegressor(n_estimators=100, random_state=42)
    model.fit(X, y)

    # Save trained model
    with open(MODEL_FILE, "wb") as f:
        pickle.dump(model, f)

    return jsonify({"message": "Model trained successfully"})

# Predict future sales
@app.route('/predict_sales', methods=['GET', 'POST'])
def predict_sales():
    months = int(request.args.get("months", 6))

    # Load trained model
    with open(MODEL_FILE, "rb") as f:
        model = pickle.load(f)

    # Get historical data
    df = fetch_data()
    df['Year'] = df['Year'].astype(int)
    df['Month'] = df['Month'].astype(int)

    # Find last point in data
    last_index = ((df['Year'].max() - df['Year'].min()) * 12 + df['Month'].max())
    last_year = df['Year'].max()
    last_month = df['Month'].max()

    # Build future dataframe
    future = pd.DataFrame({"MonthIndex": [last_index + i for i in range(1, months+1)]})

    # Calculate future Year & Month
    future_year_month = []
    for i in range(1, months + 1):
        month = last_month + i
        year = last_year + (month - 1) // 12
        month = ((month - 1) % 12) + 1
        future_year_month.append((year, month))

    future['Year'] = [y for (y, m) in future_year_month]
    future['Month'] = [m for (y, m) in future_year_month]
    future['Quarter'] = ((future['Month'] - 1) // 3 + 1)
    future['IsHolidaySL'] = 0  

    # Predict sales
    preds = model.predict(future[['MonthIndex', 'Month', 'Quarter', 'IsHolidaySL']])

    # Format results to a user friendly format
    results = [
        {"Year": int(future.iloc[i]['Year']),
         "Month": int(future.iloc[i]['Month']),
         "Quarter": int(future.iloc[i]['Quarter']),
         "PredictedSales": round(float(preds[i]), 2)}
        for i in range(months)
    ]

    return jsonify(results)

if __name__ == '__main__':
    app.run(debug=True)
