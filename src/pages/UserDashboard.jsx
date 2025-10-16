import React, { useEffect, useState } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import axios from "axios";

import TopNavbar from "../components/TopNavbar";
import Orders from "../components/Orders";
import UserOrder from "../components/UserOrder";
import MenuUser from "../components/MenuUser";
import { API_URL } from "../global";

const UserDashboard = () => {
  const storedUser = JSON.parse(localStorage.getItem("user") || "null");
  const userId =
    storedUser?._id ||
    storedUser?.um_id ||
    storedUser?.userId ||
    storedUser?.id ||
    null;

  console.log("UserDashboard mounted, user from localStorage:", storedUser);

  const [cutOffTime, setCutOffTime] = useState("");
  const [draftOrders, setDraftOrders] = useState([]); // live draft from MenuUser
  const [fetchedOrderItems, setFetchedOrderItems] = useState([]); // items[] from DB order
  const [loading, setLoading] = useState(true);
  const [resetTrigger, setResetTrigger] = useState(false);
  const [isCutOffPassed, setIsCutOffPassed] = useState(false);
  const [totalAmount, setTotalAmount] = useState(0);

  useEffect(() => {
    // cut-off checks (kept minimal)
    if (!cutOffTime) return;
    const checkCutOff = () => {
      const now = new Date();
      const cutOffParts = cutOffTime.split(":");
      if (cutOffParts.length < 2) return;
      const cutOff = new Date();
      cutOff.setHours(Number(cutOffParts[0]), Number(cutOffParts[1]), 0, 0);
      setIsCutOffPassed(now >= cutOff);
    };
    checkCutOff();
    const i = setInterval(checkCutOff, 30 * 1000);
    return () => clearInterval(i);
  }, [cutOffTime]);

  const fetchCutOff = async () => {
    try {
      const res = await axios.get(`${API_URL}/cutoff/get`);
      setCutOffTime(res.data?.cutOff?.co_time || "");
    } catch (err) {
      console.error("Failed to fetch cutoff:", err);
    }
  };

  // FETCH the user's order (single order object with items[]). Then setFetchedOrderItems to order.items array.
  const fetchUserOrder = async () => {
    if (!userId) {
      setFetchedOrderItems([]);
      setLoading(false);
      return;
    }

    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/order/get`, { params: { userId } });
      // res.data could be the order object (we expect { order: {...} } or the order itself).
      // normalize: if res.data.order exists use it, else if res.data._id assume res.data is the order
      const order = res.data?.order || (res.data && res.data._id ? res.data : null);
      const items = order?.items || [];
      console.log("Fetched order from server:", order);
      setFetchedOrderItems(items);
    } catch (err) {
      console.warn("No order found or error fetching:", err?.response?.data || err.message);
      setFetchedOrderItems([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchCutOff();
    fetchUserOrder();
  }, [userId, resetTrigger]);

  // keep parent-level total in sync with draftOrders
  useEffect(() => {
    const total = draftOrders.reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0);
    setTotalAmount(total);
  }, [draftOrders]);

  function convertTo12H(timeStr) {
    if (!timeStr) return "--:--";
    const [hourStr, minute] = timeStr.split(":");
    let hour = parseInt(hourStr, 10);
    if (isNaN(hour) || !minute) return "--:--"; // safeguard
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12; // 0 → 12
    return `${hour}:${minute} ${ampm}`;
  }

  return (
    <div className="d-flex" style={{ maxHeight: "100vh", overflowY: "hidden" }}>
      <div className="flex-grow-1 bg-light">
        <TopNavbar />
        <div className="container-fluid p-4">
          <h4 className="mb-4">Food Order Imnida</h4>

          <div className="row" style={{ height: "calc(100vh - 80px)" }}>
            <div className="col-md-8 d-flex flex-column">
              <div className="mb-4">
                <div className="card shadow-sm border-0 p-3 text-center">
                  <h6><i className="fas fa-clock me-2" /> Cut Off Time</h6>
                  <h3>{convertTo12H(cutOffTime) || "--:--"}</h3>
                </div>
              </div>

              <div className="flex-grow-1 overflow-auto">
                {/* only mount MenuUser when menu + fetchedOrderItems are ready (avoid flicker) */}
                {!loading && (
                  <MenuUser
                    userId={userId}
                    existingOrders={fetchedOrderItems} // array of items from DB
                    resetTrigger={resetTrigger}
                    disabled={isCutOffPassed}
                    onOrderDraftChange={(orders, total) => {
                      setDraftOrders(orders);
                      setTotalAmount(total);
                    }}
                  />
                )}
              </div>
            </div>

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
                    localOrders={draftOrders}      // live draft from MenuUser
                    setLocalOrders={setDraftOrders}
                    onOrderCancelled={() => setResetTrigger(prev => !prev)}
                    disabled={isCutOffPassed}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Orders show={false} orders={draftOrders} disabled={isCutOffPassed} />
    </div>
  );
};

export default UserDashboard;
