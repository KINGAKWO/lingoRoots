import React, { useState } from 'react';
import { useAuth } from '../context/AuthContext';
import { useNavigate, Link } from 'react-router-dom'; // Import Link
// import './SignUp.css'; // Removed CSS import

const SignUp = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [primaryLanguage, setPrimaryLanguage] = useState('');
  // const [role, setRole] = useState('learner'); // Role is defaulted to 'learner' in AuthContext
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState(null);
  const { signup } = useAuth();
  const navigate = useNavigate();

  const handleSignUp = async (event) => {
    event.preventDefault();
    setError(null);

    if (!agreedToTerms) {
      setError("You must agree to the terms and conditions.");
      return;
    }
    if (password.length < 8) {
      setError("Password must be at least 8 characters long.");
      return;
    }

    try {
      const additionalData = {
        firstName,
        lastName,
        primaryLanguageInterest: primaryLanguage,
        displayName: `${firstName} ${lastName}` // Add displayName
      };
      await signup(email, password, 'learner', additionalData); // Explicitly pass 'learner'
      console.log("User signed up successfully with role: learner");
      // Navigation is now primarily handled by App.js based on AuthContext state changes
      // navigate('/'); // Or let App.js handle redirect based on role
    } catch (error) {
      console.error("Error signing up:", error);
      if (error.code === 'auth/email-already-in-use') {
        setError('This email address is already in use. Please try another.');
      } else if (error.code === 'auth/invalid-email') {
        setError('Please enter a valid email address.');
      } else if (error.code === 'auth/weak-password') {
        setError('The password is too weak. Please choose a stronger password.');
      } else {
        setError('Failed to create an account. Please try again later.');
      }
    }
  };

  return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-gray-100 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-lg w-full space-y-8 bg-white p-10 rounded-xl shadow-lg">
        <div className="text-center">
          <h1 className="text-3xl font-bold text-marine-blue-700">LingoRoots</h1>
          <h2 className="mt-4 text-2xl font-extrabold text-gray-900">
            Create your account
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Join the community and start your language learning journey!
          </p>
        </div>
        <form onSubmit={handleSignUp} className="mt-8 space-y-6">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div>
              <label htmlFor="firstName" className="block text-sm font-medium text-gray-700">
                First name
              </label>
              <input
                id="firstName"
                name="firstName"
                type="text"
                autoComplete="given-name"
                required
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                className="mt-1 appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-marine-blue-500 focus:border-marine-blue-500 sm:text-sm"
                placeholder="John"
              />
            </div>
            <div>
              <label htmlFor="lastName" className="block text-sm font-medium text-gray-700">
                Last name
              </label>
              <input
                id="lastName"
                name="lastName"
                type="text"
                autoComplete="family-name"
                required
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                className="mt-1 appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-marine-blue-500 focus:border-marine-blue-500 sm:text-sm"
                placeholder="Doe"
              />
            </div>
          </div>

          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
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
              className="mt-1 appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-marine-blue-500 focus:border-marine-blue-500 sm:text-sm"
              placeholder="you@example.com"
            />
          </div>

          <div>
            <div className="flex justify-between">
                <label htmlFor="password" className="block text-sm font-medium text-gray-700">
                Password
                </label>
                <span className="text-xs text-gray-500">Min. 8 characters</span>
            </div>
            <input
              id="password"
              name="password"
              type="password"
              autoComplete="new-password"
              required
              minLength="8"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 appearance-none block w-full px-3 py-3 border border-gray-300 rounded-md shadow-sm placeholder-gray-400 focus:outline-none focus:ring-marine-blue-500 focus:border-marine-blue-500 sm:text-sm"
              placeholder="••••••••"
            />
          </div>
          
          <div>
            <label htmlFor="primaryLanguage" className="block text-sm font-medium text-gray-700">
              Primary Language Interest
            </label>
            <select
              id="primaryLanguage"
              name="primaryLanguage"
              required
              value={primaryLanguage}
              onChange={(e) => setPrimaryLanguage(e.target.value)}
              className="mt-1 block w-full pl-3 pr-10 py-3 text-base border-gray-300 focus:outline-none focus:ring-marine-blue-500 focus:border-marine-blue-500 sm:text-sm rounded-md"
            >
              <option value="" disabled>Select a language</option>
              <option value="Duala">Duala</option>
              <option value="Bassa">Bassa</option>
              <option value="Ewondo">Ewondo</option>
              <option value="Fulfulde">Fulfulde</option>
              {/* Add more languages as needed */}
            </select>
            <p className="mt-1 text-xs text-gray-500">Your learning experience will be tailored to this language.</p>
          </div>


          <div className="flex items-start">
            <div className="flex items-center h-5">
              <input
                id="termsAgreement"
                name="termsAgreement"
                type="checkbox"
                checked={agreedToTerms}
                onChange={(e) => setAgreedToTerms(e.target.checked)}
                required
                className="focus:ring-marine-blue-500 h-4 w-4 text-marine-blue-600 border-gray-300 rounded"
              />
            </div>
            <div className="ml-3 text-sm">
              <label htmlFor="termsAgreement" className="font-medium text-gray-700">
                I agree to the{' '}
                <a href="/terms" target="_blank" rel="noopener noreferrer" className="text-marine-blue-600 hover:text-marine-blue-500">
                  Terms of Service
                </a>{' '}and{' '}
                 <a href="/privacy" target="_blank" rel="noopener noreferrer" className="text-marine-blue-600 hover:text-marine-blue-500">
                  Privacy Policy
                </a>
                .
              </label>
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
              className="w-full flex justify-center py-3 px-4 border border-transparent rounded-md shadow-sm text-sm font-medium text-white bg-marine-blue-600 hover:bg-marine-blue-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-marine-blue-500 transition duration-150 ease-in-out"
            >
              Create account
            </button>
          </div>
        </form>
        <div className="mt-6 text-center">
          <p className="text-sm text-gray-600">
            Already have an account?{' '}
            <Link to="/signin" className="font-medium text-marine-blue-600 hover:text-marine-blue-500">
              Log in
            </Link>
          </p>
        </div>
      </div>
    </div>
  );
};

export default SignUp;