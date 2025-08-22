import React, { useState } from "react";
import axios from "axios";

const RegionalSalesModel = () => {
  const [predictions, setPredictions] = useState([]);
  const [topN, setTopN] = useState(10);
  const [year, setYear] = useState("");
  const [month, setMonth] = useState("");
  const [territory, setTerritory] = useState("");
  const [category, setCategory] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState("");

  const trainModel = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await axios.post("http://localhost:5000/train_regional_sales");
      setMessage(response.data.message || "Model trained successfully!");
    } catch (err) {
      console.error(err);
      setMessage("Error training model");
    }
    setLoading(false);
  };

  const fetchPredictions = async () => {
    setLoading(true);
    setMessage("");
    try {
      const response = await axios.get("http://localhost:5000/predict_regional_sales", {
        params: {
          months: 6, // default 6 months
          TerritoryName: territory || undefined,
        },
      });
      setPredictions(response.data);
    } catch (err) {
      console.error(err);
      setPredictions([]);
      setMessage("Error fetching predictions");
    }
    setLoading(false);
  };

  // Apply filtering
  const filtered = predictions.filter((p) => {
    return (
      (year ? p.Year === parseInt(year) : true) &&
      (month ? p.Month === parseInt(month) : true) &&
      (territory ? p.TerritoryName === territory : true) &&
      (category ? p.PredictedTopCategory === category : true)
    );
  });

  // Sort by predicted sales (desc) and take top N
  const topResults = [...filtered]
    .sort((a, b) => b.PredictedSales - a.PredictedSales)
    .slice(0, topN);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Regional Sales Predictions</h2>

      <div style={{ marginBottom: "15px" }}>
        <label>
          Top N:
          <input
            type="number"
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            min="1"
            style={{ marginLeft: "5px", width: "60px" }}
          />
        </label>

        <label style={{ marginLeft: "15px" }}>
          Year:
          <input
            type="number"
            value={year}
            onChange={(e) => setYear(e.target.value)}
            placeholder="e.g. 2025"
            style={{ marginLeft: "5px", width: "80px" }}
          />
        </label>

        <label style={{ marginLeft: "15px" }}>
          Month:
          <input
            type="number"
            value={month}
            onChange={(e) => setMonth(e.target.value)}
            placeholder="1-12"
            style={{ marginLeft: "5px", width: "60px" }}
          />
        </label>

        <label style={{ marginLeft: "15px" }}>
          Territory:
          <input
            type="text"
            value={territory}
            onChange={(e) => setTerritory(e.target.value)}
            placeholder="Territory"
            style={{ marginLeft: "5px", width: "150px" }}
          />
        </label>

        <label style={{ marginLeft: "15px" }}>
          Category:
          <input
            type="text"
            value={category}
            onChange={(e) => setCategory(e.target.value)}
            placeholder="Category"
            style={{ marginLeft: "5px", width: "150px" }}
          />
        </label>

        <button onClick={trainModel} style={{ marginLeft: "20px" }}>
          Train Model
        </button>
        <button onClick={fetchPredictions} style={{ marginLeft: "10px" }}>
          Predict
        </button>
      </div>

      {message && <p>{message}</p>}

      {loading ? (
        <p>Loading...</p>
      ) : (
        topResults.length > 0 && (
          <table border="1" style={{ marginTop: "20px", width: "100%" }}>
            <thead>
              <tr>
                <th>Territory</th>
                <th>Year</th>
                <th>Month</th>
                <th>Predicted Sales</th>
                <th>Top Category</th>
              </tr>
            </thead>
            <tbody>
              {topResults.map((row, idx) => (
                <tr key={idx}>
                  <td>{row.TerritoryName}</td>
                  <td>{row.Year}</td>
                  <td>{row.Month}</td>
                  <td>{row.PredictedSales.toFixed(2)}</td>
                  <td>{row.PredictedTopCategory}</td>
                </tr>
              ))}
            </tbody>
          </table>
        )
      )}
    </div>
  );
};

export default RegionalSalesModel;
