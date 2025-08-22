import React, { useState } from 'react';
import axios from 'axios';

const SalesModel = () => {
  const [trainMessage, setTrainMessage] = useState('');
  const [predictions, setPredictions] = useState([]);
  const [months, setMonths] = useState(6);

  const handleTrain = async () => {
    try {
      const response = await axios.get('http://localhost:5000/train_sales');
      setTrainMessage(response.data.message);
    } catch (error) {
      console.error(error);
      setTrainMessage('Error training model');
    }
  };

  const handlePredict = async () => {
    try {
      const response = await axios.get(
        `http://localhost:5000/predict_sales?months=${months}`
      );
      setPredictions(response.data);
    } catch (error) {
      console.error(error);
      setPredictions([]);
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Sales Model</h2>
      <button onClick={handleTrain}>Train Sales Model</button>
      <p>{trainMessage}</p>

      <div style={{ marginTop: '20px' }}>
        <label>
          Months to predict:
          <input
            type="number"
            value={months}
            onChange={(e) => setMonths(e.target.value)}
            style={{ marginLeft: '10px', width: '60px' }}
          />
        </label>
        <button onClick={handlePredict} style={{ marginLeft: '10px' }}>
          Predict Sales
        </button>
      </div>

      {predictions.length > 0 && (
        <table border="1" style={{ marginTop: '20px' }}>
          <thead>
            <tr>
              <th>Year</th>
              <th>Month</th>
              <th>Quarter</th>
              <th>Predicted Sales</th>
            </tr>
          </thead>
          <tbody>
            {predictions.map((row, idx) => (
              <tr key={idx}>
                <td>{row.Year}</td>
                <td>{row.Month}</td>
                <td>{row.Quarter}</td>
                <td>{row.PredictedSales}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}
    </div>
  );
};

export default SalesModel;
