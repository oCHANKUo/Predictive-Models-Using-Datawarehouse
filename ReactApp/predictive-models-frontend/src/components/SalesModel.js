import React, { useState } from "react";
import axios from "axios";

const SalesModel = () => {
  const [monthsToPredict, setMonthsToPredict] = useState(6);
  const [yearFilter, setYearFilter] = useState("");
  const [topN, setTopN] = useState(6);
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  // Fetch predictions from Flask
  const fetchPredictions = async () => {
    setLoading(true);
    try {
      const response = await axios.get("http://127.0.0.1:5000/predict_sales", {
        params: { months: monthsToPredict },
      });

      let data = response.data;

      // Apply year filter if selected
      if (yearFilter) {
        data = data.filter((r) => r.Year === parseInt(yearFilter));
      }

      // Sort by predicted sales and take top N
      data = data.sort((a, b) => b.PredictedSales - a.PredictedSales).slice(0, topN);

      setResults(data);
    } catch (error) {
      console.error("Error fetching predictions:", error);
      setResults([]);
    }
    setLoading(false);
  };

  // Call Flask API to train model
  const trainModel = async () => {
    setLoading(true);
    try {
      const response = await axios.post("http://127.0.0.1:5000/train_sales");
      alert(response.data.message || "Model trained successfully!");
    } catch (error) {
      console.error("Error training model:", error);
      alert("Error training model");
    }
    setLoading(false);
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Sales Predictions</h2>

      <div style={{ marginBottom: "15px" }}>
        <label>
          Months to Predict: 
          <input
            type="number"
            value={monthsToPredict}
            onChange={(e) => setMonthsToPredict(Number(e.target.value))}
            min="1"
            style={{ marginLeft: "5px", marginRight: "20px", width: "60px" }}
          />
        </label>

        <label>
          Year: 
          <input
            type="number"
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
            placeholder="e.g. 2025"
            style={{ marginLeft: "5px", marginRight: "20px", width: "80px" }}
          />
        </label>

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

        <button
          onClick={fetchPredictions}
          disabled={loading}
          style={{ marginLeft: "20px" }}
        >
          {loading ? "Loading..." : "Predict Sales"}
        </button>

        <button
          onClick={trainModel}
          disabled={loading}
          style={{ marginLeft: "10px" }}
        >
          {loading ? "Training..." : "Train Model"}
        </button>
      </div>

      {results.length > 0 ? (
        <table border="1" style={{ marginTop: "20px", width: "100%" }}>
          <thead>
            <tr>
              <th>Year</th>
              <th>Month</th>
              <th>Quarter</th>
              <th>Predicted Sales</th>
            </tr>
          </thead>
          <tbody>
            {results.map((res, idx) => (
              <tr key={idx}>
                <td>{res.Year}</td>
                <td>{res.Month}</td>
                <td>{res.Quarter}</td>
                <td>{res.PredictedSales.toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      ) : (
        !loading && <p>No results yet.</p>
      )}
    </div>
  );
};

export default SalesModel;