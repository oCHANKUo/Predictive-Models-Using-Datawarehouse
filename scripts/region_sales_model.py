from flask import Flask, request, jsonify
import pyodbc
import pandas as pd
from sklearn.ensemble import RandomForestRegressor
import pickle

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
    
    """
    conn = get_connection()
    df = pd.read_sql(query, conn)
    conn.close()
    return df

def prepare_regional_data(df):
    