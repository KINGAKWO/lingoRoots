import React from 'react';
import { render, act, waitFor } from '@testing-library/react';
import { AuthProvider, useAuth } from './AuthContext';

// Mock Firebase services
const mockUser = {
  uid: 'test-uid',
  email: 'test@example.com',
  getIdTokenResult: jest.fn(() => Promise.resolve({ claims: { role: 'learner' } })),
};

const mockUserCredential = {
  user: mockUser,
};

const mockCreateUserWithEmailAndPassword = jest.fn();
const mockSignInWithEmailAndPassword = jest.fn();
const mockSignOut = jest.fn();
const mockOnAuthStateChanged = jest.fn();
const mockGetIdTokenResult = jest.fn(() => Promise.resolve({ claims: { role: 'learner' } }));

const mockDoc = jest.fn();
const mockSetDoc = jest.fn(() => Promise.resolve());
const mockGetDoc = jest.fn();
const mockServerTimestamp = jest.fn(() => 'mock-timestamp');

jest.mock('../services/firebase', () => ({
  auth: {},
  db: {},
}));

jest.mock('firebase/auth', () => ({
  getAuth: jest.fn(() => ({})),
  createUserWithEmailAndPassword: (...args) => mockCreateUserWithEmailAndPassword(...args),
  signInWithEmailAndPassword: (...args) => mockSignInWithEmailAndPassword(...args),
  signOut: (...args) => mockSignOut(...args),
  onAuthStateChanged: (...args) => mockOnAuthStateChanged(...args),
  getIdTokenResult: (...args) => mockGetIdTokenResult(...args),
}));

jest.mock('firebase/firestore', () => ({
  getFirestore: jest.fn(() => ({})),
  doc: (...args) => mockDoc(...args),
  setDoc: (...args) => mockSetDoc(...args),
  getDoc: (...args) => mockGetDoc(...args),
  serverTimestamp: (...args) => mockServerTimestamp(...args),
}));

// Helper component to consume the context
const TestConsumerComponent = () => {
  const auth = useAuth();
  if (auth.loading) return <div>Loading...</div>;
  return (
    <div>
      <div data-testid="user">{auth.user ? auth.user.email : 'No User'}</div>
      <div data-testid="role">{auth.role || 'No Role'}</div>
      <button onClick={() => auth.signup('test@example.com', 'password123', 'learner', { displayName: 'Test User' })}>Sign Up</button>
      <button onClick={() => auth.login('test@example.com', 'password123')}>Log In</button>
      <button onClick={() => auth.logout()}>Log Out</button>
    </div>
  );
};

