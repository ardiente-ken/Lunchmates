import { BrowserRouter as Router, Routes, Route } from "react-router-dom";
import LoginPage from "./pages/LoginPage";
import UserDashboard from "./pages/UserDashboard";
import HRDashboard from "./pages/HRDashboard";
import ProtectedRoute from "./routes/ProtectedRoute";

function App() {
  return (
    <Router>
      <Routes>
        <Route path="/" element={<LoginPage />} />

        {/* Employee Dashboard (only for Employee users) */}
        <Route
          path="/user"
          element={
            <ProtectedRoute allowedRole="Employee">
              <UserDashboard />
            </ProtectedRoute>
          }
        />

        {/* HR Dashboard (only for HR users) */}
        <Route
          path="/hr"
          element={
            <ProtectedRoute allowedRole="HR">
              <HRDashboard />
            </ProtectedRoute>
          }
        />
      </Routes>
    </Router>
  );
}

export default App;
