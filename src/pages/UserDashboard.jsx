import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Swal from "sweetalert2";
import axios from "axios";

import TopNavbar from "../components/TopNavbar";
import Orders from "../components/Orders";
import UserOrder from "../components/UserOrder";
import MenuUser from "../components/MenuUser";

const UserDashboard = () => {
  const storedUser = JSON.parse(localStorage.getItem("user"));
  const userId = storedUser?.userId || storedUser?.id || storedUser?.um_id;

  const [draftOrders, setDraftOrders] = useState([]); // 🆕 local (unsaved) orders
  const [cutOffTime, setCutOffTime] = useState("");
  const [showOrders, setShowOrders] = useState(false);

  // 🕓 Fetch today's cut-off time
  const fetchCutOff = async () => {
    try {
      const response = await axios.get("http://localhost:5000/api/cutoff");
      if (response.data.cutOff && response.data.cutOff.co_time) {
        setCutOffTime(response.data.cutOff.co_time);
      }
    } catch (err) {
      console.error("❌ Failed to fetch cut-off:", err);
      setCutOffTime("");
    }
  };

  useEffect(() => {
    fetchCutOff();
  }, []);

  // 🧭 Escape key closes modal (if needed)
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setShowOrders(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // 🕰 Convert ISO time to readable 12H
  function convertTo12H(isoString) {
    if (!isoString) return "--:--";
    const timePart = isoString.substring(11, 16);
    const [hourStr, minute] = timePart.split(":");
    let hour = parseInt(hourStr, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  }

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
                  <h6>
                    <i className="fas fa-clock me-2"></i> Cut Off Time
                  </h6>
                  <h3>{cutOffTime ? convertTo12H(cutOffTime) : "--:--"}</h3>
                </div>
              </div>

              {/* Menu */}
              <div className="flex-grow-1 overflow-auto">
                <MenuUser onOrderDraftChange={setDraftOrders} />
              </div>
            </div>

            {/* Right Column */}
            <div className="col-md-4 d-flex flex-column">
              <div className="flex-grow-1">
                <UserOrder userId={userId} localOrders={draftOrders} />
              </div>
            </div>
          </div>
        </div>
      </div>

      <Orders show={showOrders} orders={draftOrders} />
    </div>
  );
};

export default UserDashboard;