describe('AuthContext', () => {
  beforeEach(() => {
    jest.clearAllMocks();
    // Mock onAuthStateChanged to immediately call the callback with null (logged out)
    // and allow tests to trigger it with a user
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(null); // Initial state: no user
      return jest.fn(); // Return an unsubscribe function
    });
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ role: 'learner' }) });
  });

  test('initial state is loading, then no user and no role', async () => {
    let getByText, queryByTestId;
    act(() => {
      const { getByText: gbt, queryByTestId: qbtid } = render(
        <AuthProvider>
          <TestConsumerComponent />
        </AuthProvider>
      );
      getByText = gbt;
      queryByTestId = qbtid;
    });

    expect(getByText('Loading...')).toBeInTheDocument();

    await waitFor(() => {
      expect(queryByTestId('user').textContent).toBe('No User');
      expect(queryByTestId('role').textContent).toBe('No Role');
    });
  });

  describe('signup', () => {
    test('successful signup sets user, role, and calls Firestore', async () => {
      mockCreateUserWithEmailAndPassword.mockResolvedValue(mockUserCredential);
      mockGetIdTokenResult.mockResolvedValue({ claims: { role: 'learner' } }); // For role from claims
      // Simulate onAuthStateChanged being called with the new user
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUserCredential.user);
        return jest.fn();
      });

      const { getByTestId, getByText } = render(
        <AuthProvider>
          <TestConsumerComponent />
        </AuthProvider>
      );

      await waitFor(() => expect(getByText('Sign Up')).toBeInTheDocument()); // Wait for loading to finish

      act(() => {
        fireEvent.click(getByText('Sign Up'));
      });

      await waitFor(() => {
        expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'test@example.com', 'password123');
      });
      await waitFor(() => {
        expect(mockSetDoc).toHaveBeenCalledWith(
          undefined, // doc() returns undefined in mock
          {
            uid: 'test-uid',
            email: 'test@example.com',
            displayName: 'Test User',
            role: 'learner',
            createdAt: 'mock-timestamp',
          }
        );
      });
      await waitFor(() => {
        expect(getByTestId('user').textContent).toBe('test@example.com');
        expect(getByTestId('role').textContent).toBe('learner');
      });
    });

    test('signup failure', async () => {
      const signupError = new Error('Email already in use');
      signupError.code = 'auth/email-already-in-use';
      mockCreateUserWithEmailAndPassword.mockRejectedValue(signupError);

      const { getByText, queryByTestId } = render(
        <AuthProvider>
          <TestConsumerComponent />
        </AuthProvider>
      );
      await waitFor(() => expect(getByText('Sign Up')).toBeInTheDocument());

      await act(async () => {
        try {
          fireEvent.click(getByText('Sign Up'));
          // Wait for the rejection to be processed if necessary
          await new Promise(resolve => setImmediate(resolve)); 
        } catch (e) {
          expect(e.message).toBe('Email already in use');
        }
      });

      await waitFor(() => {
        expect(queryByTestId('user').textContent).toBe('No User');
        expect(queryByTestId('role').textContent).toBe('No Role');
      });
       // Check that signup was called
      expect(mockCreateUserWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'test@example.com', 'password123');
    });
  });

  describe('login', () => {
    test('successful login sets user and role', async () => {
      mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential);
      // Simulate onAuthStateChanged being called with the logged-in user
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUserCredential.user);
        return jest.fn();
      });
      mockGetIdTokenResult.mockResolvedValue({ claims: { role: 'learner' } }); // Role from claims
      mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ role: 'learner' }) }); // Fallback role from Firestore

      const { getByTestId, getByText } = render(
        <AuthProvider>
          <TestConsumerComponent />
        </AuthProvider>
      );
      await waitFor(() => expect(getByText('Log In')).toBeInTheDocument());

      act(() => {
        fireEvent.click(getByText('Log In'));
      });

      await waitFor(() => {
        expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'test@example.com', 'password123');
      });
      await waitFor(() => {
        expect(getByTestId('user').textContent).toBe('test@example.com');
        expect(getByTestId('role').textContent).toBe('learner');
      });
    });

    test('login failure', async () => {
      const loginError = new Error('Wrong password');
      loginError.code = 'auth/wrong-password';
      mockSignInWithEmailAndPassword.mockRejectedValue(loginError);

      const { getByText, queryByTestId } = render(
        <AuthProvider>
          <TestConsumerComponent />
        </AuthProvider>
      );
      await waitFor(() => expect(getByText('Log In')).toBeInTheDocument());

      await act(async () => {
        try {
          fireEvent.click(getByText('Log In'));
          await new Promise(resolve => setImmediate(resolve)); 
        } catch (e) {
          expect(e.message).toBe('Wrong password');
        }
      });

      await waitFor(() => {
        expect(queryByTestId('user').textContent).toBe('No User');
        expect(queryByTestId('role').textContent).toBe('No Role');
      });
      expect(mockSignInWithEmailAndPassword).toHaveBeenCalledWith(expect.anything(), 'test@example.com', 'password123');
    });
  });

  describe('logout', () => {
    test('successful logout clears user and role', async () => {
      // First, simulate a logged-in state
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(mockUserCredential.user); // Simulate user logged in
        return jest.fn();
      });
      mockGetIdTokenResult.mockResolvedValue({ claims: { role: 'learner' } });

      const { getByTestId, getByText } = render(
        <AuthProvider>
          <TestConsumerComponent />
        </AuthProvider>
      );

      // Wait for user to be set
      await waitFor(() => expect(getByTestId('user').textContent).toBe('test@example.com'));
      await waitFor(() => expect(getByTestId('role').textContent).toBe('learner'));

      // Now, set up mocks for logout
      mockSignOut.mockResolvedValue();
      // Simulate onAuthStateChanged being called with null after logout
      mockOnAuthStateChanged.mockImplementation((auth, callback) => {
        callback(null);
        return jest.fn();
      });

      act(() => {
        fireEvent.click(getByText('Log Out'));
      });

      await waitFor(() => expect(mockSignOut).toHaveBeenCalled());
      await waitFor(() => {
        expect(getByTestId('user').textContent).toBe('No User');
        expect(getByTestId('role').textContent).toBe('No Role');
      });
    });
  });

  test('fetches role from Firestore if not in claims', async () => {
    mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential);
    mockGetIdTokenResult.mockResolvedValue({ claims: {} }); // No role in claims
    mockGetDoc.mockResolvedValue({ exists: () => true, data: () => ({ role: 'editor' }) }); // Role from Firestore
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUserCredential.user);
      return jest.fn();
    });

    const { getByTestId, getByText } = render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );
    await waitFor(() => expect(getByText('Log In')).toBeInTheDocument());

    act(() => {
      fireEvent.click(getByText('Log In'));
    });

    await waitFor(() => {
      expect(getByTestId('user').textContent).toBe('test@example.com');
      expect(getByTestId('role').textContent).toBe('editor');
      expect(mockGetDoc).toHaveBeenCalled();
    });
  });

   test('handles case where user document does not exist in Firestore', async () => {
    mockSignInWithEmailAndPassword.mockResolvedValue(mockUserCredential);
    mockGetIdTokenResult.mockResolvedValue({ claims: {} }); // No role in claims
    mockGetDoc.mockResolvedValue({ exists: () => false }); // User doc doesn't exist
    mockOnAuthStateChanged.mockImplementation((auth, callback) => {
      callback(mockUserCredential.user);
      return jest.fn();
    });

    const { getByTestId, getByText } = render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );
    await waitFor(() => expect(getByText('Log In')).toBeInTheDocument());

    act(() => {
      fireEvent.click(getByText('Log In'));
    });

    await waitFor(() => {
      expect(getByTestId('user').textContent).toBe('test@example.com');
      expect(getByTestId('role').textContent).toBe('No Role'); // Or default/guest role if implemented
      expect(mockGetDoc).toHaveBeenCalled();
    });
  });

});

// Minimalistic fireEvent for the test component
const fireEvent = {
  click: (element) => {
    const event = new MouseEvent('click', { bubbles: true });
    element.dispatchEvent(event);
  },
};