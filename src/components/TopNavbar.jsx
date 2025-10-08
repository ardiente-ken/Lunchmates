import React, { useState, useEffect, useRef } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Swal from "sweetalert2";

const ClockDisplay = () => {
  const [time, setTime] = useState(new Date());

  useEffect(() => {
    const timer = setInterval(() => setTime(new Date()), 1000);
    return () => clearInterval(timer);
  }, []);

  const formattedTime = time.toLocaleTimeString([], {
    hour: "2-digit",
    minute: "2-digit",
    second: "2-digit",
  });

  return (
    <span className="me-3 text-secondary fw-semibold" style={{ minWidth: "80px" }}>
      {formattedTime}
    </span>
  );
};

const TopNavbar = () => {
  const [dropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef(null);

  // ✅ Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target)) {
        setDropdownOpen(false);
      }
    };
    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-4">
      <span className="navbar-brand mb-0 h5">Welcome, Admin 👋</span>

      <div className="ms-auto d-flex align-items-center position-relative" ref={dropdownRef}>
        {/* Live Clock */}
        <ClockDisplay />

        {/* User Button */}
        <button
          className="btn btn-outline-secondary btn-sm"
          onClick={() => setDropdownOpen(!dropdownOpen)}
        >
          <i className="fas fa-user-circle"></i>
        </button>

        {/* Dropdown Menu */}
        {dropdownOpen && (
          <div
            className="position-absolute end-0 mt-2 bg-white border rounded shadow-sm p-2"
            style={{
              minWidth: "150px",
              zIndex: 1000,
              transition: "opacity 0.2s ease",
            }}
          >
            <button
              className="dropdown-item text-danger"
              onClick={() => {
                Swal.fire({
                  title: "Are you sure?",
                  text: "You will be logged out of the system.",
                  icon: "warning",
                  showCancelButton: true,
                  confirmButtonColor: "#d33",
                  cancelButtonColor: "#6c757d",
                  confirmButtonText: "Yes, logout",
                  cancelButtonText: "Cancel",
                }).then((result) => {
                  if (result.isConfirmed) {
                    // ✅ Perform logout action here
                    console.log("Logging out...");
                    // For example: redirect or clear session
                    // window.location.href = "/login";
                  }
                });
              }}
            >
              <i className="fas fa-sign-out-alt me-2"></i> Logout
            </button>
          </div>
        )}

      </div>
    </nav>
  );
};

export default TopNavbar;
