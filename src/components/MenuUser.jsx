import React, { useEffect, useState } from "react";
import axios from "axios";

const MenuUser = ({ user, onOrderDraftChange }) => {
  const userId = user?.userId;
  const [foods, setFoods] = useState([]);
  const [loading, setLoading] = useState(true);
  const [draftOrders, setDraftOrders] = useState([]);

  // 🥘 Fetch menu + today's orders when component loads
  useEffect(() => {
    const fetchMenuAndOrders = async () => {
      if (!userId) return;

      try {
        setLoading(true);

        // 1️⃣ Fetch available menu
        const menuRes = await axios.get("http://localhost:5000/api/dailymenu");
        const formattedFoods = menuRes.data.menu.map((item) => ({
          name: item.dm_itemName,
          price: item.dm_itemPrice,
          qty: 0, // default
        }));

        // 2️⃣ Fetch today's orders for the user
        const orderRes = await axios.get("http://localhost:5000/api/orders/today", {
          params: { userId },
        });
        const userOrders = orderRes.data || [];

        // 3️⃣ Merge the data: update menu qty if ordered today
        const mergedFoods = formattedFoods.map((food) => {
          const match = userOrders.find((order) => order.name === food.name);
          return match ? { ...food, qty: match.qty } : food;
        });

        setFoods(mergedFoods);
        setDraftOrders(userOrders); // preload existing orders
      } catch (error) {
        console.error("❌ Error loading menu/orders:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchMenuAndOrders();
  }, [userId]); // runs once when userId is ready

  // 🔁 Send draft order changes to parent
  useEffect(() => {
    if (onOrderDraftChange) {
      onOrderDraftChange(draftOrders);
    }
  }, [draftOrders]);

  // ➕ Increase qty
  const increment = (food) => {
    setFoods((prev) =>
      prev.map((f) =>
        f.name === food.name ? { ...f, qty: f.qty + 1 } : f
      )
    );

    setDraftOrders((prev) => {
      const existing = prev.find((o) => o.name === food.name);
      if (existing) {
        return prev.map((o) =>
          o.name === food.name ? { ...o, qty: o.qty + 1 } : o
        );
      } else {
        return [...prev, { ...food, qty: 1 }];
      }
    });
  };

  // ➖ Decrease qty
  const decrement = (food) => {
    setFoods((prev) =>
      prev.map((f) =>
        f.name === food.name && f.qty > 0 ? { ...f, qty: f.qty - 1 } : f
      )
    );

    setDraftOrders((prev) => {
      const existing = prev.find((o) => o.name === food.name);
      if (!existing) return prev;

      if (existing.qty > 1) {
        return prev.map((o) =>
          o.name === food.name ? { ...o, qty: o.qty - 1 } : o
        );
      } else {
        return prev.filter((o) => o.name !== food.name);
      }
    });
  };

  // 🗑️ Remove item
  const removeFromOrder = (food) => {
    setFoods((prev) =>
      prev.map((f) => (f.name === food.name ? { ...f, qty: 0 } : f))
    );
    setDraftOrders((prev) => prev.filter((o) => o.name !== food.name));
  };

  if (loading) {
    return (
      <div className="card shadow-sm border-0 p-4 text-center">
        <p className="text-muted">Loading menu...</p>
      </div>
    );
  }

  const listStyle =
    foods.length >= 5 ? { maxHeight: "50vh", overflowY: "auto" } : {};

  return (
    <div className="card shadow-sm border-0 p-4">
      <h4 className="mb-3">Menu</h4>
      {foods.length === 0 ? (
        <p className="text-muted text-center py-5">No food available today.</p>
      ) : (
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
                >
                  -
                </button>
                <span className="me-2">{food.qty}</span>
                <button
                  className="btn btn-sm btn-outline-success me-3"
                  onClick={() => increment(food)}
                >
                  +
                </button>
                {food.qty > 0 && (
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => removeFromOrder(food)}
                  >
                    <i className="fas fa-trash"></i>
                  </button>
                )}
              </div>
            </li>
          ))}
        </ul>
      )}
    </div>
  );
};

export default MenuUser;
