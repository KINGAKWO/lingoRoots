// src/hooks/useRole.js
import { useAuth } from '../context/AuthContext';

/**
 * Custom hook to access user role and check for specific roles.
 * @returns {object} An object containing the user's role and a function to check roles.
 * - role: The current user's role (e.g., 'learner', 'creator', 'admin') or null.
 * - hasRole: A function that takes a role or an array of roles and returns true if the user has at least one of them.
 */
export function useRole() {
  const { role } = useAuth();

  const hasRole = (requiredRole) => {
    if (!role) return false;
    if (Array.isArray(requiredRole)) {
      return requiredRole.includes(role);
    }
    return role === requiredRole;
  };

  return { role, hasRole };
}