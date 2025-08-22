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
    pivot["TopCategory"] = pivot.drop(columns = ["Territoryname"].idxmax(axis = 1))

    X = pd.get_dummies(pivot["TerritorName"], drop_first=True)
    