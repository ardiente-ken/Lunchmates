import React, { useEffect, useState } from "react";
import axios from "axios";
import "bootstrap/dist/css/bootstrap.min.css";
import "../css/AddFoodModal.css";
import { API_URL } from "../global";

const Orders = ({ show, onClose }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [orders, setOrders] = useState([]);
  const [employeeCount, setEmployeeCount] = useState(0);

  useEffect(() => {
    if (show) {
      setTimeout(() => setIsVisible(true), 10);
      fetchEmployeeOrders();
    } else {
      setIsVisible(false);
    }
  }, [show]);

  // 📡 Fetch all orders
  const fetchEmployeeOrders = async () => {
    try {
      const res = await axios.get(`${API_URL}/order/get/all`);
      const data = Array.isArray(res.data) ? res.data : res.data.orders || [];

      const formatted = data.map((order) => ({
        user: order.oh_userID?.um_firstName + ' ' + order.oh_userID?.um_lastName || "Unknown User",
        total: order.oh_totalAmount || 0,
        items: order.items || [],
      }));

      setOrders(formatted);
      setEmployeeCount(formatted.length);
    } catch (error) {
      console.error("❌ Failed to fetch employee orders:", error);
    }
  };

  // 📋 Copy orders to clipboard
  const handleCopyToClipboard = () => {
    if (!orders || orders.length === 0) return;

    let text = "Orders List\n\n";
    orders.forEach((order, idx) => {
      text += `${idx + 1}. ${order.user} \n`;
      order.items.forEach((item) => {
        text += `   - ${item.name} — ₱${item.price} × ${item.qty}\n`;
      });
      text += `Total: ₱${order.total}\n\n`;
    });

    navigator.clipboard
      .writeText(text)
      .then(() => alert("Orders copied to clipboard!"))
      .catch((err) => console.error("Failed to copy:", err));
  };

  if (!show) return null;

  return (
    <>
      {/* Backdrop */}
      <div
        className={`modal-backdrop-custom ${isVisible ? "show" : ""}`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`modal fade-custom ${isVisible ? "show" : ""}`}
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
      >
        <div className="modal-dialog modal-dialog-centered modal-wide" role="document">
          <div className="modal-content">
            {/* Header */}
            <div className="modal-header d-flex justify-content-between align-items-center">
              <h5 className="modal-title">
                Orders List
                <span className="badge bg-success ms-2">
                  {employeeCount} Employee{employeeCount !== 1 && "s"}
                </span>
              </h5>
              <button
                type="button"
                className="btn-close"
                aria-label="Close"
                onClick={onClose}
              />
            </div>

            {/* Body */}
            <div className="modal-body">
              {orders.length > 0 ? (
                <div className="table-responsive">
                  <table className="table table-striped align-middle">
                    <thead className="table-success">
                      <tr>
                        <th>#</th>
                        <th>User</th>
                        <th>Order Items</th>
                        <th>Total</th>
                      </tr>
                    </thead>
                    <tbody>
                      {orders.map((order, index) => (
                        <tr key={index}>
                          <td>{index + 1}</td>
                          <td>
                            <strong>{order.user}</strong>
                            <div className="text-muted small">{order.email}</div>
                          </td>
                          <td>
                            <ul className="mb-0 small text-start">
                              {order.items.map((item, i) => (
                                <li key={i}>
                                  {item.name} — ₱{item.price} × {item.qty}
                                </li>
                              ))}
                            </ul>
                          </td>
                          <td>₱{order.total}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              ) : (
                <p className="text-center text-muted py-4 mb-0">
                  No orders found for today.
                </p>
              )}
            </div>

            {/* Footer */}
            <div className="modal-footer">
              <button
                type="button"
                className="btn btn-success"
                onClick={handleCopyToClipboard}
              >
                Copy to Clipboard
              </button>
              <button
                type="button"
                className="btn btn-secondary"
                onClick={onClose}
              >
                Close
              </button>
            </div>
          </div>
        </div>
      </div>
    </>
  );
};

export default Orders;
