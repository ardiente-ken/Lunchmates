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

    try {
      const response = await axios.post("http://localhost:5000/api/users/login", {
        username,
        password,
      });

      const user = response.data.user;
      localStorage.setItem("user", JSON.stringify(user)); // save session

      Swal.fire({
        icon: "success",
        title: "Welcome!",
        text: `Hello ${user.um_firstName}!`,
        timer: 1500,
        showConfirmButton: false,
      });

      // redirect based on user type
      if (user.um_userType.toLowerCase() === "hr") {
        navigate("/hr");
      } else if (user.um_userType.toLowerCase() === "employee") {
        navigate("/user");
      } else {
        Swal.fire({
          icon: "warning",
          title: "Unknown Role",
          text: "Please contact admin for access.",
        });
      }
    } catch (err) {
      Swal.fire({
        icon: "error",
        title: "Login Failed",
        text: err.response?.data?.message || "Server error. Please try again.",
      });
    } finally {
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
