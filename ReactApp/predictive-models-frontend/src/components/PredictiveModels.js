import React from "react";
import SalesModel from "./SalesModel";
import CustomerModel from "./CustomerModel";
import ProductDemandModel from "./ProductDemandModel";

const PredictiveModels = () => {
  return (
    <div>
      <SalesModel />
      <hr style={{ margin: "40px 0" }} />
      <CustomerModel />
      <hr style={{ margin: "40px 0" }} />
      <ProductDemandModel />
    </div>
  );
};

export default PredictiveModels;
