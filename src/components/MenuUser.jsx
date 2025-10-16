import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../global";

const MenuUser = ({ userId, existingOrders = [], resetTrigger, disabled, onOrderDraftChange }) => {
  const [foods, setFoods] = useState([]);      // menu with qty
  const [draftOrders, setDraftOrders] = useState([]); // items user will submit (from DB merged + local changes)
  const [loading, setLoading] = useState(true);

  // Fetch menu and merge with existingOrders (which we expect as an array of items)
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const menuRes = await axios.get(`${API_URL}/daily-menu/get`);
        const menu = (menuRes.data.menu || []).map((m) => ({
          name: String(m.dm_itemName || "").trim(),
          price: Number(m.dm_itemPrice || 0),
          qty: 0,
        }));

        // existingOrders is expected to be an array of items [{name, price, qty}, ...]
        const userItems = Array.isArray(existingOrders) ? existingOrders : [];

        console.log("MenuUser.load() - menu count:", menu.length, "userItems:", userItems);

        // merge by name (case-insensitive)
        const merged = menu.map((f) => {
          const match = userItems.find(
            (u) => String(u.name || "").trim().toLowerCase() === String(f.name || "").trim().toLowerCase()
          );
          return { ...f, qty: match ? Number(match.qty || 0) : 0, price: match ? Number(match.price ?? f.price) : f.price };
        });

        setFoods(merged);
        // draftOrders should start from the DB values (items with qty>0)
        setDraftOrders(merged.filter((g) => g.qty > 0).map((g) => ({ name: g.name, price: g.price, qty: g.qty })));
      } catch (err) {
        console.error("MenuUser: error loading menu:", err);
      } finally {
        setLoading(false);
      }
    };

    // only try to load if userId exists (or even if not, we still want menu)
    load();
  }, [userId, existingOrders, resetTrigger]);

  // push changes up to parent
  useEffect(() => {
    if (typeof onOrderDraftChange === "function") {
      const total = draftOrders.reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0);
      onOrderDraftChange(draftOrders, total);
    }
  }, [draftOrders, onOrderDraftChange]);

  const getQty = (foodName) => {
    const f = foods.find((x) => x.name.trim().toLowerCase() === foodName.trim().toLowerCase());
    return f ? f.qty : 0;
  };

  const increment = (food) => {
    if (disabled) return;
    setFoods((prev) => prev.map((f) => (f.name === food.name ? { ...f, qty: (f.qty || 0) + 1 } : f)));
    setDraftOrders((prev) => {
      const i = prev.find((p) => p.name === food.name);
      if (i) return prev.map((p) => (p.name === food.name ? { ...p, qty: p.qty + 1 } : p));
      return [...prev, { name: food.name, price: food.price, qty: 1 }];
    });
  };

  const decrement = (food) => {
    if (disabled) return;
    setFoods((prev) => prev.map((f) => (f.name === food.name ? { ...f, qty: Math.max((f.qty || 0) - 1, 0) } : f)));
    setDraftOrders((prev) => {
      const i = prev.find((p) => p.name === food.name);
      if (!i) return prev;
      if (i.qty <= 1) return prev.filter((p) => p.name !== food.name);
      return prev.map((p) => (p.name === food.name ? { ...p, qty: p.qty - 1 } : p));
    });
  };

  const removeFromOrder = (food) => {
    if (disabled) return;
    setFoods((prev) => prev.map((f) => (f.name === food.name ? { ...f, qty: 0 } : f)));
    setDraftOrders((prev) => prev.filter((p) => p.name !== food.name));
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

  const listStyle = foods.length >= 5 ? { maxHeight: "50vh", overflowY: "auto" } : {};

  return (
    <div className="card shadow-sm border-0 p-4">
      <div className="d-flex align-items-center mb-3">
        <h4 className="mb-0 me-auto">Menu</h4>
      </div>

      <ul className="list-group" style={listStyle}>
        {foods.map((food, idx) => (
          <li key={idx} className="list-group-item d-flex justify-content-between align-items-center">
            <div>
              <strong>{food.name}</strong>
              <div className="text-muted small">₱{food.price}</div>
            </div>

            <div className="d-flex align-items-center">
              <button className="btn btn-sm btn-outline-secondary me-2" onClick={() => decrement(food)} disabled={disabled}>-</button>
              <span className="me-2">{getQty(food.name)}</span>
              <button className="btn btn-sm btn-outline-success me-3" onClick={() => increment(food)} disabled={disabled}>+</button>
              <button className="btn btn-sm btn-danger" onClick={() => removeFromOrder(food)} disabled={disabled}>
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </li>
        ))}
      </ul>

      {disabled && (
        <div className="alert alert-warning text-center py-2 mt-3">
          Ordering is closed — the cut-off time has passed.
        </div>
      )}
    </div>
  );
};

export default MenuUser;
