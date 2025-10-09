import React from "react";
import { Navigate } from "react-router-dom";

/**
 * ProtectedRoute
 * Restricts access to certain pages based on login state and user type.
 *
 * @param {ReactNode} children - The page/component to render if allowed
 * @param {string} allowedRole - Optional: restrict to a specific user role (e.g. "HR" or "Employee")
 */
const ProtectedRoute = ({ children, allowedRole }) => {
  const storedUser = localStorage.getItem("user");
  const user = storedUser ? JSON.parse(storedUser) : null;

  // 🚫 Not logged in
  if (!user) {
    return <Navigate to="/" replace />;
  }

  // 🚫 Logged in but wrong role
  if (
    allowedRole &&
    user.um_userType.toLowerCase() !== allowedRole.toLowerCase()
  ) {
    return <Navigate to="/" replace />;
  }

  // ✅ Authorized access
  return children;
};

export default ProtectedRoute;
