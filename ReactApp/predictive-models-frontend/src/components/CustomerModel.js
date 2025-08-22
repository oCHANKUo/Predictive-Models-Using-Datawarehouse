import React, { useState } from "react";
import axios from "axios";

const CustomerModel = () => {
  const [trainMessage, setTrainMessage] = useState("");
  const [predictions, setPredictions] = useState([]);
  const [topN, setTopN] = useState(10);
  const [customerKey, setCustomerKey] = useState("");

  const handleTrain = async () => {
    try {
      const response = await axios.get("http://localhost:5003/train_customer");
      setTrainMessage(response.data.message);
    } catch (error) {
      console.error(error);
      setTrainMessage("Error training customer model");
    }
  };

  const handlePredict = async () => {
    try {
      let url = `http://localhost:5003/predict_customer?top_n=${topN}`;
      if (customerKey) url += `&customer_key=${customerKey}`;

      const response = await axios.get(url);
      setPredictions(response.data);
    } catch (error) {
      console.error(error);
      setPredictions([]);
    }
  };

  return (
    <div style={{ padding: "20px" }}>
      <h2>Customer Purchase Behavior Model</h2>
      <button onClick={handleTrain}>Train Customer Model</button>
      <p>{trainMessage}</p>

      <div style={{ marginTop: "10px" }}>
        <label>
          Top N Customers: 
          <input
            type="number"
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            style={{ width: "60px", marginLeft: "5px" }}
          />
        </label>
        <label style={{ marginLeft: "20px" }}>
          CustomerKey (optional):
          <input
            type="number"
            value={customerKey}
            onChange={(e) => setCustomerKey(e.target.value)}
            style={{ width: "80px", marginLeft: "5px" }}
          />
        </label>
      </div>

      <button onClick={handlePredict} style={{ marginTop: "10px" }}>
        Predict Customer Purchase
      </button>

      {predictions.length > 0 && (
        <table border="1" style={{ marginTop: "20px" }}>
          <thead>
            <tr>
              <th>CustomerKey</th>
              <th>Year</th>
              <th>Month</th>
              <th>PurchaseProbability</th>
              <th>Prediction</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((row, idx) => (
              <tr key={idx}>
                <td>{row.CustomerKey}</td>
                <td>{row.Year}</td>
                <td>{row.Month}</td>
                <td>{row.PurchaseProbability.toFixed(2)}</td>
                <td>{row.Prediction}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default CustomerModel;