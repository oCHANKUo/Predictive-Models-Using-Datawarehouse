import React, { useState } from "react";

const SalesModel = () => {
  const [topN, setTopN] = useState(10);
  const [customerKey, setCustomerKey] = useState("");
  const [results, setResults] = useState([]);
  const [loading, setLoading] = useState(false);

  const fetchPredictions = async () => {
    setLoading(true);
    try {
      let url = `http://127.0.0.1:5000/predict_sales?top_n=${topN}`;
      if (customerKey) {
        url += `&customerKey=${customerKey}`;
      }

      const response = await fetch(url);
      const data = await response.json();
      setResults(data);
    } catch (error) {
      console.error("Error fetching predictions:", error);
    } finally {
      setLoading(false);
    }
  };

  const trainModel = async () => {
    setLoading(true);
    try {
      const response = await fetch("http://127.0.0.1:5000/train_sales", {
        method: "POST",
      });
      const data = await response.json();
      alert(data.message || "Model trained successfully!");
    } catch (error) {
      console.error("Error training model:", error);
      alert("Error training model");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div>
      <h2>Customer Model</h2>

      <div style={{ marginBottom: "10px" }}>
        <label>Top N Customers: </label>
        <input
          type="number"
          value={topN}
          onChange={(e) => setTopN(e.target.value)}
          style={{ marginLeft: "10px", marginRight: "20px" }}
        />

        <label>Customer Key: </label>
        <input
          type="text"
          value={customerKey}
          onChange={(e) => setCustomerKey(e.target.value)}
          style={{ marginLeft: "10px" }}
        />
      </div>

      <button onClick={fetchPredictions} disabled={loading}>
        {loading ? "Loading..." : "Get Predictions"}
      </button>
      <button
        onClick={trainModel}
        disabled={loading}
        style={{ marginLeft: "10px" }}
      >
        {loading ? "Training..." : "Train Model"}
      </button>

      <div style={{ marginTop: "20px" }}>
        <h3>Results:</h3>
        {results.length === 0 ? (
          <p>No results yet</p>
        ) : (
          <ul>
            {results.map((res, index) => (
              <li key={index} style={{ marginBottom: "10px" }}>
                <input
                  type="text"
                  readOnly
                  value={`CustomerKey: ${res.CustomerKey}, Predicted Sales: ${res.PredictedSales.toFixed(
                    2
                  )}`}
                  style={{
                    width: "100%",
                    padding: "5px",
                    marginBottom: "5px", // spacing between textboxes
                  }}
                />
              </li>
            ))}
          </ul>
        )}
      </div>
    </div>
  );
};

export default SalesModel;
