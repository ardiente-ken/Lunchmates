import React, { useEffect, useState } from "react";
import axios from "axios";
import { API_URL } from "../global";

const FoodList = ({
  foods,
  setFoods,
  handleOpenAdd,
  handleOpenUpdate,
  handleDelete,
  orderOpen, // 👈 from parent
}) => {
  const [isPastCutoff, setIsPastCutoff] = useState(false);

  // ✅ Fetch cutoff time from backend
  useEffect(() => {
    const checkCutoff = async () => {
      try {
        const res = await axios.get(`${API_URL}/cutoff/get`);
        if (res.data && res.data.cutoff) {
          const cutoffTime = new Date(
            `${res.data.cutoff.co_date}T${res.data.cutoff.co_time}`
          );
          const now = new Date();
          setIsPastCutoff(now > cutoffTime);
        }
      } catch (err) {
        console.error("❌ Failed to fetch cutoff:", err);
      }
    };

    checkCutoff();

    // recheck every 1 minute
    const interval = setInterval(checkCutoff, 60000);
    return () => clearInterval(interval);
  }, []);

  // ✅ Disable menu modification if ordering is open or cutoff has passed
  const disableMenu = orderOpen || isPastCutoff;

  // ✅ Fetch latest menu when mounted
  useEffect(() => {
    const fetchMenu = async () => {
      try {
        const response = await axios.get(`${API_URL}/daily-menu/get`);
        if (response.data.menu) {
          const menu = response.data.menu.map((item) => ({
            name: item.dm_itemName,
            price: parseFloat(item.dm_itemPrice).toFixed(2),
            saved: true,
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

        <button
          className="btn btn-success btn-sm me-2"
          onClick={handleOpenAdd}
          disabled={disableMenu}
          title={
            disableMenu
              ? orderOpen
                ? "Ordering is open — menu changes are locked."
                : "Cut-off time has passed — menu changes are locked."
              : "Add new food item"
          }
        >
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
                  <div className="text-muted small">₱{food.price}</div>
                </div>
                <div>
                  <button
                    className="btn btn-sm btn-outline-secondary me-2"
                    onClick={() => handleOpenUpdate(index)}
                    disabled={disableMenu}
                  >
                    Edit
                  </button>
                  <button
                    className="btn btn-sm btn-danger"
                    onClick={() => handleDelete(index)}
                    disabled={disableMenu}
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
