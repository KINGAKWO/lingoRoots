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
    // Role selection is removed, defaults to 'learner' in AuthContext
    // fireEvent.change(screen.getByLabelText(/select your role/i), { target: { value: formData.role } }); 
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
    // expect(screen.getByLabelText(/select your role/i)).toBeInTheDocument(); // Role field removed
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
    // expect(screen.getByLabelText(/select your role/i).value).toBe('Learner'); // Role field removed
    expect(screen.getByLabelText(/i agree to the/i).checked).toBe(true);
  });

  test('calls signup function on valid submission', async () => {
    renderComponent();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockSignupFn).toHaveBeenCalledWith(
        'test@example.com',
        'password123',
        'learner', // Role is hardcoded to 'learner' in SignUp.js
        {
          firstName: 'Test',
          lastName: 'User',
          primaryLanguageInterest: 'Duala',
          displayName: 'Test User'
        }
      );
    });
    await waitFor(() => {
      expect(toast.success).toHaveBeenCalledWith('Account created successfully! Redirecting...');
    });
    // Navigation is handled by App.js or ProtectedRoutes
    // expect(mockNavigate).toHaveBeenCalledWith('/'); // Or appropriate route
    expect(screen.queryByText(/failed to create an account/i)).not.toBeInTheDocument();
  });

  test('shows error and toast if terms are not agreed', () => { // Added toast check
    renderComponent();
    fillForm({ agreedToTerms: false }); // Override default to not agree
    // Manually uncheck if fillForm checked it by default due to its logic
    const termsCheckbox = screen.getByLabelText(/i agree to the/i);
    if (termsCheckbox.checked) {
        fireEvent.click(termsCheckbox); 
    }
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByText('You must agree to the terms and conditions.')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('You must agree to the terms and conditions.');
    expect(mockSignupFn).not.toHaveBeenCalled();
  });

  test('submit button should be enabled when form is partially filled but not necessarily valid yet', () => {
    renderComponent();
    // Fill only some fields, button should still be enabled as validation is on submit
    fireEvent.change(screen.getByLabelText(/first name/i), { target: { value: 'Test' } });
    fireEvent.change(screen.getByLabelText(/email address/i), { target: { value: 'test@example.com' } });
    const createAccountButton = screen.getByRole('button', { name: /create account/i });
    expect(createAccountButton).not.toBeDisabled();
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
    expect(mockSignupFn).not.toHaveBeenCalled();
  });

  test('shows error and toast for password less than 8 characters', () => { // Added toast check
    renderComponent();
    fillForm({ password: 'short' });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    expect(screen.getByText('Password must be at least 8 characters long.')).toBeInTheDocument();
    expect(toast.error).toHaveBeenCalledWith('Password must be at least 8 characters long.');
    expect(mockSignupFn).not.toHaveBeenCalled();
  });

  test('shows specific error and toast for email already in use from Firebase', async () => {
    mockSignupFn.mockRejectedValueOnce({ code: 'auth/email-already-in-use' });
    renderComponent();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText('This email address is already in use. Please try another.')).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith('This email address is already in use. Please try another.');
    });
  });

  test('shows specific error and toast for invalid email format from Firebase', async () => {
    mockSignupFn.mockRejectedValueOnce({ code: 'auth/invalid-email' });
    renderComponent();
    fillForm({ email: 'invalidemail' });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText('Please enter a valid email address.')).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith('Please enter a valid email address.');
    });
  });

  test('shows specific error and toast for weak password from Firebase', async () => {
    mockSignupFn.mockRejectedValueOnce({ code: 'auth/weak-password' });
    renderComponent();
    // Ensure client-side password length validation passes before this Firebase error is tested
    fillForm({ password: 'weakpasswordbutlongenough' }); 
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText('The password is too weak. Please choose a stronger password.')).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith('The password is too weak. Please choose a stronger password.');
    });
  });

  test('shows generic error and toast for other Firebase errors', async () => {
    mockSignupFn.mockRejectedValueOnce({ code: 'auth/some-other-error' });
    renderComponent();
    fillForm();
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    await waitFor(() => {
      expect(screen.getByText('Failed to create an account. Please try again later.')).toBeInTheDocument();
      expect(toast.error).toHaveBeenCalledWith('Failed to create an account. Please try again later.');
    });
  });

  test('form submission is prevented if a required field (e.g., email) is empty (due to HTML5 required attribute)', () => {
    renderComponent();
    // Fill form but leave email empty
    fillForm({ 
      firstName: 'Test', 
      lastName: 'User', 
      email: '', // Empty email
      password: 'password123', 
      primaryLanguage: 'Duala',
      agreedToTerms: true 
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));
    // HTML5 validation should prevent submission, so signup function is not called.
    expect(mockSignupFn).not.toHaveBeenCalled();
    // Optionally, check for a browser validation message if possible, though this is hard with JSDOM.
    // Or, if the component has its own pre-submission validation that shows an error:
    // expect(screen.getByText(/email is required/i)).toBeInTheDocument();
  });

  // Integration test aspects (simulating Firebase Emulator interactions)
  // These would typically involve more setup, potentially a separate test suite or file
  // For now, we're focusing on unit/component tests with mocks.

  // Example: Test that Firestore document is created (conceptual, relies on AuthContext mock)
  test('successful signup should trigger Firestore document creation via AuthContext', async () => {
    mockSignupFn.mockResolvedValue({ user: { uid: 'new-user-uid', email: 'new@example.com' } });
    renderComponent();
    fillForm({
      firstName: 'New',
      lastName: 'User',
      email: 'new@example.com',
      password: 'password1234',
      primaryLanguage: 'Bassa',
    });
    fireEvent.click(screen.getByRole('button', { name: /create account/i }));

    await waitFor(() => {
      expect(mockSignupFn).toHaveBeenCalledWith(
        'new@example.com',
        'password1234',
        'learner',
        expect.objectContaining({
          firstName: 'New',
          lastName: 'User',
          primaryLanguageInterest: 'Bassa',
          displayName: 'New User'
        })
      );
    });
    // The actual Firestore call (setDoc) is within AuthContext's signup, which is mocked.
    // The AuthContext.test.js would verify that setDoc is called correctly.
  });
});