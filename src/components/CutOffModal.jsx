import React, { useEffect, useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";

const CutOffModal = ({ show, onClose, currentTime, onSave }) => {
  const [isVisible, setIsVisible] = useState(false);
  const [selectedTime, setSelectedTime] = useState(currentTime || "");

  useEffect(() => {
    if (show) setTimeout(() => setIsVisible(true), 10);
    else setIsVisible(false);
  }, [show]);

  useEffect(() => {
    if (currentTime) setSelectedTime(currentTime);
  }, [currentTime]);

  if (!show) return null;

  const handleSubmit = async (e) => {
    e.preventDefault();

    console.log("🟦 Cut-Off Modal Submit clicked");
    console.log("➡️ Selected time:", selectedTime);

    // Today's date in YYYY-MM-DD
    const today = new Date().toISOString().split("T")[0];
    console.log("➡️ Today's date:", today);

    // Format time for SQL (HH:MM:SS)
    const formattedTime = selectedTime.length === 5 ? `${selectedTime}:00` : selectedTime;
    console.log("➡️ Formatted time to send:", formattedTime);

    try {
      const response = await axios.post("http://localhost:5000/api/cutoff", {
        date: today,
        time: formattedTime,
      });

      console.log("✅ API Response:", response.data);

      Swal.fire({
        icon: "success",
        title: "Cut-Off Time Set!",
        text: response.data.message,
        timer: 1500,
        showConfirmButton: false,
      });

      // Update parent state
      onSave(formattedTime);

      // Close modal
      onClose();
    } catch (err) {
      console.error("❌ Cut-off error:", err);

      Swal.fire({
        icon: "error",
        title: "Error",
        text: err.response?.data?.message || "Server error",
      });
    }
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
        <div className="modal-dialog modal-dialog-centered modal-wide" role="document">
          <div className="modal-content">
            <form onSubmit={handleSubmit}>
              {/* Header */}
              <div className="modal-header">
                <h5 className="modal-title">Set Cut-Off Time</h5>
                <button type="button" className="btn-close" onClick={onClose} />
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
                <button type="button" className="btn btn-secondary" onClick={onClose}>
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
