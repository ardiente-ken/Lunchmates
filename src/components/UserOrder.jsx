import React, { useState, useEffect } from "react";
import Swal from "sweetalert2";
import axios from "axios";

const UserOrder = ({ userId, localOrders = [], setLocalOrders }) => {
  const [dbOrders, setDbOrders] = useState([]); // 🗄 fetched from DB
  const [submitted, setSubmitted] = useState(false);

  // 🧠 Only show localOrders if not yet submitted
  const displayOrders = submitted ? dbOrders : [...dbOrders, ...localOrders];

  // 💰 Compute total dynamically
  const totalAmount = displayOrders.reduce(
    (sum, item) => sum + (item.price || 0) * (item.qty || 0),
    0
  );

  // 🔄 Fetch today's orders
  const fetchTodaysOrder = async () => {
    if (!userId) return;
    try {
      const res = await axios.get("http://localhost:5000/api/orders/today", {
        params: { userId },
      });
      setDbOrders(res.data || []);
    } catch (err) {
      console.error("❌ Failed to fetch today's order:", err);
    }
  };

  useEffect(() => {
    fetchTodaysOrder();
  }, [userId]);

  // 📨 Submit only local (unsaved) orders
  const handleSubmitMenu = async () => {
    if (!localOrders || localOrders.length === 0) {
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
      title: "Are you sure?",
      text: "Do you want to submit your order?",
      icon: "question",
      showCancelButton: true,
      cancelButtonColor: "#6c757d",
      confirmButtonColor: "#28a745",
      confirmButtonText: "Yes, submit it!",
    }).then(async (result) => {
      if (result.isConfirmed) {
        try {
          // 🧾 Send only local (draft) orders to backend
          await axios.post("http://localhost:5000/api/orders", {
            userId,
            totalAmount: localOrders.reduce(
              (sum, item) => sum + (item.price || 0) * (item.qty || 0),
              0
            ),
            orderItems: localOrders.map((item) => ({
              name: item.name,
              price: item.price,
              qty: item.qty,
            })),
          });

          Swal.fire({
            icon: "success",
            title: "Order Submitted!",
            text: "Your order has been submitted successfully.",
            timer: 1500,
            showConfirmButton: false,
          });

          // ✅ Update UI: mark as submitted & refresh DB orders
          setSubmitted(true);
          await fetchTodaysOrder();

          // 🧹 Clear local draft orders (if function provided)
          if (typeof setLocalOrders === "function") setLocalOrders([]);
        } catch (error) {
          console.error("❌ Error submitting order:", error);
          Swal.fire({
            icon: "error",
            title: "Error",
            text: "There was an issue submitting your order. Please try again.",
          });
        }
      }
    });
  };

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
                  No orders found for today.
                </td>
              </tr>
            )}
          </tbody>
        </table>
      </div>

      <hr />
      <h6 className="text-end">Total: ₱{totalAmount.toFixed(2)}</h6>
      <button
        className="btn btn-success btn-md mt-2"
        onClick={handleSubmitMenu}
        disabled={submitted}
      >
        <i className="fas fa-check me-1"></i>{" "}
        {submitted ? "Order Submitted" : "Submit Order"}
      </button>
    </div>
  );
};

export default UserOrder;
