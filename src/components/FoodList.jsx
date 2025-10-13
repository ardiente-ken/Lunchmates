// FoodList.jsx
import React, { useEffect } from "react";
import axios from "axios";

const FoodList = ({ foods, setFoods, handleOpenAdd, handleSubmitMenu, handleOpenUpdate, handleDelete }) => {

    // Always fetch latest menu from DB when component mounts
    useEffect(() => {
        const fetchMenu = async () => {
            try {
                const response = await axios.get("http://localhost:5000/api/dailymenu");
                if (response.data.menu) {
                    const menu = response.data.menu.map(item => ({
                        name: item.dm_itemName,
                        price: parseFloat(item.dm_itemPrice).toFixed(2),
                        saved: true, // mark as saved
                    }));
                    setFoods(menu);
                }
            } catch (err) {
                console.error("❌ Failed to fetch today's menu:", err);
            }
        };
        fetchMenu();
    }, [setFoods]);

    return (
        <div className="card shadow-sm border-0 p-4">
            <div className="d-flex align-items-center mb-3">
                <h5 className="mb-0 me-auto">Menu</h5>
                <button className="btn btn-success btn-sm me-2" onClick={handleOpenAdd}>
                    <i className="fas fa-plus me-1"></i> Add Food
                </button>
            </div>

            {foods.length === 0 ? (
                <p className="text-muted text-center py-5">No food added yet.</p>
            ) : (
                <div
                    className="overflow-auto"
                    style={{ maxHeight: foods.length > 5 ? "300px" : "auto" }}
                >
                    <ul className="list-group">
                        {foods.map((food, index) => (
                            <li
                                key={index}
                                className="list-group-item d-flex justify-content-between align-items-center"
                            >
                                <div>
                                    <strong>{food.name}</strong>
                                    {food.saved && (
                                        <span className="ms-2 text-success" title="Saved in DB">
                                            <i className="fas fa-check"></i>
                                        </span>
                                    )}
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
                </div>
            )}
        </div>
    );
};

export default FoodList;
