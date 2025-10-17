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

  const [cutOffTime, setCutOffTime] = useState("");
  const [draftOrders, setDraftOrders] = useState([]);
  const [fetchedOrderItems, setFetchedOrderItems] = useState([]);
  const [loading, setLoading] = useState(true);
  const [resetTrigger, setResetTrigger] = useState(false);
  const [isCutOffPassed, setIsCutOffPassed] = useState(false);
  const [orderOpen, setOrderOpen] = useState(false);

  // derived disabled flag
  const isOrderingDisabled = !orderOpen || isCutOffPassed;

  const fetchUserOrder = async () => {
    if (!userId) return setFetchedOrderItems([]);
    try {
      setLoading(true);
      const res = await axios.get(`${API_URL}/order/get`, { params: { userId } });
      const order = res.data?.order || (res.data && res.data._id ? res.data : null);
      setFetchedOrderItems(order?.items || []);
    } catch (err) {
      console.warn("Error fetching user order:", err);
      setFetchedOrderItems([]);
    } finally {
      setLoading(false);
    }
  };

  const fetchCutOff = async () => {
    try {
      const res = await axios.get(`${API_URL}/cutoff/get`);
      setCutOffTime(res.data?.cutOff?.co_time || "");
    } catch (err) {
      setCutOffTime("");
    }
  };

  const fetchOrderStatus = async () => {
    try {
      const res = await axios.get(`${API_URL}/order/status`);
      setOrderOpen(res.data?.isOpen || false);
    } catch (err) {
      setOrderOpen(false);
    }
  };

  const checkCutOff = () => {
    if (!cutOffTime) return setIsCutOffPassed(false);
    const [hours, minutes] = cutOffTime.split(":").map(Number);
    if (isNaN(hours) || isNaN(minutes)) return;
    const cutOffDate = new Date();
    cutOffDate.setHours(hours, minutes, 0, 0);
    setIsCutOffPassed(new Date() >= cutOffDate);
  };

  useEffect(() => {
    fetchCutOff();
    fetchOrderStatus();
    fetchUserOrder();
  }, [userId, resetTrigger]);

  useEffect(() => {
    const cutoffInterval = setInterval(() => {
      fetchCutOff();
      checkCutOff();
    }, 10000);
    const statusInterval = setInterval(fetchOrderStatus, 10000);
    return () => {
      clearInterval(cutoffInterval);
      clearInterval(statusInterval);
    };
  }, [cutOffTime]);

  const convertTo12H = (timeStr) => {
    if (!timeStr) return "--:--";
    const [hourStr, minute] = timeStr.split(":");
    let hour = parseInt(hourStr, 10);
    if (isNaN(hour) || !minute) return "--:--";
    const ampm = hour >= 12 ? "PM" : "AM";
    hour = hour % 12 || 12;
    return `${hour}:${minute} ${ampm}`;
  };

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
                  <h3>{convertTo12H(cutOffTime)}</h3>
                </div>
              </div>

              <div className="flex-grow-1 overflow-auto">
                {!loading && (
                  <MenuUser
                    userId={userId}
                    existingOrders={fetchedOrderItems}
                    resetTrigger={resetTrigger}
                    disabled={isOrderingDisabled}
                    onOrderDraftChange={(orders) => setDraftOrders(orders)}
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
                    localOrders={draftOrders}
                    setLocalOrders={setDraftOrders}
                    onOrderCancelled={() => setResetTrigger(prev => !prev)}
                    disabled={isOrderingDisabled}
                    cutoff={cutOffTime}
                  />
                )}
              </div>
            </div>
          </div>
        </div>
      </div>

      <Orders show={false} orders={draftOrders} disabled={isOrderingDisabled} />
    </div>
  );
};

export default UserDashboard;
