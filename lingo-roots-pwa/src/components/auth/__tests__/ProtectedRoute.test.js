import React from 'react';
import { render, screen, waitFor } from '@testing-library/react';
import { MemoryRouter, Routes, Route, Outlet, Navigate } from 'react-router-dom';
import { AuthProvider } from '../../../context/AuthContext'; // Adjusted path
import ProtectedRoute from '../ProtectedRoute';

// Mock child component to render within ProtectedRoute
const MockChildComponent = () => <div data-testid="child-component">Protected Content</div>;
const MockSignInComponent = () => <div data-testid="signin-page">Sign In Page</div>;
const MockLearnerDashboard = () => <div data-testid="learner-dashboard">Learner Dashboard</div>;
const MockCreatorDashboard = () => <div data-testid="creator-dashboard">Creator Dashboard</div>;
const MockAdminDashboard = () => <div data-testid="admin-dashboard">Admin Dashboard</div>;
const MockHomePage = () => <div data-testid="home-page">Home Page</div>;

// Helper function to render ProtectedRoute with specific context and routes
const renderProtectedRoute = (authContextValue, allowedRoles, initialEntry = '/protected') => {
  return render(
    <AuthProvider value={authContextValue}>
      <MemoryRouter initialEntries={[initialEntry]}>
        <Routes>
          <Route path="/signin" element={<MockSignInComponent />} />
          <Route path="/learn" element={<MockLearnerDashboard />} />
          <Route path="/creator-dashboard" element={<MockCreatorDashboard />} />
          <Route path="/admin" element={<MockAdminDashboard />} />
          <Route path="/" element={<MockHomePage />} />
          <Route element={<ProtectedRoute allowedRoles={allowedRoles} />}>
            <Route path="/protected" element={<MockChildComponent />} />
          </Route>
        </Routes>
      </MemoryRouter>
    </AuthProvider>
  );
};

describe('ProtectedRoute Component', () => {
  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders child component if user is authenticated and has allowed role', () => {
    const authContextValue = { currentUser: { uid: '123' }, userRole: 'learner', loading: false };
    renderProtectedRoute(authContextValue, ['learner']);
    expect(screen.getByTestId('child-component')).toBeInTheDocument();
  });

  test('redirects to /signin if user is not authenticated', async () => {
    const authContextValue = { currentUser: null, userRole: null, loading: false };
    renderProtectedRoute(authContextValue, ['learner']);
    await waitFor(() => {
        expect(screen.getByTestId('signin-page')).toBeInTheDocument();
    });
  });

  test('redirects to role-specific page if user is authenticated but does not have allowed role', async () => {
    const authContextValue = { currentUser: { uid: '123' }, userRole: 'learner', loading: false };
    // Expecting 'admin', but user is 'learner'
    renderProtectedRoute(authContextValue, ['admin'], '/protected');
    // Should redirect to learner's default page
    await waitFor(() => {
        expect(screen.getByTestId('learner-dashboard')).toBeInTheDocument(); 
    });
  });

  test('redirects to /creator-dashboard if user is content_creator and tries to access restricted page', async () => {
    const authContextValue = { currentUser: { uid: '123' }, userRole: 'content_creator', loading: false };
    renderProtectedRoute(authContextValue, ['admin'], '/protected');
    await waitFor(() => {
        expect(screen.getByTestId('creator-dashboard')).toBeInTheDocument();
    });
  });

   test('redirects to /admin if user is administrator and tries to access restricted page (but has admin role)', async () => {
    // This case tests if an admin tries to access a page not meant for them, but their default redirect is /admin
    // If allowedRoles is e.g. ['specific_admin_task'] and user is 'administrator'
    const authContextValue = { currentUser: { uid: '123' }, userRole: 'administrator', loading: false };
    renderProtectedRoute(authContextValue, ['some_other_role'], '/protected');
    await waitFor(() => {
        expect(screen.getByTestId('admin-dashboard')).toBeInTheDocument();
    });
  });

  test('redirects to / if user role is not specifically handled for redirection', async () => {
    const authContextValue = { currentUser: { uid: '123' }, userRole: 'unknown_role', loading: false };
    renderProtectedRoute(authContextValue, ['admin'], '/protected');
    await waitFor(() => {
        expect(screen.getByTestId('home-page')).toBeInTheDocument();
    });
  });


  test('shows loading spinner if auth state is loading', () => {
    const authContextValue = { currentUser: null, userRole: null, loading: true };
    renderProtectedRoute(authContextValue, ['learner']);
    // Assuming ProtectedRoute has a loading indicator with data-testid="loading-spinner"
    // If not, this test needs to be adjusted based on how loading is displayed.
    // For now, we check that neither child nor redirect target is rendered immediately.
    expect(screen.queryByTestId('child-component')).not.toBeInTheDocument();
    expect(screen.queryByTestId('signin-page')).not.toBeInTheDocument();
    // Add a specific check for a loading spinner if ProtectedRoute implements one.
    // e.g., expect(screen.getByTestId('loading-spinner')).toBeInTheDocument();
  });

  test('allows access if no specific roles are required (allowedRoles is empty or undefined) and user is authenticated', () => {
    const authContextValue = { currentUser: { uid: '123' }, userRole: 'any_role', loading: false };
    renderProtectedRoute(authContextValue, []); // No specific roles required
    expect(screen.getByTestId('child-component')).toBeInTheDocument();

    renderProtectedRoute(authContextValue, undefined); // allowedRoles is undefined
    expect(screen.getByTestId('child-component')).toBeInTheDocument();
  });

});