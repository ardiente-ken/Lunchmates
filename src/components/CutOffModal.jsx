import React, { useEffect, useState } from "react";
import "../css/AddFoodModal.css"; // reuse same fade styles

const CutOffModal = ({ show, onClose, onSave, currentTime }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedTime, setSelectedTime] = useState(currentTime || "");

  useEffect(() => {
    if (show) {
      setTimeout(() => setIsVisible(true), 10);
    } else {
      setIsVisible(false);
    }
  }, [show]);

  if (!show) return null;

  const handleSubmit = (e) => {
    e.preventDefault();
    onSave(selectedTime);
    onClose();
  };

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
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div className="modal-header">
                <h5 className="modal-title">Set Cut-Off Time</h5>
                <button
                  type="button"
                  className="btn-close"
                  aria-label="Close"
                  onClick={onClose}
                />
              </div>

              {/* Body */}
              <div className="modal-body text-center">
                <label className="form-label fs-5 mb-3">Select Time</label>
                <input
                  type="time"
                  className="form-control w-50 mx-auto fs-5 py-2"
                  value={selectedTime}
                  onChange={(e) => setSelectedTime(e.target.value)}
                  required
                />
              </div>

              {/* Footer */}
              <div className="modal-footer">
                <button
                  type="button"
                  className="btn btn-secondary"
                  onClick={onClose}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-success">
                  Save
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    </>
  );
};

export default CutOffModal;
