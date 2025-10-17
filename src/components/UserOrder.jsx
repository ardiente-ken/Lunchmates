import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import axios from "axios";
import { API_URL } from "../global";

const UserOrder = ({
  userId,
  localOrders = [],
  setLocalOrders,
  onOrderCancelled,
  disabled,
  cutoff,
}) => {
  const [dbOrder, setDbOrder] = useState(null);
  const [submitted, setSubmitted] = useState(false);

  // Check if cutoff is passed
  const isPastCutoff = (() => {
    if (!cutoff) return false;
    const [hours, minutes] = cutoff.split(":").map(Number);
    const cutOffDate = new Date();
    cutOffDate.setHours(hours, minutes, 0, 0);
    return new Date() >= cutOffDate;
  })();

  // Orders to display
  const displayOrders =
    localOrders && localOrders.length > 0
      ? localOrders
      : dbOrder?.items || [];

  // Compute total
  const totalAmount =
    dbOrder?.oh_totalAmount ??
    displayOrders.reduce((sum, item) => sum + (item.price || 0) * (item.qty || 0), 0);

  // Fetch today's order
  const fetchTodaysOrder = async () => {
    if (!userId) return;
    try {
      const res = await axios.get(`${API_URL}/order/get`, { params: { userId } });
      const orderData = res.data;
      setDbOrder(orderData || null);
      const isSubmitted =
        !!orderData && Array.isArray(orderData.items) && orderData.items.length > 0;
      setSubmitted(isSubmitted);
    } catch (err) {
      console.error("Failed to fetch today's order:", err);
    }
  };

  useEffect(() => {
    fetchTodaysOrder();
  }, [userId]);

  // Submit or update order
  const handleSubmitMenu = async () => {
    if (!displayOrders || displayOrders.length === 0) {
      if (submitted) handleCancelOrder();
      else
        Swal.fire({
          icon: "info",
          title: "No Items",
          text: "Please add items to your order first.",
          timer: 1500,
          showConfirmButton: false,
        });
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
      if (!result.isConfirmed) return;
      try {
        const payload = {
          userId,
          items: displayOrders.map((item) => ({
            name: item.name,
            price: item.price,
            qty: item.qty,
          })),
        };

        const endpoint = submitted
          ? `${API_URL}/order/update`
          : `${API_URL}/order/submit`;
        const method = submitted ? "put" : "post";

        const res = await axios({ method, url: endpoint, data: payload });

        Swal.fire({
          icon: "success",
          title: submitted ? "Order Updated!" : "Order Submitted!",
          timer: 1500,
          showConfirmButton: false,
        });

        await fetchTodaysOrder();
        if (setLocalOrders) setLocalOrders(res?.data?.order?.items || []);
      } catch (error) {
        console.error("Error submitting order:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text:
            error.response?.data?.message ||
            "There was an issue submitting your order. Please try again.",
        });
      }
    });
  };

  // Cancel order
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
      if (!result.isConfirmed) return;
      try {
        await axios.delete(`${API_URL}/order/cancel`, { params: { userId } });
        Swal.fire({
          icon: "success",
          title: "Order Cancelled",
          timer: 1500,
          showConfirmButton: false,
        });

        setDbOrder(null);
        setSubmitted(false);
        if (setLocalOrders) setLocalOrders([]);
        if (onOrderCancelled) onOrderCancelled();
      } catch (error) {
        console.error("Error cancelling order:", error);
        Swal.fire({
          icon: "error",
          title: "Error",
          text: "There was an issue cancelling your order. Please try again.",
        });
      }
    });
  };

  const showOrderSubmitted = submitted && isPastCutoff;

  return (
    <div className="card shadow-sm border-0 p-4 d-flex flex-column h-100" style={{ maxHeight: "80vh" }}>
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

      <div className="d-flex flex-column gap-2 mt-2">
        <div className="d-flex gap-2 mt-2">
          {showOrderSubmitted ? (
            <button className="btn btn-secondary flex-grow-1 btn-md" disabled>
              <i className="fas fa-check me-1"></i> Order Submitted
            </button>
          ) : (
            <button
              className={`btn flex-grow-1 ${submitted ? "btn-warning" : "btn-success"} btn-md`}
              onClick={handleSubmitMenu}
              disabled={disabled}
            >
              <i className={`fas ${submitted ? "fa-edit" : "fa-check"} me-1`}></i>
              {submitted ? "Update Order" : "Submit Order"}
            </button>
          )}

          {submitted && !showOrderSubmitted && (
            <button
              className="btn btn-danger btn-md"
              onClick={handleCancelOrder}
              disabled={disabled}
            >
              <i className="fas fa-times me-1"></i> Cancel
            </button>
          )}
        </div>

        {!showOrderSubmitted && submitted && cutoff && (
          <small className="text-muted mt-1">
            ✅ Order submitted! You have until <b>{cutoff}</b> to edit your order.
          </small>
        )}
      </div>
    </div>
  );
};

export default UserOrder;
