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

  const [cutOffTime, setCutOffTime] = useState("");
  const [showOrders, setShowOrders] = useState(false);
  const [draftOrders, setDraftOrders] = useState([]); // only what user adds manually
  const [fetchedOrders, setFetchedOrders] = useState([]); // from DB
  const [loading, setLoading] = useState(true);
  const [resetTrigger, setResetTrigger] = useState(false);
  const [isCutOffPassed, setIsCutOffPassed] = useState(false);

  useEffect(() => {
    if (!cutOffTime) return;

    const checkCutOff = () => {
      const now = new Date();
      const cutOff = new Date(cutOffTime);

      // Extract hours and minutes
      const nowMinutes = now.getHours() * 60 + now.getMinutes();
      const cutOffMinutes = cutOff.getUTCHours() * 60 + cutOff.getUTCMinutes(); // use getUTCHours if your cutoff is UTC

      setIsCutOffPassed(nowMinutes >= cutOffMinutes);
    };

    checkCutOff();
    const interval = setInterval(checkCutOff, 30 * 1000); // check every minute
    return () => clearInterval(interval);
  }, [cutOffTime]);



  // 🕓 Fetch today's cut-off time
  const fetchCutOff = async () => {
    try {
      const res = await axios.get("http://localhost:5000/api/cutoff");
      setCutOffTime(res.data?.cutOff?.co_time || "");
    } catch (err) {
      console.error("❌ Failed to fetch cut-off:", err);
    }
  };

  // 📦 Fetch user's existing orders from DB
  const fetchUserOrders = async () => {
    try {
      setLoading(true);
      const res = await axios.get(`http://localhost:5000/api/orders/${userId}`);
      setFetchedOrders(res.data.orders || []);
    } catch (err) {
      console.error("❌ Failed to fetch orders:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCutOff();
    fetchUserOrders();
  }, [userId]);

  // 🧭 Escape key closes modal (optional)
  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && setShowOrders(false);
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  // ⏰ Convert ISO to 12H
  const convertTo12H = (iso) => {
    if (!iso) return "--:--";
    const t = iso.substring(11, 16);
    const [h, m] = t.split(":");
    const hour = parseInt(h, 10);
    const ampm = hour >= 12 ? "PM" : "AM";
    const twelveH = hour % 12 || 12;
    return `${twelveH}:${m} ${ampm}`;
  };

  // 🧮 Combine only for display — without merging duplicates
  const combinedOrders = [
    ...fetchedOrders.filter(
      (db) => !draftOrders.some((local) => local.food_id === db.food_id)
    ),
    ...draftOrders,
  ];

  return (
    <div className="d-flex" style={{ maxHeight: "100vh", overflowY: "hidden" }}>
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
                  <h3>{convertTo12H(cutOffTime)}</h3>
                </div>
              </div>

              {/* Menu */}
              <div className="flex-grow-1 overflow-auto">
                <MenuUser
                  userId={userId}
                  onOrderDraftChange={setDraftOrders}
                  existingOrders={fetchedOrders}
                  resetTrigger={resetTrigger}
                  disabled={isCutOffPassed} // 🔒 pass here
                />
              </div>
            </div>

            {/* Right Column */}
            <div className="col-md-4 d-flex flex-column">
              <div className="flex-grow-1">
                {loading ? (
                  <div className="text-center mt-5">
                    <div className="spinner-border text-secondary"></div>
                    <p className="mt-2">Loading orders...</p>
                  </div>
                ) : (
                  <UserOrder
                    userId={userId}
                    localOrders={combinedOrders}
                    onOrderCancelled={() => setResetTrigger(prev => !prev)}
                    disabled={isCutOffPassed} // 🔒 pass here
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Orders show={showOrders} orders={combinedOrders} disabled={isCutOffPassed} />
    </div>
  );
};

export default UserDashboard;
