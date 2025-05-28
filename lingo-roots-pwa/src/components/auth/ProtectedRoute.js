import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext'; // Adjusted path

const ProtectedRoute = ({ allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    return (
      <div className="flex justify-center items-center min-h-screen">
        <div className="animate-spin rounded-full h-12 w-12 border-b-2 border-marine-blue-500"></div>
      </div>
    );
  }

  if (!currentUser) {
    // User not logged in, redirect to signin page
    return <Navigate to="/signin" replace />;
  }

  if (allowedRoles && allowedRoles.length > 0 && !allowedRoles.includes(userRole)) {
    // User role not allowed, redirect to a default page (e.g., home or a specific dashboard based on their actual role)
    // For simplicity, redirecting to home. A more sophisticated app might redirect to their role's default dashboard or an unauthorized page.
    let defaultPath = '/'; // Fallback default path
    if (userRole === 'Learner') defaultPath = '/learn';
    else if (userRole === 'Content Creator') defaultPath = '/creator-dashboard';
    else if (userRole === 'Administrator') defaultPath = '/admin';
    return <Navigate to={defaultPath} replace />;
  }

  // User is authenticated and has the required role (or no specific roles are required for this route)
  return <Outlet />; // Use Outlet for nested routes as defined in App.js
};

export default ProtectedRoute;