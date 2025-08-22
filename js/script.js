function predictSales() {
    const feature = document.getElementById("feature").value;

    fetch("http://localhost:5000/predict_sales", {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({ feature})
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("result").innerText = "Prediction: " + data.prediction;
    })
    .catch(error => console.error("Error:", error))
}

function predictProdudctDemand() {
    fetch("http://localhost:5000/predict_product_demand", {
        method: "POST",
        headers: {"Content-Type": "application/json"}
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("product-demand-results").innerText = JSON.stringify(data)
    })
    .catch(error => console.error("Error:", error));
}

function predictCustomerPurchase() {
    fetch("http://localhost:5000//predict_customer", {
        method: "POST",
        headers: {"Content-Type": "application/json"}
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("customer-purchase-results").innerText = JSON.stringify(data)
    })
    .catch(error => console.error("Error:", error));
}