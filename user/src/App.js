import { BrowserRouter as Router, Routes, Route, Navigate } from "react-router-dom"
import Home from "./components/Home"
import Login from "./components/Login"
import DeliveryPage from "./components/DeliveryPage"
import Racks from "./components/Racks"
import Tower from "./components/Tower"
import Monitoring from "./components/DroneMonitoring"
import WarehouseSelection from "./components/WarehouseSelection"
import PackageManagement from "./components/PackageManagement"
import Monitor from "./components/Monitor"
import Profile from "./components/Profile"
import RestPassword from "./components/ResetPassword"
import ProtectedRoute from "./components/ProtectedRoute"

function App() {
  return (
    <Router>
      <Routes>
        {/* Public routes */}
        <Route path="/login" element={<Login />} />

        <Route path="/reset-password" element={<RestPassword />} />

        {/* Protected routes */}
        <Route
          path="/"
          element={
            <ProtectedRoute>
              <Home />
            </ProtectedRoute>
          }
        />

        <Route
          path="/profile"
          element={
            <ProtectedRoute>
              <Profile />
            </ProtectedRoute>
          }
        />

        <Route
          path="/delivery"
          element={
            <ProtectedRoute>
              <DeliveryPage />
            </ProtectedRoute>
          }
        />

        <Route
          path="/monitor"
          element={
            <ProtectedRoute>
              <Monitor />
            </ProtectedRoute>
          }
        />

        <Route
          path="/monitoring"
          element={
            <ProtectedRoute>
              <Monitoring />
            </ProtectedRoute>
          }
        />

        <Route
          path="/packages"
          element={
            <ProtectedRoute>
              <PackageManagement />
            </ProtectedRoute>
          }
        />

        <Route
          path="/racks"
          element={
            <ProtectedRoute>
              <Racks />
            </ProtectedRoute>
          }
        />

        <Route
          path="/tower"
          element={
            <ProtectedRoute>
              <Tower />
            </ProtectedRoute>
          }
        />

        <Route
          path="/warehouse-selection"
          element={
            <ProtectedRoute>
              <WarehouseSelection />
            </ProtectedRoute>
          }
        />

        <Route path="*" element={<Navigate to="/login" />} />
      </Routes>
    </Router>
  )
}

export default App
