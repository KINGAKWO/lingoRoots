import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import SignIn from './SignIn';
import { useAuth } from '../context/AuthContext';

// Mock useAuth
jest.mock('../context/AuthContext', () => ({
  useAuth: jest.fn(),
}));

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
}));

describe('SignIn Component', () => {
  let mockLogin;

  beforeEach(() => {
    mockLogin = jest.fn();
    useAuth.mockReturnValue({
      login: mockLogin,
      currentUser: null, // Assuming no user is logged in initially
    });
    mockNavigate.mockClear();
  });

  const renderComponent = () => {
    render(
      <Router>
        <SignIn />
      </Router>
    );
  };

  test('renders sign-in form correctly', () => {
    renderComponent();
    expect(screen.getByPlaceholderText(/email address/i)).toBeInTheDocument();
    expect(screen.getByPlaceholderText(/password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign in/i })).toBeInTheDocument();
    expect(screen.getByText(/don't have an account\?/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign up/i })).toHaveAttribute('href', '/signup');
    expect(screen.getByRole('link', { name: /forgot your password\?/i })).toHaveAttribute('href', '/forgot-password');
  });

  test('allows typing in email and password fields', () => {
    renderComponent();
    const emailInput = screen.getByPlaceholderText(/email address/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });

    expect(emailInput.value).toBe('test@example.com');
    expect(passwordInput.value).toBe('password123');
  });

  test('calls login function on valid submission', async () => {
    renderComponent();
    const emailInput = screen.getByPlaceholderText(/email address/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const signInButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    fireEvent.click(signInButton);

    await waitFor(() => {
      expect(mockLogin).toHaveBeenCalledWith('test@example.com', 'password123');
    });
    // Assuming successful login doesn't show an error
    expect(screen.queryByText(/invalid email or password/i)).not.toBeInTheDocument();
  });

  test('shows error for invalid email format from Firebase', async () => {
    mockLogin.mockRejectedValueOnce({ code: 'auth/invalid-email', message: 'Invalid email' });
    renderComponent();
    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: 'invalidemail' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
    });
  });

  test('shows error for user not found from Firebase', async () => {
    mockLogin.mockRejectedValueOnce({ code: 'auth/user-not-found', message: 'User not found' });
    renderComponent();
    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: 'nonexistent@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password. Please try again.')).toBeInTheDocument();
    });
  });

  test('shows error for wrong password from Firebase', async () => {
    mockLogin.mockRejectedValueOnce({ code: 'auth/wrong-password', message: 'Wrong password' });
    renderComponent();
    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password. Please try again.')).toBeInTheDocument();
    });
  });

   test('shows error for invalid credentials from Firebase', async () => {
    mockLogin.mockRejectedValueOnce({ code: 'auth/invalid-credential', message: 'Invalid credential' });
    renderComponent();
    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password. Please try again.')).toBeInTheDocument();
    });
  });

  test('shows generic error for other Firebase errors', async () => {
    mockLogin.mockRejectedValueOnce({ code: 'auth/some-other-error', message: 'Some other error' });
    renderComponent();
    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Failed to sign in. Please try again later.')).toBeInTheDocument();
    });
  });

  test('does not submit if email is not provided', () => {
    renderComponent();
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    // Check if the native validation prevents submission or if login is not called
    // For this test, we'll assume the browser's `required` attribute handles it, or check mockLogin was not called
    expect(mockLogin).not.toHaveBeenCalled();
  });

  test('does not submit if password is not provided', () => {
    renderComponent();
    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));
    expect(mockLogin).not.toHaveBeenCalled();
  });
});