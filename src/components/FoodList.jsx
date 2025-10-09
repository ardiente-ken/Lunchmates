// FoodList.jsx
import React from "react";

const FoodList = ({ foods, handleOpenAdd, handleSubmitMenu, handleOpenUpdate, handleDelete }) => {
    return (
        <div className="card shadow-sm border-0 p-4">
            <div className="d-flex align-items-center mb-3">
                <h5 className="mb-0 me-auto">Menu</h5>
                <button className="btn btn-success btn-sm me-2" onClick={handleOpenAdd}>
                    <i className="fas fa-plus me-1"></i> Add Food
                </button>
                <button className="btn btn-success btn-sm" onClick={handleSubmitMenu}>
                    <i className="fas fa-check me-1"></i> Submit Menu
                </button>
            </div>

            {foods.length === 0 ? (
                <p className="text-muted text-center py-5">No food added yet.</p>
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
    );
};

export default FoodList;
