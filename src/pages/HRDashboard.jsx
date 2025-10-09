import React, { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";
import Swal from "sweetalert2";

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
    const [modalMode, setModalMode] = useState("add"); // "add" | "edit"
    const [updateIndex, setUpdateIndex] = useState(null);

    const [cutOffTime, setCutOffTime] = useState("00:00");
    const [showCutOffModal, setShowCutOffModal] = useState(false);
    const [showOrders, setShowOrders] = useState(false);

    // Sample Orders
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

    // Escape key closes modal
    useEffect(() => {
        const onKey = (e) => e.key === "Escape" && setShowModal(false);
        if (showModal) window.addEventListener("keydown", onKey);
        return () => window.removeEventListener("keydown", onKey);
    }, [showModal]);

    // Add / Update / Delete Handlers
    const handleAddFood = (e) => {
        e.preventDefault();
        if (!foodName.trim() || price === "") return;
        const p = parseFloat(price);
        if (isNaN(p)) return;

        setFoods((prev) => [...prev, { name: foodName.trim(), price: p.toFixed(2) }]);
        resetModal();
        Swal.fire({ icon: "success", title: "Food Added!", text: `${foodName} added successfully.`, timer: 1800, showConfirmButton: false });
    };

    const handleUpdateFood = (e) => {
        e.preventDefault();
        if (updateIndex === null) return;
        const p = parseFloat(price);
        if (isNaN(p)) return;

        setFoods((prev) =>
            prev.map((item, idx) => (idx === updateIndex ? { name: foodName.trim(), price: p.toFixed(2) } : item))
        );
        resetModal();
        Swal.fire({ icon: "success", title: "Food Updated!", text: `${foodName} updated successfully.`, timer: 1800, showConfirmButton: false });
    };

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
                Swal.fire({ icon: "success", title: "Deleted!", text: "The food has been removed.", timer: 1500, showConfirmButton: false });
            }
        });
    };

    const handleSubmitMenu = () => {
        Swal.fire({
            title: "Are you sure?",
            text: "Do you want to submit the menu?",
            icon: "question",
            showCancelButton: true,
            cancelButtonColor: "#6c757d",
            confirmButtonColor: "#28a745",
            confirmButtonText: "Yes, submit it!",
        }).then((result) => {
            if (result.isConfirmed) {
                // Here you can also call any API or logic for submission
                Swal.fire({
                    icon: "success",
                    title: "Menu Submitted!",
                    text: "The menu has been submitted successfully.",
                    timer: 1500,
                    showConfirmButton: false,
                });
            }
        });
    };

    // Open Modals
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

    return (
        <div className="d-flex" style={{ minHeight: "100vh" }}>
            <div className="flex-grow-1 bg-light">
                <TopNavbar />

                <div className="container-fluid p-4">
                    <h4 className="mb-4">Overview</h4>

                    {/* Stats Cards */}
                    <div className="row mb-4">
                        <div className="col-md-6">
                            <div className="card shadow-sm border-0 p-3 text-center">
                                <h6>Orders</h6>
                                <h3>560</h3>
                                <button className="btn btn-outline-success btn-sm mt-2" onClick={() => setShowOrders(true)}>
                                    <i className="fas fa-list me-1"></i> View Orders
                                </button>
                            </div>
                        </div>
                        <div className="col-md-6">
                            <div className="card shadow-sm border-0 p-3 text-center">
                                <h6>Cut Off Time</h6>
                                <h3>
                                    {cutOffTime
                                        ? new Date(`${new Date().toISOString().split("T")[0]}T${cutOffTime}`).toLocaleTimeString([], { hour: "2-digit", minute: "2-digit" })
                                        : "--:--"}
                                </h3>
                                <button className="btn btn-outline-success btn-sm mt-2" onClick={() => setShowCutOffModal(true)}>
                                    <i className="fas fa-clock me-1"></i> Set Cut Off Time
                                </button>
                            </div>
                        </div>
                    </div>

                    {/* Food List + Order Summary */}
                    <div className="row">
                        <div className="col-md-8 mb-4">
                            <FoodList
                                foods={foods}
                                handleOpenAdd={handleOpenAdd}
                                handleSubmitMenu={handleSubmitMenu} // or handleSubmitMenu if different
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
            />

            <CutOffModal
                show={showCutOffModal}
                onClose={() => setShowCutOffModal(false)}
                currentTime={cutOffTime}
                onSave={(time) => {
                    setCutOffTime(time);
                    Swal.fire({ icon: "success", title: "Cut-Off Time Set!", text: `New cut-off time: ${time}`, timer: 1500, showConfirmButton: false });
                }}
            />

            <Orders show={showOrders} onClose={() => setShowOrders(false)} orders={sampleOrders} />
        </div>
    );
};

export default HRDashboard;
