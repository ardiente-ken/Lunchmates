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

    // 🧩 Fetch employee count only (no need to load all orders here)
    const fetchEmployeeCount = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/orders/today/employees");
            const { employeeCount = 0 } = res.data || {};
            setEmployeeCount(employeeCount);
        } catch (error) {
            console.error("❌ Failed to fetch employee count:", error);
        }
    };

    // Run once when page loads, then refresh every 60s
    useEffect(() => {
        fetchEmployeeCount();
    }, []);

    // --- FETCH DAILY MENU ---
    const fetchDailyMenu = async () => {
        try {
            const res = await axios.get(`${API_URL}/daily-menu/get`);
            if (res.data.menu) {
                setFoods(
                    res.data.menu.map((f) => ({
                        name: f.dm_itemName,
                        price: parseFloat(f.dm_itemPrice).toFixed(2),
                        saved: true, // mark as saved
                    }))
                );
            }
        } catch (err) {
            console.error("❌ Failed to fetch daily menu:", err);
        }
    };

    useEffect(() => {
        fetchDailyMenu();
    }, []);

    // --- FETCH CUT-OFF TIME ---
    const fetchCutOff = async () => {
        try {
            const response = await axios.get(`${API_URL}/cutoff/get`);
            console.log("📥 Cut-Off API response:", response.data);

            // Ensure cutOff exists and has a valid co_time
            if (response.data && response.data.cutOff && response.data.cutOff.co_time) {
                setCutOffTime(response.data.cutOff.co_time);
                console.log("✅ Cut-off time set:", response.data.cutOff.co_time);
            } else {
                console.warn("⚠️ Cut-off data missing or invalid:", response.data);
            }
        } catch (err) {
            console.error("❌ Failed to fetch cut-off:", err);
        }
    };


    useEffect(() => {
        fetchCutOff();
    }, []);

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
            fetchDailyMenu(); // REFRESH FROM DB
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
            // Today's date in YYYY-MM-DD
            const today = new Date().toISOString().split("T")[0];

            const response = await axios.put(`${API_URL}/daily-menu/update`, {
                itemName: oldFood.name,   // current name in DB
                date: today,              // always today
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
            fetchDailyMenu(); // REFRESH FROM DB
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
                    // Today's date in YYYY-MM-DD
                    const today = new Date().toISOString().split("T")[0];

                    await axios.delete(`${API_URL}/daily-menu/delete`, {
                        data: {
                            itemName: food.name, // item to delete
                            date: today          // always today
                        },
                    });
                    Swal.fire({
                        icon: "success",
                        title: "Deleted!",
                        text: `${food.name} has been removed.`,
                        timer: 1500,
                        showConfirmButton: false,
                    });
                    fetchDailyMenu(); // REFRESH FROM DB
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

            // Parse the stored user from localStorage
            const storedUser = localStorage.getItem("user");
            const loggedInUser = storedUser ? JSON.parse(storedUser) : null;
            const updatedBy = loggedInUser
                ? `${loggedInUser.um_firstName} ${loggedInUser.um_lastName}`
                : "Unknown";

            const response = await axios.post(`${API_URL}/cutoff/set`, {
                date: today,
                time: formattedTime,
                updatedBy, // <-- include the user who updated
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
        if (isNaN(hour) || !minute) return "--:--"; // safeguard
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12 || 12; // 0 → 12
        return `${hour}:${minute} ${ampm}`;
    }

    return (
        <div className="d-flex" style={{ minHeight: "100vh" }}>
            <div className="flex-grow-1 bg-light">
                <TopNavbar />

                <div className="container-fluid p-4">
                    <h4 className="mb-4">Overview</h4>

                    <div className="row mb-4">
                        <div className="col-md-6">
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
                        <div className="col-md-6">
                            <div className="card shadow-sm border-0 p-3 text-center">
                                <h6>Cut Off Time</h6>
                                <h3>{cutOffTime ? convertTo12H(cutOffTime) : "--:--"}</h3>
                                <button
                                    className="btn btn-outline-success btn-sm mt-2"
                                    onClick={() => setShowCutOffModal(true)}
                                >
                                    <i className="fas fa-clock me-1"></i> Set Cut Off Time
                                </button>
                            </div>
                        </div>
                    </div>

                    <div className="row">
                        <div className="col-md-8 mb-4">
                            <FoodList
                                foods={foods}
                                setFoods={setFoods}
                                handleOpenAdd={handleOpenAdd}
                                handleOpenUpdate={handleOpenUpdate}
                                handleDelete={handleDelete}
                            />
                        </div>
                        <div className="col-md-4 mb-4">
                            <OrderSummary />
                        </div>
                    </div>
                </div>
            </div>

            <FoodModal
                show={showModal}
                onClose={() => setShowModal(false)}
                onSubmit={modalMode === "add" ? handleAddFood : handleUpdateFood}
                foodName={foodName}
                setFoodName={setFoodName}
                price={price}
                setPrice={setPrice}
                mode={modalMode}
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
