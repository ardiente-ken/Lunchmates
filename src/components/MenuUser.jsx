import React, { useEffect, useState } from "react";
import axios from "axios";

const MenuUser = ({ userId, onOrderDraftChange, resetTrigger, disabled }) => {
  const [foods, setFoods] = useState([]);
  const [draftOrders, setDraftOrders] = useState([]);
  const [loading, setLoading] = useState(true);

  // 🧾 Fetch menu + user's existing order quantities
  useEffect(() => {
    const fetchData = async () => {
      try {
        setLoading(true);

        const [menuRes, orderRes] = await Promise.all([
          axios.get("http://localhost:5000/api/dailymenu"),
          axios.get(`http://localhost:5000/api/orders/today?userId=${userId}`)
        ]);

        const menu = menuRes.data.menu.map((item) => ({
          name: item.dm_itemName,
          price: item.dm_itemPrice,
        }));

        const userOrders = orderRes.data || [];

        // merge menu + user's quantities
        const merged = menu.map((item) => {
          const match = userOrders.find((o) => o.name === item.name);
          return { ...item, qty: match ? match.qty : 0 };
        });

        setFoods(merged);
        setDraftOrders(userOrders.length ? userOrders : []);
      } catch (err) {
        console.error("❌ Error fetching menu/user orders:", err);
      } finally {
        setLoading(false);
      }
    };

    if (userId) fetchData();
  }, [userId, resetTrigger]); // 👈 Added resetTrigger here

  // 🔁 Sync draft orders with parent
  useEffect(() => {
    if (onOrderDraftChange) {
      onOrderDraftChange(draftOrders);
    }
  }, [draftOrders, onOrderDraftChange]);

  // helpers
  const getQty = (food) => {
    const item = draftOrders.find((o) => o.name === food.name);
    return item ? item.qty : 0;
  };

  const increment = (food) => {
    setDraftOrders((prev) => {
      const existing = prev.find((o) => o.name === food.name);
      if (existing) {
        return prev.map((o) =>
          o.name === food.name ? { ...o, qty: o.qty + 1 } : o
        );
      }
      return [...prev, { ...food, qty: 1 }];
    });
  };

  const decrement = (food) => {
    setDraftOrders((prev) => {
      const existing = prev.find((o) => o.name === food.name);
      if (!existing) return prev;
      if (existing.qty > 1) {
        return prev.map((o) =>
          o.name === food.name ? { ...o, qty: o.qty - 1 } : o
        );
      }
      return prev.filter((o) => o.name !== food.name);
    });
  };

  const removeFromOrder = (food) => {
    setDraftOrders((prev) => prev.filter((o) => o.name !== food.name));
  };

  if (loading) {
    return (
      <div className="card shadow-sm border-0 p-4 text-center">
        <p className="text-muted">Loading menu...</p>
      </div>
    );
  }

  if (!foods.length) {
    return (
      <div className="card shadow-sm border-0 p-4 text-center">
        <p className="text-muted">No food available.</p>
      </div>
    );
  }

  const listStyle =
    foods.length >= 5 ? { maxHeight: "50vh", overflowY: "auto" } : {};

  return (
    <div className="card shadow-sm border-0 p-4">
      <div className="d-flex align-items-center mb-3">
        <h4 className="mb-0 me-auto">Menu</h4>
      </div>

      <ul className="list-group" style={listStyle}>
        {foods.map((food, index) => (
          <li
            key={index}
            className="list-group-item d-flex justify-content-between align-items-center"
          >
            <div>
              <strong>{food.name}</strong>
              <div className="text-muted small">₱{food.price}</div>
            </div>

            <div className="d-flex align-items-center">
              <button
                className="btn btn-sm btn-outline-secondary me-2"
                onClick={() => decrement(food)}
                disabled={disabled}
              >
                -
              </button>
              <span className="me-2">{getQty(food)}</span>
              <button
                className="btn btn-sm btn-outline-success me-3"
                onClick={() => increment(food)}
                disabled={disabled}
              >
                +
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => removeFromOrder(food)}
                disabled={disabled}
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </li>
        ))}
      </ul>
      <br></br>
      {disabled && (
        <div className="alert alert-warning text-center py-2 mb-3">
          Ordering is closed — the cut-off time has passed.
        </div>
      )}

    </div>

  );
};

export default MenuUser;
