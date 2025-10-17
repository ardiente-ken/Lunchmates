import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../global";

const MenuUser = ({
  userId,
  existingOrders = [],
  resetTrigger,
  disabled: propDisabled,
  onOrderDraftChange,
  orderStatus, // 👈 add from parent (e.g., "open" | "closed")
  cutoffTime,  // 👈 add from parent (e.g., "15:00")
}) => {
  const [foods, setFoods] = useState([]);
  const [draftOrders, setDraftOrders] = useState([]);
  const [loading, setLoading] = useState(true);
  const [isCutoffPassed, setIsCutoffPassed] = useState(false);

  // 🕒 Check if time now > cutoffTime
  useEffect(() => {
    if (!cutoffTime) return;

    const checkCutoff = () => {
      const now = new Date();
      const [h, m] = cutoffTime.split(":").map(Number);
      const cutoff = new Date();
      cutoff.setHours(h, m, 0, 0);
      setIsCutoffPassed(now > cutoff);
    };

    checkCutoff();
    const timer = setInterval(checkCutoff, 60 * 1000); // check every minute
    return () => clearInterval(timer);
  }, [cutoffTime]);

  // Load menu
  useEffect(() => {
    const load = async () => {
      try {
        setLoading(true);
        const res = await axios.get(`${API_URL}/daily-menu/get`);
        const menu = (res.data.menu || []).map((m) => ({
          name: String(m.dm_itemName || "").trim(),
          price: Number(m.dm_itemPrice || 0),
          qty: 0,
        }));

        const userItems = Array.isArray(existingOrders) ? existingOrders : [];
        const merged = menu.map((f) => {
          const match = userItems.find(
            (u) => String(u.name).trim().toLowerCase() === String(f.name).trim().toLowerCase()
          );
          return {
            ...f,
            qty: match ? Number(match.qty || 0) : 0,
            price: match ? Number(match.price ?? f.price) : f.price,
          };
        });

        setFoods(merged);
        setDraftOrders(merged.filter((g) => g.qty > 0));
      } catch (err) {
        console.error("MenuUser: error loading menu:", err);
      } finally {
        setLoading(false);
      }
    };

    load();
  }, [userId, existingOrders, resetTrigger]);

  // Push drafts up to parent
  useEffect(() => {
    if (typeof onOrderDraftChange === "function") {
      const total = draftOrders.reduce((s, i) => s + (i.price || 0) * (i.qty || 0), 0);
      onOrderDraftChange(draftOrders, total);
    }
  }, [draftOrders, onOrderDraftChange]);

  const getQty = (foodName) => foods.find((x) => x.name === foodName)?.qty || 0;

  const handleIncrement = (food) => {
    if (isDisabled) return;
    setFoods((prev) =>
      prev.map((f) => (f.name === food.name ? { ...f, qty: f.qty + 1 } : f))
    );
    setDraftOrders((prev) => {
      const item = prev.find((p) => p.name === food.name);
      return item
        ? prev.map((p) => (p.name === food.name ? { ...p, qty: p.qty + 1 } : p))
        : [...prev, { ...food, qty: 1 }];
    });
  };

  const handleDecrement = (food) => {
    if (isDisabled) return;
    setFoods((prev) =>
      prev.map((f) =>
        f.name === food.name ? { ...f, qty: Math.max(f.qty - 1, 0) } : f
      )
    );
    setDraftOrders((prev) => {
      const item = prev.find((p) => p.name === food.name);
      if (!item) return prev;
      if (item.qty <= 1) return prev.filter((p) => p.name !== food.name);
      return prev.map((p) => (p.name === food.name ? { ...p, qty: p.qty - 1 } : p));
    });
  };

  const handleRemove = (food) => {
    if (isDisabled) return;
    setFoods((prev) => prev.map((f) => (f.name === food.name ? { ...f, qty: 0 } : f)));
    setDraftOrders((prev) => prev.filter((p) => p.name !== food.name));
  };

  // 🔒 determine if buttons should be disabled
  const isDisabled = propDisabled || orderStatus === "closed" || isCutoffPassed;

  if (loading)
    return (
      <div className="card shadow-sm border-0 p-4 text-center">
        <p className="text-muted">Loading menu...</p>
      </div>
    );

  if (!foods.length)
    return (
      <div className="card shadow-sm border-0 p-4 text-center">
        <p className="text-muted">No food available.</p>
      </div>
    );

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
              <button
                className="btn btn-sm btn-outline-secondary me-2"
                onClick={() => handleDecrement(food)}
                disabled={isDisabled}
              >
                -
              </button>
              <span className="me-2">{getQty(food.name)}</span>
              <button
                className="btn btn-sm btn-outline-success me-3"
                onClick={() => handleIncrement(food)}
                disabled={isDisabled}
              >
                +
              </button>
              <button
                className="btn btn-sm btn-danger"
                onClick={() => handleRemove(food)}
                disabled={isDisabled}
              >
                <i className="fas fa-trash"></i>
              </button>
            </div>
          </li>
        ))}
      </ul>

      {isDisabled && (
        <div className="alert alert-warning text-center py-2 mt-3">
          Ordering is closed.
        </div>
      )}
    </div>
  );
};

export default MenuUser;
