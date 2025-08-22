import React, { useMemo, useState } from "react";
import axios from "axios";

const ProductDemandModel = () => {
  const [trainMessage, setTrainMessage] = useState("");
  const [rawResults, setRawResults] = useState([]);
  const [months, setMonths] = useState(6);               // default 6 months
  const [sortBy, setSortBy] = useState("qty");           // "qty" | "revenue"
  const [topN, setTopN] = useState(10);                  // default Top 10
  const [yearFilter, setYearFilter] = useState("");      // "" = all years
  const [loading, setLoading] = useState(false);
  const [errMsg, setErrMsg] = useState("");

  const handleTrain = async () => {
    try {
      setErrMsg("");
      const res = await axios.get("http://localhost:5002/train_product_demand");
      setTrainMessage(res.data.message || "Training complete.");
    } catch (e) {
      console.error(e);
      setTrainMessage("Error training product demand model");
      setErrMsg(e?.response?.data?.error || "Training failed.");
    }
  };

  const handlePredict = async () => {
    try {
      setLoading(true);
      setErrMsg("");
      const url = `http://localhost:5002/predict_product_demand?months=${months}`;
      const res = await axios.get(url);
      setRawResults(res.data || []);
    } catch (e) {
      console.error(e);
      setErrMsg(e?.response?.data?.error || "Prediction failed.");
      setRawResults([]);
    } finally {
      setLoading(false);
    }
  };

  // Build list of available years from results
  const availableYears = useMemo(() => {
    const ys = Array.from(new Set(rawResults.map(r => r.Year))).sort((a, b) => a - b);
    return ys;
  }, [rawResults]);

  // Apply year filter, sort, and top N
  const shownRows = useMemo(() => {
    let rows = [...rawResults];
    if (yearFilter !== "") {
      rows = rows.filter(r => String(r.Year) === String(yearFilter));
    }
    rows.sort((a, b) => {
      if (sortBy === "qty") return b.PredictedQty - a.PredictedQty;
      return b.PredictedRevenue - a.PredictedRevenue;
    });
    return rows.slice(0, Math.max(0, Number(topN) || 0));
  }, [rawResults, sortBy, topN, yearFilter]);

  return (
    <div style={{ padding: "20px" }}>
      <h2>Product Demand Model</h2>

      <div style={{ display: "flex", gap: "12px", flexWrap: "wrap", alignItems: "center" }}>
        <button onClick={handleTrain}>Train Product Demand</button>
        <span style={{ minHeight: 24 }}>{trainMessage}</span>
      </div>

      <div style={{ marginTop: 12, display: "flex", gap: 16, flexWrap: "wrap" }}>
        <label>
          Months to predict:&nbsp;
          <input
            type="number"
            min={1}
            value={months}
            onChange={(e) => setMonths(Number(e.target.value))}
            style={{ width: 70 }}
          />
        </label>

        <label>
          Sort by:&nbsp;
          <select value={sortBy} onChange={(e) => setSortBy(e.target.value)}>
            <option value="qty">PredictedQty</option>
            <option value="revenue">PredictedRevenue</option>
          </select>
        </label>

        <label>
          Top N:&nbsp;
          <input
            type="number"
            min={1}
            value={topN}
            onChange={(e) => setTopN(Number(e.target.value))}
            style={{ width: 70 }}
          />
        </label>

        <label>
          Year:&nbsp;
          <select
            value={yearFilter}
            onChange={(e) => setYearFilter(e.target.value)}
          >
            <option value="">All</option>
            {availableYears.map((y) => (
              <option key={y} value={y}>{y}</option>
            ))}
          </select>
        </label>

        <button onClick={handlePredict} disabled={loading}>
          {loading ? "Predicting..." : "Predict"}
        </button>
      </div>

      {errMsg && (
        <div style={{ marginTop: 10, color: "crimson" }}>
          {errMsg}
        </div>
      )}

      {shownRows.length > 0 && (
        <table border="1" style={{ marginTop: 20, width: "100%", borderCollapse: "collapse" }}>
          <thead>
            <tr>
              <th style={{ padding: 8 }}>Year</th>
              <th style={{ padding: 8 }}>Month</th>
              <th style={{ padding: 8 }}>PredictedQty</th>
              <th style={{ padding: 8 }}>PredictedRevenue</th>
            </tr>
          </thead>
          <tbody>
            {shownRows.map((row, idx) => (
              <tr key={`${row.Year}-${row.Month}-${idx}`}>
                <td style={{ padding: 8 }}>{row.Year}</td>
                <td style={{ padding: 8 }}>{row.Month}</td>
                <td style={{ padding: 8 }}>{Number(row.PredictedQty).toFixed(2)}</td>
                <td style={{ padding: 8 }}>{Number(row.PredictedRevenue).toFixed(2)}</td>
              </tr>
            ))}
          </tbody>
        </table>
      )}

      {rawResults.length > 0 && shownRows.length === 0 && (
        <p style={{ marginTop: 16 }}>No rows match the current filters.</p>
      )}
    </div>
  );
};

export default ProductDemandModel;
