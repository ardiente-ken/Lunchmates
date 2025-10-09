import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Swal from "sweetalert2";

import TopNavbar from "../components/TopNavbar";
import Orders from "../components/Orders";
import UserOrder from "../components/UserOrder";
import MenuUser from "../components/MenuUser";

const UserDashboard = () => {
  const [foods, setFoods] = useState([
    { name: "Burger", price: 120 },
    { name: "Fries", price: 60 },
    { name: "Pizza", price: 250 },
    { name: "Pasta", price: 150 },
    { name: "Salad", price: 80 },
    { name: "Salad", price: 80 },
    { name: "Salad", price: 80 },
    { name: "Salad", price: 80 },
  ]);

  const [cutOffTime, setCutOffTime] = useState("00:00");
  const [showOrders, setShowOrders] = useState(false);
  const [orders, setOrders] = useState([]);

  // Escape key closes modal (if needed)
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setShowOrders(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // Delete item from orders
  const handleDelete = (foodName) => {
    const food = orders.find((o) => o.name === foodName);
    if (!food) return;

    Swal.fire({
      title: "Are you sure?",
      text: `This will remove ${food.name} from your order.`,
      icon: "warning",
      showCancelButton: true,
      cancelButtonColor: "#6c757d",
      confirmButtonColor: "#d33",
      confirmButtonText: "Remove",
    }).then((result) => {
      if (result.isConfirmed) {
        setOrders((prev) => prev.filter((o) => o.name !== foodName));
        Swal.fire({
          icon: "success",
          title: "Removed!",
          text: `${food.name} has been removed from your order.`,
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  // Add / remove quantity in orders
  const addToOrder = (food) => {
    const existing = orders.find((item) => item.name === food.name);
    if (existing) {
      const newQty = existing.qty + (food.qty || 1);
      if (newQty > 0) {
        setOrders((prev) =>
          prev.map((o) =>
            o.name === food.name ? { ...o, qty: newQty } : o
          )
        );
      } else {
        setOrders((prev) => prev.filter((o) => o.name !== food.name));
      }
    } else if ((food.qty || 1) > 0) {
      setOrders((prev) => [...prev, { ...food, qty: food.qty || 1 }]);
    }
  };

  // Submit order
  const handleSubmitMenu = () => {
    if (orders.length === 0) {
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
    }).then((result) => {
      if (result.isConfirmed) {
        Swal.fire({
          icon: "success",
          title: "Order Submitted!",
          text: "Your order has been submitted successfully.",
          timer: 1500,
          showConfirmButton: false,
        });
      }
    });
  };

  return (
    <div className="d-flex" style={{ maxHeight: "100vh", overflowY: "hidden" }}>
      {/* Left Column */}
      <div className="flex-grow-1 bg-light">
        <TopNavbar />
        <div className="container-fluid p-4">
          <h4 className="mb-4">Food Order Imnida</h4>

          <div className="row" style={{ height: "calc(100vh - 80px)" }}>
            <div className="col-md-8 d-flex flex-column">
              {/* Cut Off Time */}
              <div className="mb-4">
                <div className="card shadow-sm border-0 p-3 text-center">
                  <h6><i className="fas fa-clock me-2"></i> Cut Off Time</h6>
                  <h3>
                    {cutOffTime
                      ? new Date(`${new Date().toISOString().split("T")[0]}T${cutOffTime}`)
                        .toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                      : "--:--"}
                  </h3>
                </div>
              </div>

              {/* Menu */}
              <div className="flex-grow-1 overflow-auto">
                <MenuUser
                  foods={foods}
                  orders={orders}
                  onAddToOrder={addToOrder}
                  handleDelete={handleDelete}
                  handleSubmitMenu={handleSubmitMenu}
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="col-md-4 d-flex flex-column">
              <div className="flex-grow-1">
                <UserOrder orders={orders} clearOrders={() => setOrders([])} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Orders show={showOrders} onClose={() => setShowOrders(false)} orders={orders} />
    </div>
  );
};

export default UserDashboard;
