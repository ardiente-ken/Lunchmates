import React from "react";

const MenuUser = ({ foods, onAddToOrder, handleDelete, handleSubmitMenu, orders }) => {
    const getQty = (food) => {
        const item = orders.find((o) => o.name === food.name);
        return item ? item.qty : 0;
    };

    const increment = (food) => {
        onAddToOrder({ ...food, qty: 1 });
    };

    const decrement = (food) => {
        const item = orders.find((o) => o.name === food.name);
        if (item && item.qty > 1) {
            onAddToOrder({ ...food, qty: -1 });
        } else if (item && item.qty === 1) {
            onAddToOrder({ ...food, qty: -1 }); // qty 0 will remove
        }
    };

    const removeFromOrder = (food) => {
        handleDelete(food.name);
    };

    // Dynamically apply scroll if foods.length >= 6
    const listStyle = foods.length >= 5
        ? { maxHeight: "50vh", overflowY: "auto" } 
        : {};

    return (
        <div className="card shadow-sm border-0 p-4">
            <div className="d-flex align-items-center mb-3">
                <h4 className="mb-0 me-auto">Menu</h4>
            </div>

            {foods.length === 0 ? (
                <p className="text-muted text-center py-5">No food available.</p>
            ) : (
                <ul className="list-group" style={listStyle}>
                    {foods.map((food, index) => (
                        <li key={index} className="list-group-item d-flex justify-content-between align-items-center">
                            <div>
                                <strong>{food.name}</strong>
                                <div className="text-muted small">₱{food.price}</div>
                            </div>

                            <div className="d-flex align-items-center">
                                <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => decrement(food)}>-</button>
                                <span className="me-2">{getQty(food)}</span>
                                <button className="btn btn-sm btn-outline-success me-3" onClick={() => increment(food)}>+</button>
                                <button className="btn btn-sm btn-danger" onClick={() => removeFromOrder(food)} title="Remove item from order">
                                    <i className="fas fa-trash"></i>
                                </button>
                            </div>
                        </li>
                    ))}
                </ul>
            )}
        </div>
    );
};

export default MenuUser;
