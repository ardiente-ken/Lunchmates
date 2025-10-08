import React, { useEffect, useState } from "react";
import "../css/AddFoodModal.css";

const FoodModal = ({
  show,
  onClose,
  onSubmit,
  foodName,
  setFoodName,
  price,
  setPrice,
  mode = "add", // "add" | "edit"
}) => {
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    if (show) {
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [show]);

  if (!show) return null;

  const title = mode === "add" ? "Add New Food" : "Edit Food";
  const buttonText = mode === "add" ? "Add" : "Save Changes";

  return (
    <>
      {/* Backdrop */}
      <div
        className={`modal-backdrop-custom ${isVisible ? "show" : ""}`}
        onClick={onClose}
      />

      {/* Modal */}
      <div
        className={`modal fade-custom ${isVisible ? "show" : ""}`}
        tabIndex="-1"
        role="dialog"
        aria-modal="true"
      >
        <div
          className="modal-dialog modal-dialog-centered modal-wide"
          role="document"
        >
          <div className="modal-content">
            <form onSubmit={onSubmit}>
              <div className="modal-header">
                <h5 className="modal-title">{title}</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={onClose}
                />
              </div>

              <div className="modal-body">
                <div className="row">
                  <div className="col-md-6 mb-3">
                    <label className="form-label">Food Name</label>
                    <input
                      type="text"
                      className="form-control"
                      value={foodName}
                      onChange={(e) => setFoodName(e.target.value)}
                      placeholder="Enter food name"
                      required
                    />
                  </div>

                  <div className="col-md-6 mb-3">
                    <label className="form-label">Price</label>
                    <input
                      type="number"
                      step="0.01"
                      min="0"
                      className="form-control"
                      value={price}
                      onChange={(e) => setPrice(e.target.value)}
                      placeholder="Enter price"
                      required
                    />
                  </div>
                </div>
              </div>

              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  {buttonText}
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default FoodModal;
