import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import { MemoryRouter } from 'react-router-dom';
import { AuthProvider } from '../../context/AuthContext'; // Import AuthProvider directly
import SignUp from '../SignUp';
import { toast } from 'react-hot-toast';

// Mock AuthContext values
const mockSignup = jest.fn();

// Mock react-hot-toast
jest.mock('react-hot-toast', () => ({
  success: jest.fn(),
  error: jest.fn(),
}));

// Mock useNavigate from react-router-dom
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'),
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>,
}));

const renderSignUp = (authContextValue) => {
  // Default mock values for AuthContext
  const defaultAuthContext = {
    signup: mockSignup,
    currentUser: null,
    loading: false,
    userRole: null,
  };

  return render(
    <MemoryRouter initialEntries={['/signup']}>
      {/* Directly use AuthProvider and pass mocked values through a custom hook mock if needed, or rely on default values */}
      {/* For simplicity, we'll mock useAuth directly in tests where specific context values are needed */}
      <AuthProvider value={{ ...defaultAuthContext, ...authContextValue }}>
        <SignUp />
      </AuthProvider>
    </MemoryRouter>
  );
};

describe('SignUp Page', () => {
  beforeEach(() => {
    mockSignup.mockClear();
    toast.success.mockClear();
    toast.error.mockClear();
    mockNavigate.mockClear();

    // Mock useAuth for each test to provide context values
    jest.spyOn(require('../../context/AuthContext'), 'useAuth').mockImplementation(() => ({
      signup: mockSignup,
      currentUser: null,
      loading: false,
      userRole: null,
    }));
  });

  afterEach(() => {
    jest.restoreAllMocks();
  });

  test('renders SignUp form correctly', () => {
    renderSignUp();
    expect(screen.getByLabelText(/full name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password$/i)).toBeInTheDocument(); // Match exact 'Password'
    expect(screen.getByLabelText(/confirm password/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /sign up/i })).toBeInTheDocument();
    expect(screen.getByText(/already have an account\? sign in/i)).toBeInTheDocument();
  });

  test('allows user to type in form fields', () => {
    renderSignUp();
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });

    expect(screen.getByLabelText(/full name/i).value).toBe('Test User');
    expect(screen.getByLabelText(/email address/i).value).toBe('test@example.com');
    expect(screen.getByLabelText(/^password$/i).value).toBe('password123');
    expect(screen.getByLabelText(/confirm password/i).value).toBe('password123');
  });

  test('calls signup function on form submission with valid data', async () => {
    mockSignup.mockResolvedValueOnce(); // Simulate successful signup
    renderSignUp();

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('test@example.com', 'password123', { fullName: 'Test User' });
    });
    // Navigation is handled by AuthContext or ProtectedRoute
  });

  test('shows error toast if passwords do not match', async () => {
    renderSignUp();
    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password124' } }); // Mismatch
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Passwords do not match.');
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  test('shows error toast if signup fails (e.g., email already in use)', async () => {
    mockSignup.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });
    renderSignUp();

    fireEvent.change(screen.getByLabelText(/full name/i), { target: { value: 'Test User' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    fireEvent.change(screen.getByLabelText(/^password$/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/confirm password/i), { target: { value: 'password123' } });
    fireEvent.click(screen.getByRole('button', { name: /sign up/i }));

    await waitFor(() => {
      expect(toast.error).toHaveBeenCalledWith('Email is already in use. Please try another email.');
    });
  });

  test('redirects to home if user is already authenticated', () => {
    jest.spyOn(require('../../context/AuthContext'), 'useAuth').mockImplementation(() => ({
        signup: mockSignup,
        currentUser: { uid: '123' }, // Simulate authenticated user
        loading: false,
        userRole: 'learner',
      }));
    renderSignUp();
    expect(mockNavigate).toHaveBeenCalledWith('/learn');
  });

  test('displays loading state when auth context is loading', () => {
    jest.spyOn(require('../../context/AuthContext'), 'useAuth').mockImplementation(() => ({
        signup: mockSignup,
        currentUser: null,
        loading: true, // Simulate loading state
        userRole: null,
      }));
    renderSignUp();
    expect(screen.getByTestId('loading-spinner')).toBeInTheDocument(); // Assuming SignUp has a data-testid="loading-spinner"
  });

});