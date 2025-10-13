import React, { useEffect, useState } from "react";
import axios from "axios";

const OrderSummary = () => {
  const [summary, setSummary] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderMessage, setOrderMessage] = useState("");

  // Fetch aggregated employee orders on mount
  useEffect(() => {
    const fetchSummary = async () => {
      try {
        const res = await axios.get(
          "http://localhost:5000/api/orders/summary"
        );
        setSummary(res.data.summary || []);
      } catch (err) {
        console.error("❌ Failed to fetch order summary:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchSummary();
  }, []);

  const generateMessage = () => {
    if (!summary.length) {
      setOrderMessage("No orders available for today.");
      return;
    }

    let message = "Good morning ya mao ni amo order ya:\n\n";
    summary.forEach((item) => {
      message += `- ${item.itemName} - x${item.totalQty}\n`;
    });
    message += "\nThank you!";
    setOrderMessage(message);

    // Copy to clipboard
    navigator.clipboard.writeText(message)
      .then(() => {
        alert("Order message copied to clipboard!");
      })
      .catch((err) => {
        console.error("Failed to copy:", err);
        alert("Failed to copy order message to clipboard.");
      });
  };

  return (
    <div className="card shadow-sm border-0 p-4">
      <h6>Order Summary</h6>

      {loading ? (
        <p className="text-muted">Loading summary...</p>
      ) : summary.length === 0 ? (
        <p className="text-muted">No orders found for today.</p>
      ) : (
        <div className="table-responsive mb-3">
          <table className="table table-sm table-striped align-middle">
            <thead className="table-success">
              <tr>
                <th>#</th>
                <th>Item Name</th>
                <th>Total Qty</th>
                <th>Total Sales</th>
              </tr>
            </thead>
            <tbody>
              {summary.map((item, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{item.itemName}</td>
                  <td>{item.totalQty}</td>
                  <td>₱{item.totalSales.toFixed(2)}</td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      )}

      <button className="btn btn-success mb-3" onClick={generateMessage}>
        Generate Order Message
      </button>
    </div>
  );
};

export default OrderSummary;
