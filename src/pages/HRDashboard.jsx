import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Swal from "sweetalert2";

import TopNavbar from "../components/TopNavbar";
import FoodModal from "../components/FoodModal";
import CutOffModal from "../components/CutOffModal";
import Orders from "../components/Orders";


const HRDashboard = () => {
    const [foods, setFoods] = useState([]);
    const [foodName, setFoodName] = useState("");
    const [price, setPrice] = useState("");
    const [showModal, setShowModal] = useState(false);
    const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
    const [updateIndex, setUpdateIndex] = useState(null);

    const [cutOffTime, setCutOffTime] = useState("00:00");
    const [showCutOffModal, setShowCutOffModal] = useState(false);
    const [showOrders, setShowOrders] = useState(false);

    // Sample Data
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

    useEffect(() => {
        const onKey = (e) => {
            if (e.key === "Escape") {
                setShowModal(false);
            }
        };
        if (showModal) window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [showModal]);

    // ✅ Add Food Handler
    const handleAddFood = (e) => {
        e.preventDefault();
        if (!foodName.trim() || price === "") return;
        const p = parseFloat(price);
        if (isNaN(p)) return;

        setFoods((prev) => [...prev, { name: foodName.trim(), price: p.toFixed(2) }]);
        setFoodName("");
        setPrice("");
        setShowModal(false);

        Swal.fire({
            icon: "success",
            title: "Food Added!",
            text: `${foodName} has been added successfully.`,
            timer: 1800,
            showConfirmButton: false,
        });
    };

    // ✅ Update Food Handler
    const handleUpdateFood = (e) => {
        e.preventDefault();
        if (updateIndex === null) return;
        const p = parseFloat(price);
        if (isNaN(p)) return;

        setFoods((prev) =>
            prev.map((item, idx) =>
                idx === updateIndex ? { name: foodName.trim(), price: p.toFixed(2) } : item
            )
        );

        setFoodName("");
        setPrice("");
        setUpdateIndex(null);
        setShowModal(false);

        Swal.fire({
            icon: "success",
            title: "Food Updated!",
            text: `${foodName} has been updated successfully.`,
            timer: 1800,
            showConfirmButton: false,
        });
    };

    // ✅ Delete Food Handler
    const handleDelete = (idx) => {
        Swal.fire({
            title: "Are you sure?",
            text: "This food will be removed permanently.",
            icon: "warning",
            showCancelButton: true,
            cancelButtonColor: "#6c757d",
            confirmButtonColor: "#d33",
            confirmButtonText: "Delete",
        }).then((result) => {
            if (result.isConfirmed) {
                setFoods((prev) => prev.filter((_, i) => i !== idx));
                Swal.fire({
                    icon: "success",
                    title: "Deleted!",
                    text: "The food has been removed.",
                    timer: 1500,
                    showConfirmButton: false,
                });
            }
        });
    };

    // ✅ Open Update Modal
    const handleOpenUpdate = (index) => {
        const item = foods[index];
        setFoodName(item.name);
        setPrice(item.price);
        setUpdateIndex(index);
        setModalMode("edit");
        setShowModal(true);
    };

    // ✅ Open Add Modal
    const handleOpenAdd = () => {
        setFoodName("");
        setPrice("");
        setModalMode("add");
        setShowModal(true);
    };

    return (
        <div className="d-flex" style={{ minHeight: "100vh" }}>
            <div className="flex-grow-1 bg-light">
                <TopNavbar />

                {/* Dashboard Body */}
                <div className="container-fluid p-4">
                    <h4 className="mb-4">Overview</h4>

                    {/* Order List Modal */}
                    <div className="row">
                        <div className="col-md-6 mb-4">
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
                        <div className="col-md-6 mb-4">
                            <div className="card shadow-sm border-0 p-3 text-center">
                                <h6>Cut Off Time</h6>
                                <h3>
                                    {cutOffTime
                                        ? new Date(
                                            `${new Date().toISOString().split("T")[0]}T${cutOffTime}`
                                        ).toLocaleTimeString([], {
                                            hour: "2-digit",
                                            minute: "2-digit",
                                        })
                                        : "--:--"}
                                </h3>
                                <button
                                    className="btn btn-outline-success btn-sm mt-2"
                                    onClick={() => setShowCutOffModal(true)}
                                >
                                    <i className="fas fa-clock me-1"></i> Set Cut Off Time
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Food List + Recent Activity */}
                    <div className="row">
                        {/* Food List */}
                        <div className="col-md-8 mb-4">
                            <div className="card shadow-sm border-0 p-4">
                                <div className="d-flex justify-content-between align-items-center mb-3">
                                    <h6 className="mb-0">List of Available Food</h6>
                                    <button className="btn btn-success btn-sm" onClick={handleOpenAdd}>
                                        <i className="fas fa-plus me-1"></i> Add Food
                                    </button>
                                </div>

                                {foods.length === 0 ? (
                                    <p className="text-muted text-center py-5">
                                        No food added yet.
                                    </p>
                                ) : (
                                    <ul className="list-group">
                                        {foods.map((food, index) => (
                                            <li
                                                key={index}
                                                className="list-group-item d-flex justify-content-between align-items-center"
                                            >
                                                <div>
                                                    <strong>{food.name}</strong>
                                                    <div className="text-muted small">₱{food.price}</div>
                                                </div>
                                                <div>
                                                    <button
                                                        className="btn btn-sm btn-outline-secondary me-2"
                                                        onClick={() => handleOpenUpdate(index)}
                                                    >
                                                        Edit
                                                    </button>
                                                    <button
                                                        className="btn btn-sm btn-danger"
                                                        onClick={() => handleDelete(index)}
                                                    >
                                                        Delete
                                                    </button>
                                                </div>
                                            </li>
                                        ))}
                                    </ul>
                                )}
                            </div>
                        </div>

                        {/* Order Summary */}
                        <div className="col-md-4 mb-4">
                            <div className="card shadow-sm border-0 p-4">
                                <h6>Order Summary</h6>
                                <p>Enter Order Message Here</p>
                                <button className="btn btn-success">Generate Order Message</button>
                            </div>
                        </div>
                    </div>
                </div>
            </div>

            {/* Reusable Add/Edit Modal */}
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
            {/* Cut Off Modal */}
            <CutOffModal
                show={showCutOffModal}
                onClose={() => setShowCutOffModal(false)}
                currentTime={cutOffTime}
                onSave={(time) => {
                    setCutOffTime(time);
                    Swal.fire({
                        icon: "success",
                        title: "Cut-Off Time Set!",
                        text: `New cut-off time: ${time}`,
                        timer: 500,
                        showConfirmButton: false,
                    });
                }}
            />
            {/* Order Modal */}
            <Orders
                show={showOrders}
                onClose={() => setShowOrders(false)}
                orders={sampleOrders}
            />
        </div>
    );
};

export default HRDashboard;
