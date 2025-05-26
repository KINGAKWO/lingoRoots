import React, { useContext } from 'react';
import { render, act, waitFor } from '@testing-library/react';
import '@testing-library/jest-dom';
import { AuthProvider, AuthContext } from './AuthContext'; // Assuming AuthContext is exported
import { auth, db } from '../firebase/firebaseConfig'; // Actual firebaseConfig
import { 
  createUserWithEmailAndPassword, 
  signInWithEmailAndPassword, 
  signOut, 
  onAuthStateChanged,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';

// Mock Firebase services
jest.mock('firebase/auth', () => ({
  createUserWithEmailAndPassword: jest.fn(),
  signInWithEmailAndPassword: jest.fn(),
  signOut: jest.fn(),
  onAuthStateChanged: jest.fn(),
  updateProfile: jest.fn(),
  getAuth: jest.fn(() => ({})) // Mock getAuth if AuthProvider uses it internally
}));

jest.mock('firebase/firestore', () => ({
  doc: jest.fn(),
  setDoc: jest.fn(),
  getDoc: jest.fn(),
  getFirestore: jest.fn(() => ({})) // Mock getFirestore if AuthProvider uses it internally
}));

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


const TestConsumerComponent = () => {
  const authValue = useContext(AuthContext);
  if (!authValue) return <p>No AuthContext value</p>;
  const { currentUser, userRole, loading, signup, login, logout } = authValue;
  return (
    <div>
      <p>Loading: {loading.toString()}</p>
      {currentUser ? (
        <>
          <p>User ID: {currentUser.uid}</p>
          <p>User Email: {currentUser.email}</p>
          <p>User Role: {userRole}</p>
          <button onClick={logout}>Logout</button>
        </>
      ) : (
        <p>No user logged in</p>
      )}
      <button onClick={() => signup('test@example.com', 'password123', 'learner', { displayName: 'Test User' })}>Sign Up</button>
      <button onClick={() => login('test@example.com', 'password123')}>Login</button>
    </div>
  );
};


describe('AuthContext', () => {
  let mockOnAuthStateChangedCallback = null;

  beforeEach(() => {
    jest.clearAllMocks();
    // Capture the onAuthStateChanged callback
    onAuthStateChanged.mockImplementation((auth, callback) => {
      mockOnAuthStateChangedCallback = callback; // Store the callback
      // Simulate initial state (no user)
      // callback(null);
      return jest.fn(); // Return a mock unsubscribe function
    });

    // Default mock implementations
    createUserWithEmailAndPassword.mockResolvedValue({ user: { uid: 'test-uid', email: 'test@example.com', updateProfile: jest.fn() } });
    signInWithEmailAndPassword.mockResolvedValue({ user: { uid: 'test-uid', email: 'test@example.com' } });
    signOut.mockResolvedValue(undefined);
    setDoc.mockResolvedValue(undefined);
    getDoc.mockResolvedValue({ exists: () => true, data: () => ({ role: 'learner', displayName: 'Test User' }) });
    updateProfile.mockResolvedValue(undefined);
  });

  test('initial state has no user and loading is true, then false', async () => {
    let getByText;
    act(() => {
      const { getByText: rGetByText } = render(
        <AuthProvider>
          <TestConsumerComponent />
        </AuthProvider>
      );
      getByText = rGetByText;
    });

    // Initially, loading might be true
    // expect(getByText('Loading: true')).toBeInTheDocument(); // This depends on exact timing

    // Simulate onAuthStateChanged finding no user initially
    act(() => {
      if (mockOnAuthStateChangedCallback) mockOnAuthStateChangedCallback(null);
    });

    await waitFor(() => {
        expect(getByText('Loading: false')).toBeInTheDocument();
    });
    expect(getByText('No user logged in')).toBeInTheDocument();
  });

  test('signup successfully creates user, sets user in context, and creates firestore document', async () => {
    const mockUser = { uid: 'signup-uid', email: 'signup@example.com', displayName: 'Signup User' };
    const mockUserCredentials = { user: { ...mockUser, updateProfile: jest.fn() } };
    createUserWithEmailAndPassword.mockResolvedValueOnce(mockUserCredentials);
    updateProfile.mockResolvedValueOnce(undefined); // Mock for updateProfile call within signup
    getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ role: 'learner', displayName: 'Signup User' }) });

    let authContextValue;
    const TestSignUpComponent = () => {
      authContextValue = useContext(AuthContext);
      return null;
    };

    render(
      <AuthProvider>
        <TestSignUpComponent />
      </AuthProvider>
    );
    
    const additionalData = { firstName: 'Signup', lastName: 'User', primaryLanguageInterest: 'Duala', displayName: 'Signup User' }; // displayName added here
    await act(async () => {
      await authContextValue.signup('signup@example.com', 'password123', 'learner', additionalData);
    });

    expect(createUserWithEmailAndPassword).toHaveBeenCalledWith(auth, 'signup@example.com', 'password123');
    expect(updateProfile).toHaveBeenCalledWith(mockUserCredentials.user, { displayName: 'Signup User' });
    expect(setDoc).toHaveBeenCalledWith(doc(db, 'users', 'signup-uid'), {
      uid: 'signup-uid',
      email: 'signup@example.com',
      role: 'learner',
      displayName: 'Signup User',
      firstName: 'Signup',
      lastName: 'User',
      primaryLanguageInterest: 'Duala',
      createdAt: expect.any(Object), // or specific date mock if needed
    });
    expect(mockToastSuccess).toHaveBeenCalledWith('Account created successfully!');

    // Simulate onAuthStateChanged with the new user
    act(() => {
      if (mockOnAuthStateChangedCallback) mockOnAuthStateChangedCallback(mockUser);
    });
    
    // Re-render with consumer to check context state
    const { getByText } = render(
        <AuthProvider>
            <TestConsumerComponent />
        </AuthProvider>
    );

    // Simulate onAuthStateChanged again for the new render cycle
    act(() => {
        if (mockOnAuthStateChangedCallback) mockOnAuthStateChangedCallback(mockUser);
    });

    await waitFor(() => {
      expect(getByText(`User ID: ${mockUser.uid}`)).toBeInTheDocument();
      expect(getByText(`User Role: learner`)).toBeInTheDocument();
    });
  });

  test('login successfully signs in user and sets user in context', async () => {
    const mockUser = { uid: 'login-uid', email: 'login@example.com', displayName: 'Login User' };
    signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
    getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ role: 'admin', displayName: 'Login User' }) });

    let authContextValue;
    const TestLoginComponent = () => {
      authContextValue = useContext(AuthContext);
      return null;
    };

    render(
      <AuthProvider>
        <TestLoginComponent />
      </AuthProvider>
    );

    await act(async () => {
      await authContextValue.login('login@example.com', 'password123');
    });

    expect(signInWithEmailAndPassword).toHaveBeenCalledWith(auth, 'login@example.com', 'password123');
    expect(mockToastSuccess).toHaveBeenCalledWith('Login successful!');

    // Simulate onAuthStateChanged with the logged-in user
    act(() => {
      if (mockOnAuthStateChangedCallback) mockOnAuthStateChangedCallback(mockUser);
    });

    const { getByText } = render(
        <AuthProvider>
            <TestConsumerComponent />
        </AuthProvider>
    );
    act(() => {
        if (mockOnAuthStateChangedCallback) mockOnAuthStateChangedCallback(mockUser);
    });

    await waitFor(() => {
      expect(getByText(`User ID: ${mockUser.uid}`)).toBeInTheDocument();
      expect(getByText('User Role: admin')).toBeInTheDocument();
    });
  });

  test('logout successfully signs out user and clears user from context', async () => {
    const mockUser = { uid: 'logout-uid', email: 'logout@example.com' };
    // Setup initial logged-in state
    signInWithEmailAndPassword.mockResolvedValueOnce({ user: mockUser });
    getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ role: 'learner' }) });

    let authContextValue;
    const TestLogoutComponent = () => {
      authContextValue = useContext(AuthContext);
      return null;
    };
    render(
      <AuthProvider>
        <TestLogoutComponent />
      </AuthProvider>
    );

    // Simulate login first
    await act(async () => {
      await authContextValue.login('logout@example.com', 'password');
    });
    act(() => {
      if (mockOnAuthStateChangedCallback) mockOnAuthStateChangedCallback(mockUser);
    });

    // Then logout
    await act(async () => {
      await authContextValue.logout();
    });

    expect(signOut).toHaveBeenCalledWith(auth);
    expect(mockToastSuccess).toHaveBeenCalledWith('Logged out successfully.');

    // Simulate onAuthStateChanged with null (logged out)
    act(() => {
      if (mockOnAuthStateChangedCallback) mockOnAuthStateChangedCallback(null);
    });

    const { getByText } = render(
        <AuthProvider>
            <TestConsumerComponent />
        </AuthProvider>
    );
    act(() => {
        if (mockOnAuthStateChangedCallback) mockOnAuthStateChangedCallback(null);
    });

    await waitFor(() => {
      expect(getByText('No user logged in')).toBeInTheDocument();
    });
  });

  test('handles signup failure', async () => {
    createUserWithEmailAndPassword.mockRejectedValueOnce(new Error('Signup failed'));
    let authContextValue;
    const TestErrorComponent = () => {
      authContextValue = useContext(AuthContext);
      return null;
    };
    render(
      <AuthProvider>
        <TestErrorComponent />
      </AuthProvider>
    );

    await act(async () => {
      try {
        await authContextValue.signup('fail@example.com', 'password', 'learner', {displayName: 'Fail User'});
      } catch (e) {
        // Expected error
      }
    });
    expect(mockToastError).toHaveBeenCalledWith('Error creating account: Signup failed');
  });

  test('handles login failure', async () => {
    signInWithEmailAndPassword.mockRejectedValueOnce(new Error('Login failed'));
    let authContextValue;
    const TestErrorComponent = () => {
      authContextValue = useContext(AuthContext);
      return null;
    };
    render(
      <AuthProvider>
        <TestErrorComponent />
      </AuthProvider>
    );
    await act(async () => {
      try {
        await authContextValue.login('fail@example.com', 'password');
      } catch (e) {
        // Expected error
      }
    });
    expect(mockToastError).toHaveBeenCalledWith('Error logging in: Login failed');
  });

  test('fetches user role on auth state change', async () => {
    const mockUser = { uid: 'role-test-uid', email: 'role@example.com', displayName: 'Role User' };
    getDoc.mockResolvedValueOnce({ exists: () => true, data: () => ({ role: 'creator', displayName: 'Role User' }) });

    render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    // Simulate user logging in via onAuthStateChanged
    act(() => {
      if (mockOnAuthStateChangedCallback) mockOnAuthStateChangedCallback(mockUser);
    });

    const { getByText } = render(
        <AuthProvider>
            <TestConsumerComponent />
        </AuthProvider>
    );
    act(() => {
        if (mockOnAuthStateChangedCallback) mockOnAuthStateChangedCallback(mockUser);
    });

    await waitFor(() => {
      expect(getDoc).toHaveBeenCalledWith(doc(db, 'users', mockUser.uid));
      expect(getByText('User Role: creator')).toBeInTheDocument();
    });
  });

  test('handles case where user document does not exist in Firestore', async () => {
    const mockUser = { uid: 'no-doc-uid', email: 'nodoc@example.com', displayName: 'No Doc User' };
    getDoc.mockResolvedValueOnce({ exists: () => false, data: () => null }); // Simulate no document

    render(
      <AuthProvider>
        <TestConsumerComponent />
      </AuthProvider>
    );

    act(() => {
      if (mockOnAuthStateChangedCallback) mockOnAuthStateChangedCallback(mockUser);
    });

    const { getByText, queryByText } = render(
        <AuthProvider>
            <TestConsumerComponent />
        </AuthProvider>
    );
    act(() => {
        if (mockOnAuthStateChangedCallback) mockOnAuthStateChangedCallback(mockUser);
    });

    await waitFor(() => {
      expect(getByText(`User ID: ${mockUser.uid}`)).toBeInTheDocument(); // User is authenticated
      expect(queryByText(/User Role:/i)).toBeNull(); // No role is set
      expect(mockToastError).toHaveBeenCalledWith('User document not found for UID: no-doc-uid. Role not set.');
    });
  });

});