import React from 'react';
import { Navigate } from 'react-router-dom';

const ProtectedRoute = ({ children }) => {
  const username = sessionStorage.getItem('username');

  if (!username) {
    // User not logged in, redirect to login page
    return <Navigate to="/login" replace />;
  }
  return children;
};

export default ProtectedRoute;