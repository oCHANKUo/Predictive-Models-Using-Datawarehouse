import React from "react";
import SalesModel from "./SalesModel";
import CustomerModel from "./CustomerModel";
import ProductDemandModel from "./ProductDemandModel";
import RegionalSalesModel from "./RegionalSalesModel";

const PredictiveModels = () => {
  return (
    <div>
      <SalesModel />
      <hr style={{ margin: "40px 0" }} />
      <CustomerModel />
      <hr style={{ margin: "40px 0" }} />
      <ProductDemandModel />
      <hr style={{ margin: "40px 0" }} />
      <RegionalSalesModel />
    </div>
  );
};

export default PredictiveModels;
