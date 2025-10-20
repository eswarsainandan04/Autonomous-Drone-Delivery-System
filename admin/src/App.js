import React, { useState, useEffect, createContext, useContext } from 'react';
import { BrowserRouter as Router, Routes, Route, Navigate } from 'react-router-dom';
import Login from './components/Login';
import AdminDashboard from './components/AdminDashboard';
import DroneManagement from './components/DroneManagement';
import DataInfoPage from './components/DataInfoPage';
import DroneAssignment from './components/DroneAssignment';
import WarehouseDetails from './components/WarehouseDetails';
import AdminSettings from './components/AdminSettings';
import AddUsers from './components/AddUsers';
import AddAdmins from './components/AddAdmins';
import Delivery from './components/DeliveryPage';
import Monitor from './components/Monitor';
import Packages from './components/PackageManagement';
import DdtInfo from './components/DdtInfo';

// Create Auth Context
const AuthContext = createContext();

// Auth Provider Component
const AuthProvider = ({ children }) => {
  const [isAuthenticated, setIsAuthenticated] = useState(false);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Check if user is already logged in on app start
    const authStatus = localStorage.getItem('isAuthenticated');
    if (authStatus === 'true') {
      setIsAuthenticated(true);
    }
    setIsLoading(false);
  }, []);

  const login = () => {
    setIsAuthenticated(true);
    localStorage.setItem('isAuthenticated', 'true');
  };

  const logout = () => {
    setIsAuthenticated(false);
    localStorage.removeItem('isAuthenticated');
  };

  return (
    <AuthContext.Provider value={{ isAuthenticated, login, logout, isLoading }}>
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (!context) {
    throw new Error('useAuth must be used within an AuthProvider');
  }
  return context;
};

// Protected Route Component
const ProtectedRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return isAuthenticated ? children : <Navigate to="/login" replace />;
};

// Public Route Component (redirects to dashboard if already logged in)
const PublicRoute = ({ children }) => {
  const { isAuthenticated, isLoading } = useAuth();

  if (isLoading) {
    return (
      <div className="min-h-screen flex items-center justify-center">
        <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return !isAuthenticated ? children : <Navigate to="/admin-dashboard" replace />;
};

function App() {
  return (
    <AuthProvider>
      <Router>
        <Routes>
          {/* Public routes - only accessible when not logged in */}
          <Route path="/login" element={
            <PublicRoute>
              <Login />
            </PublicRoute>
          } />
          
          {/* Protected routes - only accessible when logged in */}
          <Route path="/admin-dashboard" element={
            <ProtectedRoute>
              <AdminDashboard />
            </ProtectedRoute>
          } />
          
          <Route path="/data-info" element={
            <ProtectedRoute>
              <DataInfoPage />
            </ProtectedRoute>
          } />
          
          <Route path="/ddtinfo/:ddtName" element={
            <ProtectedRoute>
              <DdtInfo />
            </ProtectedRoute>
          } />
          
          <Route path="/drone-management" element={
            <ProtectedRoute>
              <DroneManagement />
            </ProtectedRoute>
          } />
            
          <Route path="/drone-assignment" element={
            <ProtectedRoute>
              <DroneAssignment />
            </ProtectedRoute>
          } />

          <Route path="/delivery" element={
            <ProtectedRoute>
              <Delivery />
            </ProtectedRoute>
          } />

          <Route path="/packages" element={
            <ProtectedRoute>
              <Packages />
            </ProtectedRoute>
          } />

          <Route path="/monitor" element={
            <ProtectedRoute>
              <Monitor />
            </ProtectedRoute>
          } />
          
          <Route path="/warehouse/:warehouseName" element={
            <ProtectedRoute>
              <WarehouseDetails />
            </ProtectedRoute>
          } />
          
          <Route path="/adminsettings" element={
            <ProtectedRoute>
              <AdminSettings />
            </ProtectedRoute>
          } />

          <Route path="/adminsadd" element={
            <ProtectedRoute>
              <AddAdmins />
            </ProtectedRoute>
          } />
          
          <Route path="/addusers" element={
            <ProtectedRoute>
              <AddUsers />
            </ProtectedRoute>
          } />

          {/* Catch all route - redirect to login */}
          <Route path="*" element={<Navigate to="/login" replace />} />
        </Routes>
      </Router>
    </AuthProvider>
  );
}

export default App;
