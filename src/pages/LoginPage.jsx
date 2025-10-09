import React, { useState } from "react";
import axios from "axios";
import Swal from "sweetalert2";
import { useNavigate } from "react-router-dom";
import "bootstrap/dist/css/bootstrap.min.css";

const LoginPage = () => {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const navigate = useNavigate();

  const handleLogin = async (e) => {
    e.preventDefault();
    setLoading(true);

    console.log("=======================================");
    console.log("🟦 [LOGIN ATTEMPT - FRONTEND]");
    console.log("➡️ Username:", username);
    console.log("➡️ Password:", password ? "(hidden)" : "(empty)");
    console.log("=======================================");

    try {
      console.log("🌐 Sending POST request to backend...");
      const response = await axios.post(
        "http://localhost:5000/api/users/login",
        { username, password },
        {
          headers: {
            "Content-Type": "application/json",
          },
          validateStatus: (status) => true, // allow handling all status codes manually
        }
      );

      console.log("📥 [BACKEND RESPONSE]");
      console.log("➡️ Status:", response.status);
      console.log("➡️ Data:", response.data);

      if (response.status !== 200) {
        console.warn("⚠️ Non-200 response:", response.data);
        throw new Error(response.data?.message || "Login failed");
      }

      const user = response.data.user;
      console.log("👤 [USER DATA RECEIVED]:", user);

      localStorage.setItem("user", JSON.stringify(user));

      Swal.fire({
        icon: "success",
        title: "Welcome!",
        text: `Hello ${user.firstName || user.um_firstName}!`,
        timer: 1500,
        showConfirmButton: false,
      });

      // Redirect based on role
      const userType = (user.userType || user.um_userType || "").toLowerCase();
      console.log("🔀 Redirecting based on userType:", userType);

      if (userType === "hr") {
        navigate("/hr");
      } else if (userType === "employee") {
        navigate("/user");
      } else {
        Swal.fire({
          icon: "warning",
          title: "Unknown Role",
          text: "Please contact admin for access.",
        });
      }

    } catch (err) {
      console.error("❌ [LOGIN ERROR]:", err);
      console.log("➡️ Full error object:", JSON.stringify(err, null, 2));

      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text:
          err.response?.data?.message ||
          err.message ||
          "Server error. Please try again.",
      });
    } finally {
      console.log("✅ Login attempt complete");
      console.log("=======================================");
      setLoading(false);
    }
  };

  return (
    <div className="d-flex align-items-center justify-content-center vh-100 bg-light">
      <div className="card p-4 shadow-lg" style={{ width: "100%", maxWidth: "400px" }}>
        <h4 className="text-center mb-3">🍱 LunchMates Login</h4>
        <form onSubmit={handleLogin}>
          <div className="mb-3">
            <label className="form-label">Username</label>
            <input
              type="text"
              className="form-control"
              value={username}
              onChange={(e) => setUsername(e.target.value)}
              placeholder="Enter username"
              required
            />
          </div>

          <div className="mb-3">
            <label className="form-label">Password</label>
            <input
              type="password"
              className="form-control"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="Enter password"
              required
            />
          </div>

          <button type="submit" className="btn btn-primary w-100" disabled={loading}>
            {loading ? "Logging in..." : "Login"}
          </button>
        </form>
      </div>
    </div>
  );
};

export default LoginPage;
