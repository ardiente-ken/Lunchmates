// HRDashboard.jsx
import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Swal from "sweetalert2";
import axios from "axios";

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

    const sampleOrders = [
        {
            user: "John Doe",
            email: "john@example.com",
            items: [
                { name: "Burger", price: 120, qty: 2 },
                { name: "Fries", price: 60, qty: 1 },
            ],
            total: 300,
        },
        {
            user: "Jane Smith",
            email: "jane@example.com",
            items: [{ name: "Pasta", price: 150, qty: 1 }],
            total: 150,
        },
    ];

    // --- FETCH DAILY MENU ---
    const fetchDailyMenu = async () => {
        try {
            const res = await axios.get("http://localhost:5000/api/dailymenu");
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
            const response = await axios.get("http://localhost:5000/api/cutoff");
            if (response.data.cutOff && response.data.cutOff.co_time) {
                setCutOffTime(response.data.cutOff.co_time);
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
            await axios.post("http://localhost:5000/api/dailymenu", {
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
            await axios.put("http://localhost:5000/api/dailymenu", {
                oldItemName: oldFood.name,
                newItemName: foodName.trim(),
                newItemPrice: p,
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
                    await axios.delete("http://localhost:5000/api/dailymenu", {
                        data: { itemName: food.name },
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

    const handleSubmitMenu = async () => {
        if (foods.length === 0) {
            Swal.fire({
                icon: "info",
                title: "No Items",
                text: "Please add items to the menu first.",
                timer: 1500,
                showConfirmButton: false,
            });
            return;
        }

        Swal.fire({
            title: "Are you sure?",
            text: "Do you want to submit the menu?",
            icon: "question",
            showCancelButton: true,
            cancelButtonColor: "#6c757d",
            confirmButtonColor: "#28a745",
            confirmButtonText: "Yes, submit it!",
        }).then(async (result) => {
            if (result.isConfirmed) {
                try {
                    await axios.post("http://localhost:5000/api/dailymenu", {
                        items: foods.map((f) => ({
                            itemName: f.name,
                            itemPrice: parseFloat(f.price),
                        })),
                    });
                    Swal.fire({
                        icon: "success",
                        title: "Menu Submitted!",
                        text: "Menu saved successfully.",
                        timer: 1500,
                        showConfirmButton: false,
                    });
                    fetchDailyMenu(); // REFRESH FROM DB
                } catch (err) {
                    console.error("❌ Submit menu error:", err);
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

            const response = await axios.post("http://localhost:5000/api/cutoff", {
                date: today,
                time: formattedTime,
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

    function convertTo12H(isoString) {
        if (!isoString) return "--:--";
        const timePart = isoString.substring(11, 16);
        let [hourStr, minute] = timePart.split(":");
        let hour = parseInt(hourStr, 10);
        const ampm = hour >= 12 ? "PM" : "AM";
        hour = hour % 12;
        if (hour === 0) hour = 12;
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
                                <h3>560</h3>
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
                                handleSubmitMenu={handleSubmitMenu}
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

            <Orders show={showOrders} onClose={() => setShowOrders(false)} orders={sampleOrders} />
        </div>
    );
};

export default HRDashboard;
