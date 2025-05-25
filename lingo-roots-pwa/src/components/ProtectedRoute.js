import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuth } from '../context/AuthContext';

/**
 * ProtectedRoute component for role-based access control.
 *
 * @param {object} props - The component's props.
 * @param {string[]} props.allowedRoles - An array of roles allowed to access the route.
 *                                        If undefined, only authentication is checked.
 * @returns {JSX.Element} - The child component (Outlet) if authorized, or a Navigate component to redirect.
 */
const ProtectedRoute = ({ allowedRoles }) => {
  const { currentUser, userRole, loading } = useAuth();

  if (loading) {
    // Optional: Show a loading spinner or a blank page while auth state is being determined
    return <p>Loading authentication status...</p>; // Or your app's global loader
  }

  if (!currentUser) {
    // User not logged in, redirect to sign-in page
    return <Navigate to="/signin" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // User is logged in but does not have the required role
    // Redirect to a general dashboard or an unauthorized page
    // For now, let's redirect to a generic dashboard or home page if their role doesn't match.
    // A more sophisticated app might have a dedicated "Unauthorized" page.
    console.warn(`User with role '${userRole}' tried to access a route restricted to '${allowedRoles.join(', ')}'. Redirecting.`);
    // Determine a safe fallback based on their actual role or a default page
    let fallbackPath = '/'; // Default fallback
    if (userRole === 'Learner') fallbackPath = '/learn';
    else if (userRole === 'Content Creator') fallbackPath = '/creator-dashboard';
    else if (userRole === 'Administrator') fallbackPath = '/admin';
    // If already on their role's page, but trying to access another protected one, maybe redirect to their own dashboard.
    // Or, if they somehow have no role or an unexpected role, redirect to home/signin.
    return <Navigate to={fallbackPath} replace />;
  }

  // User is authenticated and has the required role (if specified)
  return <Outlet />;
};

export default ProtectedRoute;