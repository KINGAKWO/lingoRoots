import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext';
import ForgotPassword from '../ForgotPassword';
import { toast } from 'react-hot-toast';

// Mock AuthContext values
const mockSendPasswordReset = jest.fn();

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock useNavigate from react-router-dom (though not directly used by ForgotPassword for redirection on auth state)
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate, // Included for completeness if any Link component triggers navigation
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

const renderForgotPassword = (authContextValue) => {
  const defaultAuthContext = {
    sendPasswordReset: mockSendPasswordReset,
    currentUser: null, // ForgotPassword should be accessible when not logged in
    loading: false,
  };

  return render(
    <MemoryRouter initialEntries={['/forgot-password']}>
      <AuthProvider value={{ ...defaultAuthContext, ...authContextValue }}>
        <ForgotPassword />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('ForgotPassword Page', () => {
  beforeEach(() => {
    mockSendPasswordReset.mockClear();
    toast.success.mockClear();
    toast.error.mockClear();
    mockNavigate.mockClear();

    // Mock useAuth for each test
    jest.spyOn(require('../../context/AuthContext'), 'useAuth').mockImplementation(() => ({
      sendPasswordReset: mockSendPasswordReset,
      currentUser: null,
      loading: false,
      userRole: null,
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders ForgotPassword form correctly', () => {
    renderForgotPassword();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /send reset email/i })).toBeInTheDocument();
    expect(screen.getByText(/remember your password\? sign in/i)).toBeInTheDocument();
  });

  test('allows user to type in email field', () => {
    renderForgotPassword();
    const emailInput = screen.getByLabelText(/email address/i);
    fireEvent.change(emailInput, { target: { value: 'test@example.com' } });
    expect(emailInput.value).toBe('test@example.com');
  });

  test('calls sendPasswordReset function on form submission with valid email', async () => {
    mockSendPasswordReset.mockResolvedValueOnce(); // Simulate successful email sending
    renderForgotPassword();

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset email/i }));

    await waitFor(() => {
      expect(mockSendPasswordReset).toHaveBeenCalledWith('test@example.com');
    });
    await waitFor(() => {
        expect(toast.success).toHaveBeenCalledWith('Password reset email sent! Please check your inbox.');
    });
  });

  test('shows error toast if email is invalid or not found', async () => {
    mockSendPasswordReset.mockRejectedValueOnce({ code: 'auth/user-not-found' });
    renderForgotPassword();

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'nonexistent@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset email/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email not found. Please check the email address.');
    });
  });

  test('shows generic error toast for other Firebase errors', async () => {
    mockSendPasswordReset.mockRejectedValueOnce({ code: 'auth/too-many-requests' });
    renderForgotPassword();

    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.click(screen.getByRole('button', { name: /send reset email/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('An error occurred. Please try again later.');
    });
  });

  test('redirects to home if user is already authenticated', () => {
    // Although ForgotPassword is for unauthenticated users, test the redirect if somehow accessed by an auth user
    jest.spyOn(require('../../context/AuthContext'), 'useAuth').mockImplementation(() => ({
      sendPasswordReset: mockSendPasswordReset,
      currentUser: { uid: '123' }, // Simulate authenticated user
      loading: false,
      userRole: 'learner',
    }));
    renderForgotPassword();
    // Expect navigation to the user's default page based on role
    expect(mockNavigate).toHaveBeenCalledWith('/learn'); 
  });

  test('displays loading state when auth context is loading (though less common for this page)', () => {
    jest.spyOn(require('../../context/AuthContext'), 'useAuth').mockImplementation(() => ({
      sendPasswordReset: mockSendPasswordReset,
      currentUser: null,
      loading: true, // Simulate loading state
      userRole: null,
    }));
    renderForgotPassword();
    // Assuming ForgotPassword page also has a loading spinner or indicator
    // If not, this test might need adjustment or removal based on actual component behavior
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument(); 
  });

});