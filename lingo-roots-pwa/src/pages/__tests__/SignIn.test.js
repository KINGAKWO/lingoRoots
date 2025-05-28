import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider, useAuth } from '../../context/AuthContext';
import SignIn from '../SignIn';
import { toast } from 'react-hot-toast';

// Mock AuthContext
const mockLogin = jest.fn();
const mockUseAuth = useAuth; // Keep a reference to the original

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock useNavigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // import and retain default behavior
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>, // Simple mock for Link
}));

const renderSignIn = (authContextValue) => {
  return render(
    <MemoryRouter initialEntries={['/signin']}>
      <AuthProvider value={authContextValue || { login: mockLogin, currentUser: null, loading: false }}>
        <SignIn />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('SignIn Page', () => {
  beforeEach(() => {
    // Reset mocks before each test
    mockLogin.mockClear();
    toast.success.mockClear();
    toast.error.mockClear();
    mockNavigate.mockClear();
    // Restore original useAuth and then mock it for each test scenario if needed
    jest.spyOn(require('../../context/AuthContext'), 'useAuth').mockImplementation(() => ({
      login: mockLogin,
      currentUser: null,
      loading: false,
      userRole: null,
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks(); // Restore all mocks after each test
  });

  test('renders SignIn form correctly', () => {
    renderSignIn();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/forgot password/i)).toBeInTheDocument();
    expect(screen.getByText(/don't have an account\? sign up/i)).toBeInTheDocument();
  });

  test('allows user to type in email and password fields', () => {
    renderSignIn();
    const emailInput = screen.getByLabelText(/email address/i);
    const passwordInput = screen.getByLabelText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  test('calls login function on form submission with valid data', async () => {
    mockLogin.mockResolvedValueOnce(); // Simulate successful login
    renderSignIn();

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
    // Navigation is handled by AuthContext or ProtectedRoute, not directly tested here unless login itself navigates
  });

  test('shows error toast if login fails', async () => {
    mockLogin.mockRejectedValueOnce({ code: 'auth/user-not-found' });
    renderSignIn();

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('User not found. Please check your email or sign up.');
    });
  });

  test('shows generic error toast for other Firebase errors', async () => {
    mockLogin.mockRejectedValueOnce({ code: 'auth/network-request-failed' });
    renderSignIn();

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('An error occurred. Please try again.');
    });
  });

  test('redirects to home if user is already authenticated', () => {
    jest.spyOn(require('../../context/AuthContext'), 'useAuth').mockImplementation(() => ({
      login: mockLogin,
      currentUser: { uid: '123' }, // Simulate authenticated user
      loading: false,
      userRole: 'learner',
    }));
    renderSignIn();
    expect(mockNavigate).toHaveBeenCalledWith('/learn'); // Default for learner
  });

   test('redirects to creator dashboard if user is content_creator', () => {
    jest.spyOn(require('../../context/AuthContext'), 'useAuth').mockImplementation(() => ({
      login: mockLogin,
      currentUser: { uid: '123' }, 
      loading: false,
      userRole: 'content_creator',
    }));
    renderSignIn();
    expect(mockNavigate).toHaveBeenCalledWith('/creator-dashboard');
  });

  test('displays loading state when auth context is loading', () => {
    jest.spyOn(require('../../context/AuthContext'), 'useAuth').mockImplementation(() => ({
      login: mockLogin,
      currentUser: null,
      loading: true, // Simulate loading state
      userRole: null,
    }));
    renderSignIn();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument(); // Assuming SignIn has a data-testid="loading-spinner"
  });

});