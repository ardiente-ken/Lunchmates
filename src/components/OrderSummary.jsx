import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../global";

const OrderSummary = () => {
  const [orders, setOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [orderMessage, setOrderMessage] = useState("");

  // Function to fetch orders
  const fetchOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/order/get/all`);
      setOrders(res.data || []);
    } catch (err) {
      console.error("❌ Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  // Fetch orders on mount and every 10 seconds
  useEffect(() => {
    fetchOrders();
    const interval = setInterval(fetchOrders, 10000); // 10 seconds

    return () => clearInterval(interval); // cleanup on unmount
  }, []);

  // Aggregate totals per item
  const aggregatedItems = () => {
    const map = new Map();

    orders.forEach(order => {
      order.items.forEach(item => {
        if (map.has(item.name)) {
          const existing = map.get(item.name);
          map.set(item.name, {
            name: item.name,
            totalQty: existing.totalQty + item.qty,
            totalSales: existing.totalSales + item.price * item.qty
          });
        } else {
          map.set(item.name, {
            name: item.name,
            totalQty: item.qty,
            totalSales: item.price * item.qty
          });
        }
      });
    });

    return Array.from(map.values());
  };

  const generateMessage = () => {
    const aggregated = aggregatedItems();
    if (!aggregated.length) {
      setOrderMessage("No orders available for today.");
      alert("No orders available for today.");
      return;
    }

    let message = "Good morning ya! Mao ni amo order ya:\n\n";
    aggregated.forEach(item => {
      message += `- ${item.name} x${item.totalQty} (₱${item.totalSales.toFixed(2)})\n`;
    });
    message += "\nThank you!";

    setOrderMessage(message);

    navigator.clipboard.writeText(message)
      .then(() => alert("Order message copied to clipboard!"))
      .catch(err => {
        console.error("Failed to copy:", err);
        alert("Failed to copy order message to clipboard.");
      });
  };

  const aggregated = aggregatedItems();

  return (
    <div className="card shadow-sm border-0 p-4">
      <h6>Order Summary</h6>

      {loading ? (
        <p className="text-muted">Loading summary...</p>
      ) : aggregated.length === 0 ? (
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
              {aggregated.map((item, idx) => (
                <tr key={idx}>
                  <td>{idx + 1}</td>
                  <td>{item.name}</td>
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
