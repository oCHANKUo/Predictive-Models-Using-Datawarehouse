function predictSales() {
    const feature = document.getElementById("feature").value;

    fetch("http://localhost:5000//predict_sales", {
        method: "POST",
        headers: { "Content-Type": "application/json"},
        body: JSON.stringify({ feature})
    })
    .then(response => response.json())
    .then(data => {
        document.getElementById("result").innerText = "Prediction: " + data.prediction;
    })

    
}