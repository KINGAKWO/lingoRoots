import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import SignIn from './SignIn';
import { AuthProvider, useAuth } from '../context/AuthContext'; // Import AuthProvider as well for wrapping
import toast from 'react-hot-toast';

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock Firebase services more comprehensively for integration-like tests
const mockLoginFn = jest.fn();

jest.mock('../context/AuthContext', () => {
  const originalModule = jest.requireActual('../context/AuthContext');
  return {
    ...originalModule,
    useAuth: () => ({
      login: mockLoginFn,
      user: null, // Start with no user
      loading: false,
    }),
  };
});

// Mock useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ to, children }) => <a href={to}>{children}</a>, // Simple mock for Link
}));


describe('SignIn Component', () => {
  beforeEach(() => {
    mockLoginFn.mockClear();
    mockNavigate.mockClear();
    toast.success.mockClear();
    toast.error.mockClear();
  });

  const renderComponent = () => {
    // Wrap with AuthProvider if SignIn depends on it directly or indirectly for context
    // For this component, useAuth is mocked, so direct AuthProvider might not be strictly needed
    // unless sub-components rely on it. Assuming direct mock is sufficient here.
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

  test('submit button should be enabled by default', () => {
    renderComponent();
    const signInButton = screen.getByRole('button', { name: /sign in/i });
    expect(signInButton).not.toBeDisabled();
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
      expect(mockLoginFn).toHaveBeenCalledWith('test@example.com', 'password123');
    });
    // Assuming successful login shows a toast message and potentially navigates
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Signed in successfully! Redirecting...');
    });
    // Navigation is handled by App.js or ProtectedRoutes, so direct navigation check here might be redundant
    // if the component itself doesn't call navigate() on success.
    // expect(mockNavigate).toHaveBeenCalledWith('/'); // Or appropriate route
    expect(screen.queryByText(/invalid email or password/i)).not.toBeInTheDocument();
  });

  test('shows specific error and toast for invalid email format from Firebase', async () => {
    mockLoginFn.mockRejectedValueOnce({ code: 'auth/invalid-email', message: 'Invalid email' });
    renderComponent();
    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: 'invalidemail' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith('Please enter a valid email address.');
    });
  });

  test('shows specific error and toast for user not found from Firebase', async () => {
    mockLoginFn.mockRejectedValueOnce({ code: 'auth/user-not-found', message: 'User not found' });
    renderComponent();
    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: 'nonexistent@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password. Please try again.')).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith('Invalid email or password. Please try again.');
    });
  });

  test('shows specific error and toast for wrong password from Firebase', async () => {
    mockLoginFn.mockRejectedValueOnce({ code: 'auth/wrong-password', message: 'Wrong password' });
    renderComponent();
    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password. Please try again.')).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith('Invalid email or password. Please try again.');
    });
  });

   test('shows specific error and toast for invalid credentials from Firebase', async () => {
    mockLoginFn.mockRejectedValueOnce({ code: 'auth/invalid-credential', message: 'Invalid credential' });
    renderComponent();
    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'wrongpassword' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Invalid email or password. Please try again.')).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith('Invalid email or password. Please try again.');
    });
  });

  test('shows generic error and toast for other Firebase errors', async () => {
    mockLoginFn.mockRejectedValueOnce({ code: 'auth/some-other-error', message: 'Some other error' });
    renderComponent();
    fireEvent.change(screen.getByPlaceholderText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByPlaceholderText(/password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign in/i }));

    await waitFor(() => {
      expect(screen.getByText('Failed to sign in. Please try again later.')).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith('Failed to sign in. Please try again later.');
    });
  });

  test('form submission is prevented if email is not provided (due to HTML5 required attribute)', () => {
    renderComponent();
    const emailInput = screen.getByPlaceholderText(/email address/i);
    const passwordInput = screen.getByPlaceholderText(/password/i);
    const signInButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(passwordInput, { target: { value: 'password123' } });
    // Email input is required, so form submission should be blocked by the browser
    // or by custom validation if HTML5 validation is bypassed/not effective in test env.
    // We check that login was not called.
    fireEvent.click(signInButton);
    expect(mockLoginFn).not.toHaveBeenCalled();
    // Optionally, check for validation message if one is displayed by the component itself
    // For example, if using a library like Formik that shows errors:
    // expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });

  test('form submission is prevented if password is not provided (due to HTML5 required attribute)', () => {
    renderComponent();
    const emailInput = screen.getByPlaceholderText(/email address/i);
    const signInButton = screen.getByRole('button', { name: /sign in/i });

    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    fireEvent.click(signInButton);
    expect(mockLoginFn).not.toHaveBeenCalled();
  });

  // Test for button state (disabled/enabled) based on input validity if applicable
  // The current SignIn component does not seem to have explicit logic for disabling the button
  // based on input validity beyond the HTML5 `required` attribute.
  // If such logic were added (e.g., disable button if email format is clearly invalid client-side
  // before submission), tests for that would go here.
});