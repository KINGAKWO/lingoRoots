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
  const { user, userRole, loading } = useAuth(); // Changed currentUser to user

  if (loading) {
    // Optional: Show a loading spinner or a blank page while auth state is being determined
    return <p>Loading authentication status...</p>; // Or your app's global loader
  }

  if (!user) { // Changed currentUser to user
    // User not logged in, redirect to sign-in page
    return <Navigate to="/signin" replace />;
  }

  if (allowedRoles && !allowedRoles.includes(userRole)) {
    // User is logged in but does not have the required role
    console.warn(`User with role '${userRole}' tried to access a route restricted to '${allowedRoles.join(', ')}'. Redirecting.`);
    // Redirect to a dedicated unauthorized page or a role-specific dashboard as a fallback.
    // For now, providing a simple text feedback and redirecting to a generic fallback.
    // A more sophisticated app would have a dedicated '/unauthorized' page.
    let fallbackPath = '/'; // Default fallback
    if (userRole === 'Learner') fallbackPath = '/learn';
    else if (userRole === 'Content Creator') fallbackPath = '/creator-dashboard';
    else if (userRole === 'Administrator') fallbackPath = '/admin';
    
    // It's better to have a dedicated unauthorized page.
    // For this example, we'll redirect to their likely dashboard or home.
    // Consider adding a query param to show a message on the target page.
    // e.g., return <Navigate to={`/unauthorized?attemptedPath=${window.location.pathname}`} replace />;
    return (
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        <h1>Access Denied</h1>
        <p>You do not have the necessary permissions to view this page.</p>
        <p>Your current role is: <strong>{userRole || 'Not assigned'}</strong>.</p>
        <p>You do not have the required role(s): <strong>{allowedRoles.join(', ')}</strong> to access this page.</p>
        <p>Redirecting you to a relevant page...</p>
        {/* Navigate component will handle the actual redirect after a brief moment or immediately */}
        <Navigate to={fallbackPath} replace />
      </div>
    );
  }

  // User is authenticated and has the required role (if specified)
  return <Outlet />;
};

export default ProtectedRoute;