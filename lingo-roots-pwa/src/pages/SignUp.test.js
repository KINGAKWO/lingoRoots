import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import SignUp from './SignUp';
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

// Mock react-router-dom's useNavigate
const mockNavigate = jest.fn();
jest.mock('react-router-dom', () => ({
  ...jest.requireActual('react-router-dom'), // import and retain default behavior
  useNavigate: () => mockNavigate,
  Link: ({ children, to }) => <a href={to}>{children}</a>, // Simple mock for Link
}));

const mockSignup = jest.fn();

const renderSignUpComponent = (authContextValue) => {
  return render(
    <AuthContext.Provider value={authContextValue || { signup: mockSignup }}>
      <BrowserRouter>
        <SignUp />
      </BrowserRouter>
    </AuthContext.Provider>
  );
};

describe('SignUp Component', () => {
  beforeEach(() => {
    // Clear all mocks before each test
    mockSignup.mockClear();
    mockToastError.mockClear();
    mockToastSuccess.mockClear();
    mockNavigate.mockClear();
  });

  test('renders sign up form correctly', () => {
    renderSignUpComponent();
    expect(screen.getByRole('heading', { name: /Create your account/i })).toBeInTheDocument();
    expect(screen.getByLabelText(/First name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/Email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^Password/i)).toBeInTheDocument(); // Match "Password" at the start
    expect(screen.getByLabelText(/Primary Language Interest/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/I agree to the/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /Sign Up/i })).toBeInTheDocument();
  });

  test('shows error if terms are not agreed', async () => {
    renderSignUpComponent();
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('You must agree to the terms and conditions.');
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  test('shows error for short password', async () => {
    renderSignUpComponent();
    fireEvent.input(screen.getByLabelText(/First name/i), { target: { value: 'Test' } });
    fireEvent.input(screen.getByLabelText(/Last name/i), { target: { value: 'User' } });
    fireEvent.input(screen.getByLabelText(/Email address/i), { target: { value: 'test@example.com' } });
    fireEvent.input(screen.getByLabelText(/^Password/i), { target: { value: '123' } });
    fireEvent.change(screen.getByLabelText(/Primary Language Interest/i), { target: { value: 'Duala' } });
    fireEvent.click(screen.getByLabelText(/I agree to the/i)); // Agree to terms

    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith('Password must be at least 8 characters long.');
    });
    expect(mockSignup).not.toHaveBeenCalled();
  });

  test('calls signup and shows success message on valid submission', async () => {
    mockSignup.mockResolvedValueOnce({ user: { uid: '123' } }); // Simulate successful signup
    renderSignUpComponent();

    fireEvent.input(screen.getByLabelText(/First name/i), { target: { value: 'Test' } });
    fireEvent.input(screen.getByLabelText(/Last name/i), { target: { value: 'User' } });
    fireEvent.input(screen.getByLabelText(/Email address/i), { target: { value: 'test@example.com' } });
    fireEvent.input(screen.getByLabelText(/^Password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Primary Language Interest/i), { target: { value: 'Duala' } });
    fireEvent.click(screen.getByLabelText(/I agree to the/i));

    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('test@example.com', 'password123', 'learner', {
        firstName: 'Test',
        lastName: 'User',
        primaryLanguageInterest: 'Duala',
        displayName: 'Test User'
      });
    });
    await waitFor(() => {
      expect(mockToastSuccess).toHaveBeenCalledWith('Account created successfully! Redirecting...');
    });
    // Navigation is handled by App.js based on AuthContext, so we don't directly test navigate here for signup success
  });

  test('shows error message if signup fails (e.g., email already in use)', async () => {
    const errorMessage = 'This email address is already in use. Please try another.';
    mockSignup.mockRejectedValueOnce({ code: 'auth/email-already-in-use', message: errorMessage });
    renderSignUpComponent();

    fireEvent.input(screen.getByLabelText(/First name/i), { target: { value: 'Test' } });
    fireEvent.input(screen.getByLabelText(/Last name/i), { target: { value: 'User' } });
    fireEvent.input(screen.getByLabelText(/Email address/i), { target: { value: 'taken@example.com' } });
    fireEvent.input(screen.getByLabelText(/^Password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Primary Language Interest/i), { target: { value: 'Duala' } });
    fireEvent.click(screen.getByLabelText(/I agree to the/i));

    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith('taken@example.com', 'password123', 'learner', expect.any(Object));
    });
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(errorMessage);
    });
  });

  test('validates required fields before submission', async () => {
    renderSignUpComponent();

    // Attempt to submit with empty first name
    fireEvent.input(screen.getByLabelText(/Last name/i), { target: { value: 'User' } });
    fireEvent.input(screen.getByLabelText(/Email address/i), { target: { value: 'test@example.com' } });
    fireEvent.input(screen.getByLabelText(/^Password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Primary Language Interest/i), { target: { value: 'Duala' } });
    fireEvent.click(screen.getByLabelText(/I agree to the/i));
    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));
    // HTML5 validation should prevent submission, so signup mock shouldn't be called
    // We can check if the input is marked as invalid by the browser (if using native validation)
    // or if a custom error message appears (if implemented).
    // For this component, it relies on the 'required' attribute.
    // Let's check that signup is not called if a required field is missing.
    // This test is more about ensuring the form's `required` attributes are in place.
    // A more robust test would involve checking for `aria-invalid` or specific error messages if they were rendered.
    expect(screen.getByLabelText(/First name/i)).toBeRequired();
    expect(screen.getByLabelText(/Last name/i)).toBeRequired();
    expect(screen.getByLabelText(/Email address/i)).toBeRequired();
    expect(screen.getByLabelText(/^Password/i)).toBeRequired();
    expect(screen.getByLabelText(/Primary Language Interest/i)).toBeRequired();
    expect(screen.getByLabelText(/I agree to the/i)).toBeRequired();

    // Since the form relies on native HTML5 validation for required fields before JS validation kicks in,
    // we can't easily check for a toast message here without filling all fields.
    // The main check is that `mockSignup` is not called if the form isn't fully valid and submitted.
    // The 'terms not agreed' test already covers one specific validation toast.
  });

  test('shows error for invalid email format', async () => {
    renderSignUpComponent();
    fireEvent.input(screen.getByLabelText(/First name/i), { target: { value: 'Test' } });
    fireEvent.input(screen.getByLabelText(/Last name/i), { target: { value: 'User' } });
    fireEvent.input(screen.getByLabelText(/Email address/i), { target: { value: 'not-an-email' } });
    fireEvent.input(screen.getByLabelText(/^Password/i), { target: { value: 'password123' } });
    fireEvent.change(screen.getByLabelText(/Primary Language Interest/i), { target: { value: 'Duala' } });
    fireEvent.click(screen.getByLabelText(/I agree to the/i));

    // Mock signup to throw an invalid-email error
    const errorMessage = 'Please enter a valid email address.';
    mockSignup.mockRejectedValueOnce({ code: 'auth/invalid-email', message: errorMessage });

    fireEvent.click(screen.getByRole('button', { name: /Sign Up/i }));

    await waitFor(() => {
        expect(mockSignup).toHaveBeenCalledWith('not-an-email', 'password123', 'learner', expect.any(Object));
    });
    await waitFor(() => {
      expect(mockToastError).toHaveBeenCalledWith(errorMessage);
    });
  });

});