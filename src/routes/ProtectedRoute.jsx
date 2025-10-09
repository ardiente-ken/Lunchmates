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

  console.log("🔐 Checking ProtectedRoute...");
  console.log("👤 User from localStorage:", user);
  console.log("🎯 Allowed role:", allowedRole);

  // 🚫 Not logged in
  if (!user) {
    console.warn("⚠️ No user found. Redirecting to login...");
    return <Navigate to="/" replace />;
  }

  // Handle both possible property names
  const userRole = (user.userType || user.um_userType || "").toLowerCase();

  // 🚫 Logged in but wrong role
  if (allowedRole && userRole !== allowedRole.toLowerCase()) {
    console.warn(`🚫 Access denied. User role: ${userRole}, Required: ${allowedRole}`);
    return <Navigate to="/" replace />;
  }

  // ✅ Authorized access
  console.log("✅ Access granted to route.");
  return children;
};

export default ProtectedRoute;
