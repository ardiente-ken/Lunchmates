import React, { useState, useEffect, useRef } from "react";
import "@fortawesome/fontawesome-free/css/all.min.css";
import "bootstrap/dist/css/bootstrap.min.css";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";

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
  const [user, setUser] = useState(null);
  const dropdownRef = useRef(null);
  const navigate = useNavigate();

  // ✅ Load user info from localStorage
  useEffect(() => {
    const storedUser = localStorage.getItem("user");
    if (storedUser) {
      const parsed = JSON.parse(storedUser);
      console.log("👤 Loaded user:", parsed);
      setUser(parsed);
    }
  }, []);

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

  // ✅ Logout Function
  const handleLogout = () => {
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
        localStorage.removeItem("user");

        Swal.fire({
          icon: "success",
          title: "Logged out",
          text: "You have been logged out successfully.",
          timer: 1200,
          showConfirmButton: false,
        });

        setTimeout(() => {
          navigate("/");
        }, 1200);
      }
    });
  };

  const displayName = user
    ? `${user.firstName || user.um_firstName || ""} ${user.lastName || user.um_lastName || ""}`.trim()
    : "User";

  return (
    <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-4">
      <span className="navbar-brand mb-0 h5">
        Hello, {displayName || "User"} 👋
      </span>

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
            <button className="dropdown-item text-danger" onClick={handleLogout}>
              <i className="fas fa-sign-out-alt me-2"></i> Logout
            </button>
          </div>
        )}
      </div>
    </nav>
  );
};

export default TopNavbar;
