import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { API_URL } from "../global";

const UserOrder = ({ userId, localOrders = [], setLocalOrders, onOrderCancelled, disabled }) => {
  const [dbOrder, setDbOrder] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // ✅ Choose which orders to display
  const displayOrders =
    localOrders && localOrders.length > 0
      ? localOrders            // 🟢 always prioritize live local changes
      : dbOrder?.items || [];  // fallback to DB order if no local draft


  // ✅ Compute total safely
  const totalAmount =
    dbOrder?.oh_totalAmount ??
    displayOrders.reduce(
      (sum, item) => sum + (item.price || 0) * (item.qty || 0),
      0
    );

  // ✅ Fetch today's order
  const fetchTodaysOrder = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API_URL}/order/get`, {
        params: { userId },
      });

      setDbOrder(res.data || null);
      setSubmitted(
        !!res.data && Array.isArray(res.data.items) && res.data.items.length > 0
      );
    } catch (err) {
      console.error("❌ Failed to fetch today's order:", err);
    }
  };

  useEffect(() => {
    fetchTodaysOrder();
  }, [userId]);

  // ✅ Submit or update order
  const handleSubmitMenu = async () => {
    if (!displayOrders || displayOrders.length === 0) {
      if (submitted) {
        handleCancelOrder(); // auto cancel if no items
      } else {
        Swal.fire({
          icon: "info",
          title: "No Items",
          text: "Please add items to your order first.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
      return;
    }

    Swal.fire({
      title: submitted ? "Update your order?" : "Submit your order?",
      text: submitted
        ? "Do you want to update your existing order?"
        : "Do you want to submit your order?",
      icon: "question",
      showCancelButton: true,
      cancelButtonColor: "#6c757d",
      confirmButtonColor: "#28a745",
      confirmButtonText: submitted ? "Yes, update it!" : "Yes, submit it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          const payload = {
            userId,
            items: displayOrders.map((item) => ({
              name: item.name,
              price: item.price,
              qty: item.qty,
            })),
          };

          console.log("🟢 Sending order payload:", payload);

          // 🧠 Choose endpoint dynamically
          const endpoint = submitted
            ? `${API_URL}/order/update` // update existing order
            : `${API_URL}/order/submit`; // create new order

          const method = submitted ? "put" : "post";

          const res = await axios({
            method,
            url: endpoint,
            data: payload,
            headers: { "Content-Type": "application/json" },
          });

          Swal.fire({
            icon: "success",
            title: submitted ? "Order Updated!" : "Order Submitted!",
            text: submitted
              ? "Your order has been updated successfully."
              : "Your order has been submitted successfully.",
            timer: 1500,
            showConfirmButton: false,
          });

          await fetchTodaysOrder();
          if (typeof setLocalOrders === "function") {
            setLocalOrders(res?.data?.order?.items || []);
          }

        } catch (error) {
          console.error("❌ Error submitting order:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text:
              error.response?.data?.message ||
              "There was an issue submitting your order. Please try again.",
          });
        }
      }
    });
  };


  // ✅ Cancel order
  const handleCancelOrder = async () => {
    Swal.fire({
      title: "Cancel your order?",
      text: "This will permanently remove your order for today.",
      icon: "warning",
      showCancelButton: true,
      confirmButtonColor: "#dc3545",
      cancelButtonColor: "#6c757d",
      confirmButtonText: "Yes, cancel it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          await axios.delete(`${API_URL}/order/cancel`, {
            params: { userId },
          });

          Swal.fire({
            icon: "success",
            title: "Order Cancelled",
            text: "Your order has been cancelled successfully.",
            timer: 1500,
            showConfirmButton: false,
          });

          setDbOrder(null);
          setSubmitted(false);
          if (typeof setLocalOrders === "function") setLocalOrders([]);
          if (typeof onOrderCancelled === "function") onOrderCancelled();

        } catch (error) {
          console.error("❌ Error cancelling order:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "There was an issue cancelling your order. Please try again.",
          });
        }
      }
    });
  };

  // ✅ UI
  return (
    <div
      className="card shadow-sm border-0 p-4 d-flex flex-column h-100"
      style={{ maxHeight: "80vh" }}
    >
      <h6>Order Summary</h6>

      <div className="table-responsive flex-grow-1">
        <table className="table table-sm table-striped align-middle mb-0">
          <thead>
            <tr>
              <th>#</th>
              <th>Item</th>
              <th>Price</th>
              <th>Qty</th>
              <th>Subtotal</th>
            </tr>
          </thead>
          <tbody>
            {displayOrders.length > 0 ? (
              displayOrders.map((item, index) => (
                <tr key={index}>
                  <td>{index + 1}</td>
                  <td>{item.name}</td>
                  <td>₱{item.price}</td>
                  <td>{item.qty}</td>
                  <td>₱{(item.price * item.qty).toFixed(2)}</td>
                </tr>
              ))
            ) : (
              <tr>
                <td colSpan="5" className="text-center text-muted py-3">
                  No orders yet.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <hr />
      <h6 className="text-end">Total: ₱{totalAmount.toFixed(2)}</h6>

      <div className="d-flex gap-2 mt-2">
        <button
          className={`btn flex-grow-1 ${submitted ? "btn-warning" : "btn-success"} btn-md`}
          onClick={handleSubmitMenu}
          disabled={disabled}
        >
          <i className={`fas ${submitted ? "fa-edit" : "fa-check"} me-1`}></i>
          {submitted ? "Update Order" : "Submit Order"}
        </button>

        {submitted && (
          <button
            className="btn btn-danger btn-md"
            onClick={handleCancelOrder}
            disabled={disabled}
          >
            <i className="fas fa-times me-1"></i> Cancel
          </button>
        )}
      </div>
    </div>
  );
};

export default UserOrder;
