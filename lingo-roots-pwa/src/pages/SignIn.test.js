import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignIn from './SignIn';
import { AuthContext } from '../context/AuthContext';
import { BrowserRouter } from 'react-router-dom'; // To wrap component that uses Link

// Mock react-hot-toast
const mockToastError = jest.fn();
const mockToastSuccess = jest.fn();
jest.mock('react-hot-toast', () => ({
  __esModule: true,
  default: {
    error: mockToastError,
    success: mockToastSuccess,
  },
}));

// Mock react-router-dom's useNavigate and Link
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>, // Simple mock for Link
}));

const mockLogin = jest.fn();

const renderSignInComponent = (authContextValue) => {
  return render(
    <AuthContext.Provider value={authContextValue || { login: mockLogin }}>
      <BrowserRouter>
        <SignIn />
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('SignIn Component', () => {
  beforeEach(() => {
    mockLogin.mockClear();
    mockToastError.mockClear();
    mockToastSuccess.mockClear();
    mockNavigate.mockClear();
  });

  test('renders sign in form correctly', () => {
    renderSignInComponent();
    expect(screen.getByRole('heading', { name: /Welcome back/i })).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/Password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign In/i })).toBeInTheDocument();
    expect(screen.getByText(/Forgot your password\?/i)).toBeInTheDocument();
    expect(screen.getByText(/Don't have an account\?/i)).toBeInTheDocument();
  });

  test('calls login and shows success message on valid submission', async () => {
    mockLogin.mockResolvedValueOnce({ user: { uid: '123', email: 'test@example.com' } });
    renderSignInComponent();

    fireEvent.input(screen.getByPlaceholderText(/Email address/i), { target: { value: 'test@example.com' } });
    fireEvent.input(screen.getByPlaceholderText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Signed in successfully! Redirecting...');
    });
    // Navigation is handled by App.js based on AuthContext, so we don't directly test navigate here for signin success
  });

  test('shows error message for invalid credentials (user-not-found)', async () => {
    const errorMessage = 'Invalid email or password. Please try again.';
    mockLogin.mockRejectedValueOnce({ code: 'auth/user-not-found', message: 'User not found' });
    renderSignInComponent();

    fireEvent.input(screen.getByPlaceholderText(/Email address/i), { target: { value: 'wrong@example.com' } });
    fireEvent.input(screen.getByPlaceholderText(/Password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('wrong@example.com', 'wrongpassword');
    });
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(errorMessage);
      expect(screen.getByText(errorMessage)).toBeInTheDocument(); // Check for inline error
    });
  });

  test('shows error message for invalid credentials (wrong-password)', async () => {
    const errorMessage = 'Invalid email or password. Please try again.';
    mockLogin.mockRejectedValueOnce({ code: 'auth/wrong-password', message: 'Wrong password' });
    renderSignInComponent();

    fireEvent.input(screen.getByPlaceholderText(/Email address/i), { target: { value: 'test@example.com' } });
    fireEvent.input(screen.getByPlaceholderText(/Password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'wrongpassword');
    });
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(errorMessage);
      expect(screen.getByText(errorMessage)).toBeInTheDocument(); // Check for inline error
    });
  });

  test('shows error message for invalid email format', async () => {
    const errorMessage = 'Please enter a valid email address.';
    // This error is typically caught by Firebase if the email format is syntactically incorrect
    mockLogin.mockRejectedValueOnce({ code: 'auth/invalid-email', message: 'Invalid email' });
    renderSignInComponent();

    fireEvent.input(screen.getByPlaceholderText(/Email address/i), { target: { value: 'not-an-email' } });
    fireEvent.input(screen.getByPlaceholderText(/Password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /Sign In/i }));

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('not-an-email', 'password123');
    });
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(errorMessage);
      expect(screen.getByText(errorMessage)).toBeInTheDocument(); // Check for inline error
    });
  });

  test('submit button is enabled even with empty fields (validation on submit)', () => {
    renderSignInComponent();
    const signInButton = screen.getByRole('button', { name: /Sign In/i });
    expect(signInButton).not.toBeDisabled();

    fireEvent.input(screen.getByPlaceholderText(/Email address/i), { target: { value: 'test@example.com' } });
    expect(signInButton).not.toBeDisabled(); // Still enabled
  });

  test('required attribute validation for email and password fields', () => {
    renderSignInComponent();
    expect(screen.getByPlaceholderText(/Email address/i)).toBeRequired();
    expect(screen.getByPlaceholderText(/Password/i)).toBeRequired();
  });

});