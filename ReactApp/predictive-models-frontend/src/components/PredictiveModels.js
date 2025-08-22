import React, { useState } from 'react';
import axios from 'axios';

const PredictiveModels = () => {
  const [salesResult, setSalesResult] = useState('');
  const [customerResult, setCustomerResult] = useState('');

  const handleTrainSales = async () => {
    try {
      const response = await axios.post('http://localhost:5000/train_sales');
      setSalesResult(response.data.message || 'Sales model trained!');
    } catch (error) {
      console.error(error);
      setSalesResult('Error training sales model');
    }
  };

  const handlePredictSales = async () => {
    try {
      // Add body or params later for different settings
      const response = await axios.post('http://localhost:5000/predict_sales', {});
      setSalesResult(response.data.prediction || 'Prediction done!');
    } catch (error) {
      console.error(error);
      setSalesResult('Error predicting sales');
    }
  };

  const handleTrainCustomer = async () => {
    try {
      const response = await axios.post('http://localhost:5000/train_customer');
      setCustomerResult(response.data.message || 'Customer model trained!');
    } catch (error) {
      console.error(error);
      setCustomerResult('Error training customer model');
    }
  };

  const handlePredictCustomer = async () => {
    try {
      const response = await axios.post('http://localhost:5000/predict_customer', {});
      setCustomerResult(response.data.prediction || 'Prediction done!');
    } catch (error) {
      console.error(error);
      setCustomerResult('Error predicting customer');
    }
  };

  return (
    <div style={{ padding: '20px' }}>
      <h2>Sales Model</h2>
      <button onClick={handleTrainSales}>Train Sales Model</button>
      <button onClick={handlePredictSales}>Predict Sales</button>
      <p>{salesResult}</p>

      <h2>Customer Model</h2>
      <button onClick={handleTrainCustomer}>Train Customer Model</button>
      <button onClick={handlePredictCustomer}>Predict Customer</button>
      <p>{customerResult}</p>
    </div>
  );
};

export default PredictiveModels;
