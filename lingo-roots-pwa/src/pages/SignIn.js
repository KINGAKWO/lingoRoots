import React, { useState } from 'react';
import './SignIn.css'; // Import the CSS file
import { auth } from '../firebase'; // Import auth from your firebase.js file
import { signInWithEmailAndPassword } from "firebase/auth";

const SignIn = () => {
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState(null);

  const handleSignIn = async (event) => {
    event.preventDefault();
    setError(null); // Clear previous errors
    try {
      const userCredential = await signInWithEmailAndPassword(auth, email, password);
      console.log("User signed in:", userCredential.user);
      // You can redirect or update UI here
    } catch (error) {
      console.error("Error signing in:", error);
      setError(error.message);
    }
  };

  return (
    <div className="signin-page-container">
      <div className="signin-form-container">
        <h2>Welcome back</h2>
        <p className="subtitle">Enter your email and password to sign in to your account</p>
        <form onSubmit={handleSignIn} className="signin-form">
          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="akwomakkingguersho@gmail.com"
              required
            />
          </div>
          <div className="form-group">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <label htmlFor="password">Password</label>
              <a href="/forgot-password" className="forgot-password-link">Forgot password?</a>
            </div>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              placeholder="••••••••••"
              required
            />
          </div>
          {error && <p className="error-message">{error}</p>}
          <button type="submit" className="signin-btn">Sign In</button>
        </form>
        <div className="signup-prompt">
          Don't have an account? <a href="/signup" className="signup-link">Sign up</a>
        </div>
      </div>
    </div>
  );
};

export default SignIn;