// HRDashboard.jsx
import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Swal from "sweetalert2";
import axios from "axios";

import { API_URL } from "../global";
import TopNavbar from "../components/TopNavbar";
import FoodModal from "../components/FoodModal";
import CutOffModal from "../components/CutOffModal";
import Orders from "../components/Orders";
import FoodList from "../components/FoodList";
import OrderSummary from "../components/OrderSummary";

const HRDashboard = () => {
    const [foods, setFoods] = useState([]);
    const [foodName, setFoodName] = useState("");
    const [price, setPrice] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState("add");
    const [updateIndex, setUpdateIndex] = useState(null);

    const [cutOffTime, setCutOffTime] = useState("");
    const [showCutOffModal, setShowCutOffModal] = useState(false);
    const [showOrders, setShowOrders] = useState(false);

    const [employeeCount, setEmployeeCount] = useState(0);
    const [orderOpen, setOrderOpen] = useState(false);

    // 🆕 Track whether current time > cutoff
    const [isPastCutoff, setIsPastCutoff] = useState(false);

    // 🧠 Fetch order status
    const fetchOrderStatus = async () => {
        try {
            const res = await axios.get(`${API_URL}/order/status`);
            setOrderOpen(res.data?.isOpen || false);
        } catch (err) {
            console.error("❌ Failed to fetch order status:", err);
        }
    };

    // 🚀 Toggle order status (Start/Stop ordering)
    const toggleOrderStatus = async () => {
        try {
            const newStatus = !orderOpen;
            await axios.post(`${API_URL}/order/status`, { isOpen: newStatus });
            setOrderOpen(newStatus);

            Swal.fire({
                icon: "success",
                title: newStatus ? "Ordering Started!" : "Ordering Stopped!",
                text: newStatus
                    ? "Employees can now place their orders."
                    : "Ordering has been closed for everyone.",
                timer: 1500,
                showConfirmButton: false,
            });
        } catch (err) {
            console.error("❌ Failed to toggle order status:", err);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: err.response?.data?.message || "Server error",
            });
        }
    };

    // 🧩 Fetch employee count
    const fetchEmployeeCount = async () => {
        try {
            const res = await axios.get(`${API_URL}/order/get/all`);
            const employeeCount = Array.isArray(res.data) ? res.data.length : 0;
            setEmployeeCount(employeeCount);
        } catch (error) {
            console.error("❌ Failed to fetch employee count:", error);
        }
    };

    // --- LIVE SYNC: order status, cutoff, and employee orders ---
    useEffect(() => {
        const fetchUserOrders = async () => {
            try {
                const res = await axios.get(`${API_URL}/order/get/all`);
                const count = Array.isArray(res.data) ? res.data.length : 0;
                setEmployeeCount(count);
            } catch (err) {
                console.error("❌ Failed to fetch user orders:", err);
            }
        };

        const checkCutoff = () => {
            if (!cutOffTime) return setIsPastCutoff(false);
            const now = new Date();
            const [hour, minute, second] = cutOffTime.split(":").map(Number);
            const cutoffDate = new Date();
            cutoffDate.setHours(hour, minute, second || 0, 0);
            setIsPastCutoff(now > cutoffDate);
        };

        const fetchAll = async () => {
            await fetchOrderStatus();  // update orderOpen
            await fetchCutOff();       // update cutOffTime
            await fetchUserOrders();   // update employeeCount
            checkCutoff();             // update isPastCutoff
        };

        fetchAll(); // initial call

        const interval = setInterval(fetchAll, 10000); // every 10 seconds
        return () => clearInterval(interval);
    }, [cutOffTime]);


    // --- FETCH DAILY MENU ---
    const fetchDailyMenu = async () => {
        try {
            const res = await axios.get(`${API_URL}/daily-menu/get`);
            if (res.data.menu) {
                setFoods(
                    res.data.menu.map((f) => ({
                        name: f.dm_itemName,
                        price: parseFloat(f.dm_itemPrice).toFixed(2),
                        saved: true,
                    }))
                );
            }
        } catch (err) {
            console.error("❌ Failed to fetch daily menu:", err);
        }
    };

    // --- FETCH CUT-OFF TIME ---
    const fetchCutOff = async () => {
        try {
            const response = await axios.get(`${API_URL}/cutoff/get`);
            if (response.data?.cutOff?.co_time) {
                setCutOffTime(response.data.cutOff.co_time);
            } else {
                // No cutoff set → keep buttons active
                setCutOffTime("");
                setIsPastCutoff(false);
            }
        } catch (err) {
            // If 404 (no cutoff yet) → treat as “no cutoff set”
            if (err.response?.status === 404) {
                console.warn("No cutoff set for today, buttons remain active.");
                setCutOffTime("");
                setIsPastCutoff(false);
            } else {
                console.error("❌ Failed to fetch cut-off:", err);
                setCutOffTime("");
                setIsPastCutoff(false);
            }
        }
    };


    useEffect(() => {
        if (!cutOffTime) {
            setIsPastCutoff(false); // no cutoff → don't lock
            return;
        }

        const checkCutoff = () => {
            const now = new Date();
            const [hour, minute, second] = cutOffTime.split(":").map(Number);
            const cutoffDate = new Date();
            cutoffDate.setHours(hour, minute, second || 0, 0);

            setIsPastCutoff(now > cutoffDate);
        };

        checkCutoff(); // initial check
        const interval = setInterval(checkCutoff, 10000); // check every minute
        return () => clearInterval(interval);
    }, [cutOffTime]);


    // --- ESCAPE KEY CLOSE ---
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && setShowModal(false);
        if (showModal) window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [showModal]);

    // --- FOOD CRUD HANDLERS ---
    const handleAddFood = async (e) => {
        e.preventDefault();
        if (!foodName.trim() || price === "") return;
        const p = parseFloat(price);
        if (isNaN(p)) return;

        try {
            await axios.post(`${API_URL}/daily-menu/set`, {
                items: [{ itemName: foodName.trim(), itemPrice: p }],
            });
            Swal.fire({
                icon: "success",
                title: "Food Added!",
                text: `${foodName} added successfully.`,
                timer: 1800,
                showConfirmButton: false,
            });
            resetModal();
            fetchDailyMenu();
        } catch (err) {
            console.error("❌ Add food error:", err);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: err.response?.data?.message || "Server error",
            });
        }
    };

    const handleUpdateFood = async (e) => {
        e.preventDefault();
        if (updateIndex === null) return;
        const p = parseFloat(price);
        if (isNaN(p)) return;

        const oldFood = foods[updateIndex];
        try {
            const today = new Date().toISOString().split("T")[0];
            await axios.put(`${API_URL}/daily-menu/update`, {
                itemName: oldFood.name,
                date: today,
                newItemName: foodName.trim(),
                newItemPrice: price,
            });
            Swal.fire({
                icon: "success",
                title: "Food Updated!",
                text: `${foodName} updated successfully.`,
                timer: 1800,
                showConfirmButton: false,
            });
            resetModal();
            fetchDailyMenu();
        } catch (err) {
            console.error("❌ Update food error:", err);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: err.response?.data?.message || "Server error",
            });
        }
    };

    const handleDelete = async (idx) => {
        const food = foods[idx];
        Swal.fire({
            title: "Are you sure?",
            text: "This food will be removed permanently.",
            icon: "warning",
            showCancelButton: true,
            cancelButtonColor: "#6c757d",
            confirmButtonColor: "#d33",
            confirmButtonText: "Delete",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    const today = new Date().toISOString().split("T")[0];
                    await axios.delete(`${API_URL}/daily-menu/delete`, {
                        data: { itemName: food.name, date: today },
                    });
                    Swal.fire({
                        icon: "success",
                        title: "Deleted!",
                        text: `${food.name} has been removed.`,
                        timer: 1500,
                        showConfirmButton: false,
                    });
                    fetchDailyMenu();
                } catch (err) {
                    console.error("❌ Delete food error:", err);
                    Swal.fire({
                        icon: "error",
                        title: "Error",
                        text: err.response?.data?.message || "Server error",
                    });
                }
            }
        });
    };

    const handleOpenUpdate = (index) => {
        const item = foods[index];
        setFoodName(item.name);
        setPrice(item.price);
        setUpdateIndex(index);
        setModalMode("edit");
        setShowModal(true);
    };

    const handleOpenAdd = () => {
        resetModal();
        setModalMode("add");
        setShowModal(true);
    };

    const resetModal = () => {
        setFoodName("");
        setPrice("");
        setUpdateIndex(null);
        setShowModal(false);
    };

    const handleSaveCutOff = async (time) => {
        try {
            const today = new Date().toISOString().split("T")[0];
            const formattedTime = time.length === 5 ? `${time}:00` : time;

            const storedUser = localStorage.getItem("user");
            const loggedInUser = storedUser ? JSON.parse(storedUser) : null;
            const updatedBy = loggedInUser
                ? `${loggedInUser.um_firstName} ${loggedInUser.um_lastName}`
                : "Unknown";

            const response = await axios.post(`${API_URL}/cutoff/set`, {
                date: today,
                time: formattedTime,
                updatedBy,
            });

            setCutOffTime(formattedTime);

            Swal.fire({
                icon: "success",
                title: "Cut-Off Time Set!",
                text: response.data.message,
                timer: 1500,
                showConfirmButton: false,
            });

            fetchCutOff();
        } catch (err) {
            console.error("❌ Cut-off error:", err);
            Swal.fire({
                icon: "error",
                title: "Error",
                text: err.response?.data?.message || "Server error",
            });
        }
    };

    function convertTo12H(timeStr) {
        if (!timeStr) return "--:--";
        const [hourStr, minute] = timeStr.split(":");
        let hour = parseInt(hourStr, 10);
        if (isNaN(hour) || !minute) return "--:--";
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12;
        return `${hour}:${minute} ${ampm}`;
    }

    return (
        <div className="d-flex" style={{ minHeight: "100vh" }}>
            <div className="flex-grow-1 bg-light">
                <TopNavbar />
                <div className="container-fluid p-4">
                    <h4 className="mb-4">Overview</h4>

                    {/* Cards Row */}
                    <div className="row mb-4">
                        {/* Orders */}
                        <div className="col-md-4">
                            <div className="card shadow-sm border-0 p-3 text-center">
                                <h6>Orders</h6>
                                <h3>{employeeCount}</h3>
                                <button
                                    className="btn btn-outline-success btn-sm mt-2"
                                    onClick={() => setShowOrders(true)}
                                >
                                    <i className="fas fa-list me-1"></i> View Orders
                                </button>
                            </div>
                        </div>

                        {/* Cutoff */}
                        <div className="col-md-4">
                            <div className="card shadow-sm border-0 p-3 text-center">
                                <h6>Cut Off Time</h6>
                                <h3>{cutOffTime ? convertTo12H(cutOffTime) : "--:--"}</h3>
                                <button
                                    className={`btn btn-sm mt-2 ${orderOpen
                                        ? "btn-warning text-dark"
                                        : "btn-outline-success"
                                        }`}
                                    onClick={() => {
                                        if (orderOpen) {
                                            Swal.fire({
                                                icon: "warning",
                                                title: "Ordering Active",
                                                text: "You cannot change the cut-off time while ordering is open.",
                                                timer: 2000,
                                                showConfirmButton: false,
                                            });
                                        } else {
                                            setShowCutOffModal(true);
                                        }
                                    }}
                                    disabled={orderOpen}
                                    title={
                                        orderOpen ? "Cannot change cutoff while ordering is open" : ""
                                    }
                                >
                                    <i className="fas fa-clock me-1"></i>
                                    {orderOpen ? "Cut-Off Locked" : "Set Cut Off Time"}
                                </button>
                            </div>
                        </div>

                        {/* Ordering Status */}
                        <div className="col-md-4">
                            <div
                                className={`card shadow-sm border-0 p-3 text-center ${orderOpen ? "border-success" : "border-danger"
                                    }`}
                            >
                                <h6>Ordering Status</h6>
                                <h3
                                    className={`${orderOpen ? "text-success" : "text-danger"} fw-bold`}
                                    style={{ fontWeight: 900 }}
                                >
                                    {orderOpen ? "OPEN" : "CLOSED"}
                                </h3>

                                <button
                                    disabled={orderOpen}
                                    className={`btn btn-sm mt-2 ${orderOpen
                                        ? "btn-outline-secondary"
                                        : "btn-outline-success"
                                        }`}
                                    onClick={async () => {
                                        if (!orderOpen) {
                                            const result = await Swal.fire({
                                                icon: "warning",
                                                title: "Start Ordering?",
                                                html: `
              <p>You are about to <b>open ordering</b>.</p>
              <p class="mt-2 mb-1 text-danger">
                This will <b>lock today's cut-off time</b><br />
                and <b>automatically close ordering</b> when the cut-off is reached.
              </p>
              <p class="text-muted small mb-0">
                ⚠️ You won’t be able to change this once started.
              </p>
            `,
                                                showCancelButton: true,
                                                confirmButtonText: "Yes, start ordering",
                                                cancelButtonText: "Cancel",
                                                confirmButtonColor: "#28a745",
                                                cancelButtonColor: "#6c757d",
                                            });

                                            if (!result.isConfirmed) return;
                                            const btn = document.activeElement;
                                            btn.disabled = true;
                                            await toggleOrderStatus();
                                        }
                                    }}
                                >
                                    <i
                                        className={`fas ${orderOpen ? "fa-lock text-secondary" : "fa-play-circle"
                                            } me-1`}
                                    ></i>
                                    {orderOpen
                                        ? `Employees Can Place Orders Until ${convertTo12H(cutOffTime)}`
                                        : "Start Ordering"}
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Food + Summary */}
                    <div className="row">
                        <div className="col-md-8 mb-4">
                            <FoodList
                                foods={foods}
                                setFoods={setFoods}
                                handleOpenAdd={handleOpenAdd}
                                handleOpenUpdate={handleOpenUpdate}
                                handleDelete={handleDelete}
                                orderOpen={orderOpen || isPastCutoff} // 🆕 lock menu if cutoff passed
                            />
                        </div>
                        <div className="col-md-4 mb-4">
                            <OrderSummary />
                        </div>
                    </div>
                </div>
            </div>

            {/* Modals */}
            <FoodModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={modalMode === "add" ? handleAddFood : handleUpdateFood}
                foodName={foodName}
                setFoodName={setFoodName}
                price={price}
                setPrice={setPrice}
                mode={modalMode}
                orderOpen={orderOpen}
                isPastCutoff={isPastCutoff}
            />

            <CutOffModal
                show={showCutOffModal}
                onSave={handleSaveCutOff}
                onClose={async () => {
                    setShowCutOffModal(false);
                    fetchCutOff();
                }}
                currentTime={cutOffTime}
            />

            <Orders show={showOrders} onClose={() => setShowOrders(false)} />
        </div>
    );
};

export default HRDashboard;
