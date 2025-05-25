import React from 'react';
import { render, screen, fireEvent, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { BrowserRouter as Router } from 'react-router-dom';
import SignUp from './SignUp';
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

describe('SignUp Component', () => {
  let mockSignup;

  beforeEach(() => {
    mockSignup = jest.fn();
    useAuth.mockReturnValue({
      signup: mockSignup,
      currentUser: null, // Assuming no user is logged in initially
    });
    mockNavigate.mockClear();
  });

  const renderComponent = () => {
    render(
      <Router>
        <SignUp />
      </Router>
    );
  };

  const fillForm = (data = {}) => {
    const defaults = {
      firstName: 'Test',
      lastName: 'User',
      email: 'test@example.com',
      password: 'password123',
      primaryLanguage: 'Duala',
      role: 'Learner',
      agreedToTerms: true,
    };
    const formData = { ...defaults, ...data };

    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: formData.firstName } });
    fireEvent.change(screen.getByLabelText(/last name/i), { target: { value: formData.lastName } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: formData.email } });
    fireEvent.change(screen.getByLabelText(/^password/i), { target: { value: formData.password } });
    fireEvent.change(screen.getByLabelText(/primary language interest/i), { target: { value: formData.primaryLanguage } });
    fireEvent.change(screen.getByLabelText(/select your role/i), { target: { value: formData.role } });
    if (formData.agreedToTerms) {
      fireEvent.click(screen.getByLabelText(/i agree to the/i));
    }
  };

  test('renders sign-up form correctly', () => {
    renderComponent();
    expect(screen.getByLabelText(/first name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/last name/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/email address/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/^password/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/primary language interest/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/select your role/i)).toBeInTheDocument();
    expect(screen.getByLabelText(/i agree to the/i)).toBeInTheDocument();
    expect(screen.getByRole('button', { name: /create account/i })).toBeInTheDocument(); // Assuming button text is 'Create Account'
    expect(screen.getByText(/already have an account\?/i)).toBeInTheDocument();
    expect(screen.getByRole('link', { name: /sign in/i })).toHaveAttribute('href', '/signin');
  });

  test('allows typing in all fields', () => {
    renderComponent();
    fillForm();
    expect(screen.getByLabelText(/first name/i).value).toBe('Test');
    expect(screen.getByLabelText(/last name/i).value).toBe('User');
    expect(screen.getByLabelText(/email address/i).value).toBe('test@example.com');
    expect(screen.getByLabelText(/^password/i).value).toBe('password123');
    expect(screen.getByLabelText(/primary language interest/i).value).toBe('Duala');
    expect(screen.getByLabelText(/select your role/i).value).toBe('Learner');
    expect(screen.getByLabelText(/i agree to the/i).checked).toBe(true);
  });

  test('calls signup function on valid submission', async () => {
    renderComponent();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockSignup).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'Learner',
        {
          firstName: 'Test',
          lastName: 'User',
          primaryLanguageInterest: 'Duala',
          displayName: 'Test User'
        }
      );
    });
    expect(screen.queryByText(/failed to create an account/i)).not.toBeInTheDocument();
  });

  test('shows error if terms are not agreed', () => {
    renderComponent();
    fillForm({ agreedToTerms: false }); // Override default to not agree
    // Manually uncheck if fillForm checked it by default due to its logic
    const termsCheckbox = screen.getByLabelText(/i agree to the/i);
    if (termsCheckbox.checked) {
        fireEvent.click(termsCheckbox); 
    }
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByText('You must agree to the terms and conditions.')).toBeInTheDocument();
    expect(mockSignup).not.toHaveBeenCalled();
  });

  test('shows error for password less than 8 characters', () => {
    renderComponent();
    fillForm({ password: 'short' });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByText('Password must be at least 8 characters long.')).toBeInTheDocument();
    expect(mockSignup).not.toHaveBeenCalled();
  });

  test('shows error for email already in use from Firebase', async () => {
    mockSignup.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });
    renderComponent();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText('This email address is already in use. Please try another.')).toBeInTheDocument();
    });
  });

  test('shows error for invalid email format from Firebase', async () => {
    mockSignup.mockRejectedValueOnce({ code: 'auth/invalid-email' });
    renderComponent();
    fillForm({ email: 'invalidemail' });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
    });
  });

  test('shows error for weak password from Firebase', async () => {
    mockSignup.mockRejectedValueOnce({ code: 'auth/weak-password' });
    renderComponent();
    fillForm({ password: 'weakpassword' }); // Ensure this password is valid client-side first
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText('The password is too weak. Please choose a stronger password.')).toBeInTheDocument();
    });
  });

  test('shows generic error for other Firebase errors', async () => {
    mockSignup.mockRejectedValueOnce({ code: 'auth/some-other-error' });
    renderComponent();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText('Failed to create an account. Please try again later.')).toBeInTheDocument();
    });
  });

  test('does not submit if required fields are missing (e.g., email)', () => {
    renderComponent();
    fillForm({ email: '' }); // Missing email
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    // Check if the native validation prevents submission or if signup is not called
    expect(mockSignup).not.toHaveBeenCalled();
    // You might also check for a specific error message if your form shows one for empty required fields before Firebase errors
  });
});