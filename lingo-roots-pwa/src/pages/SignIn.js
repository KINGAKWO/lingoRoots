import React, { useState } from 'react';
// import './SignIn.css'; // Removed CSS import
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
import toast from 'react-hot-toast'; // Import toast

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null); // Keep local error state for inline messages if needed
  const { login } = useAuth(); // Changed to login, redirection is handled by App.js/ProtectedRoute
  const navigate = useNavigate();

  const handleSignIn = async (event) => {
    event.preventDefault();
    setError(null); // Clear previous inline errors
    try {
      await login(email, password);
      toast.success("Signed in successfully! Redirecting...");
      console.log("User signed in successfully, navigating based on role by App.js");
      // Navigation is now primarily handled by App.js based on AuthContext state changes
      // navigate('/'); // Or let App.js handle redirect based on role
    } catch (error) {
      console.error("Error signing in:", error);
      let errorMessage = 'Failed to sign in. Please try again later.';
      // Firebase provides error.code and error.message
      if (error.code === 'auth/user-not-found' || error.code === 'auth/wrong-password' || error.code === 'auth/invalid-credential') {
        errorMessage = 'Invalid email or password. Please try again.';
      } else if (error.code === 'auth/invalid-email') {
        errorMessage = 'Please enter a valid email address.';
      }
      toast.error(errorMessage);
      setError(errorMessage); // Optional: keep inline error too
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div>
          <h2 className="mt-6 text-center text-3xl font-extrabold text-gray-900">
            Welcome back
          </h2>
          <p className="mt-2 text-center text-sm text-gray-600">
            Enter your email and password to sign in to your account
          </p>
        </div>
        <form onSubmit={handleSignIn} className="mt-8 space-y-6">
          <div className="rounded-md shadow-sm -space-y-px">
            <div>
              <label htmlFor="email" className="sr-only">
                Email address
              </label>
              <input
                id="email"
                name="email"
                type="email"
                autoComplete="email"
                required
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-t-md focus:outline-none focus:ring-marine-blue-500 focus:border-marine-blue-500 focus:z-10 sm:text-sm"
                placeholder="Email address"
              />
            </div>
            <div>
              <label htmlFor="password" className="sr-only">
                Password
              </label>
              <input
                id="password"
                name="password"
                type="password"
                autoComplete="current-password"
                required
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="appearance-none rounded-none relative block w-full px-3 py-3 border border-gray-300 placeholder-gray-500 text-gray-900 rounded-b-md focus:outline-none focus:ring-marine-blue-500 focus:border-marine-blue-500 focus:z-10 sm:text-sm"
                placeholder="Password"
              />
            </div>
          </div>

          <div className="flex items-center justify-end">
            <div className="text-sm">
              <Link to="/forgot-password" className="font-medium text-marine-blue-600 hover:text-marine-blue-500">
                Forgot your password?
              </Link>
            </div>
          </div>

          {error && (
            <p className="mt-2 text-center text-sm text-red-600">
              {error}
            </p>
          )}

          <div>
            <button
              type="submit"
              className="group relative w-full flex justify-center py-3 px-4 border border-transparent text-sm font-medium rounded-md text-white bg-marine-blue-600 hover:bg-marine-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-blue-500 transition duration-150 ease-in-out"
            >
              Sign In
            </button>
          </div>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Don't have an account?{' '}
            <Link to="/signup" className="font-medium text-marine-blue-600 hover:text-marine-blue-500">
              Sign up
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignIn;