import React from "react";
import "bootstrap/dist/css/bootstrap.min.css";
import "@fortawesome/fontawesome-free/css/all.min.css";

const UserDashboard = () => {
  return (
    <div className="d-flex" style={{ minHeight: "100vh" }}>
      {/* Sidebar */}
      <nav
        className="bg-dark text-white p-3 d-flex flex-column"
        style={{ width: "250px" }}
      >
        <h4 className="text-center mb-4">📊 Dashboard</h4>
        <ul className="nav flex-column">
          <li className="nav-item mb-2">
            <a href="#" className="nav-link text-white">
              <i className="fas fa-home me-2"></i> Home
            </a>
          </li>
          <li className="nav-item mb-2">
            <a href="#" className="nav-link text-white">
              <i className="fas fa-chart-bar me-2"></i> Analytics
            </a>
          </li>
          <li className="nav-item mb-2">
            <a href="#" className="nav-link text-white">
              <i className="fas fa-box me-2"></i> Inventory
            </a>
          </li>
          <li className="nav-item mb-2">
            <a href="#" className="nav-link text-white">
              <i className="fas fa-users me-2"></i> Users
            </a>
          </li>
          <li className="nav-item">
            <a href="#" className="nav-link text-white">
              <i className="fas fa-cog me-2"></i> Settings
            </a>
          </li>
        </ul>
      </nav>

      {/* Main Content */}
      <div className="flex-grow-1 bg-light">
        {/* Top Navbar */}
        <nav className="navbar navbar-expand-lg navbar-light bg-white shadow-sm px-4">
          <span className="navbar-brand mb-0 h5">Welcome, Admin 👋</span>
          <div className="ms-auto">
            <button className="btn btn-outline-primary btn-sm me-2">
              <i className="fas fa-bell"></i>
            </button>
            <button className="btn btn-outline-secondary btn-sm">
              <i className="fas fa-user-circle"></i>
            </button>
          </div>
        </nav>

        {/* Dashboard Body */}
        <div className="container-fluid p-4">
          <h4 className="mb-4">Overview</h4>

          {/* Stats Cards */}
          <div className="row">
            <div className="col-md-3 mb-4">
              <div className="card shadow-sm border-0 p-3">
                <h6>Total Users</h6>
                <h3>1,240</h3>
                <i className="fas fa-users text-primary fa-2x"></i>
              </div>
            </div>
            <div className="col-md-3 mb-4">
              <div className="card shadow-sm border-0 p-3">
                <h6>Orders</h6>
                <h3>560</h3>
                <i className="fas fa-box text-success fa-2x"></i>
              </div>
            </div>
            <div className="col-md-3 mb-4">
              <div className="card shadow-sm border-0 p-3">
                <h6>Revenue</h6>
                <h3>$12,400</h3>
                <i className="fas fa-dollar-sign text-warning fa-2x"></i>
              </div>
            </div>
            <div className="col-md-3 mb-4">
              <div className="card shadow-sm border-0 p-3">
                <h6>Pending</h6>
                <h3>24</h3>
                <i className="fas fa-clock text-danger fa-2x"></i>
              </div>
            </div>
          </div>

          {/* Placeholder for Charts */}
          <div className="row">
            <div className="col-md-8 mb-4">
              <div className="card shadow-sm border-0 p-4">
                <h6>Sales Chart</h6>
                <div
                  className="bg-light border rounded d-flex align-items-center justify-content-center"
                  style={{ height: "250px" }}
                >
                  <p className="text-muted">[ Chart Placeholder ]</p>
                </div>
              </div>
            </div>
            <div className="col-md-4 mb-4">
              <div className="card shadow-sm border-0 p-4">
                <h6>Recent Activities</h6>
                <ul className="list-unstyled mt-3">
                  <li>🟢 New user registered</li>
                  <li>🟡 Order #1042 pending</li>
                  <li>🔵 Server backup completed</li>
                  <li>🟠 New message received</li>
                </ul>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default UserDashboard;
