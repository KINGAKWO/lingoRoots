import React, { useState } from 'react';
import { auth, db } from '../firebase'; // Import auth and db from your firebase.js file
import { createUserWithEmailAndPassword } from "firebase/auth";
import { doc, setDoc } from "firebase/firestore"; // Import Firestore functions
import './SignUp.css'; // Import the new CSS file
// Assuming you have an icon, otherwise remove or replace path
// import logoIcon from './path-to-your-logo-icon.svg'; 

const SignUp = () => {
  const [firstName, setFirstName] = useState('');
  const [lastName, setLastName] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [primaryLanguage, setPrimaryLanguage] = useState('');
  const [agreedToTerms, setAgreedToTerms] = useState(false);
  const [error, setError] = useState(null);

  const handleSignUp = async (event) => {
    event.preventDefault();
    setError(null); // Clear previous errors

    if (!agreedToTerms) {
      setError("You must agree to the terms of service, privacy policy, and data collection.");
      return;
    }

    try {
      // Here, you would typically also send firstName, lastName, and primaryLanguage
      // to your backend (e.g., Firestore) after successful Firebase Auth user creation.
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      console.log("User signed up:", userCredential.user);

      // Save additional user details to Firestore
      await setDoc(doc(db, "users", userCredential.user.uid), {
        firstName: firstName,
        lastName: lastName,
        email: email, // Storing email from auth is also good practice
        primaryLanguageInterest: primaryLanguage,
        createdAt: new Date() // Optional: timestamp for when the user signed up
      });
      console.log("Additional user data saved to Firestore");

      // You can redirect or update UI here
    } catch (error) {
      console.error("Error signing up:", error);
      setError(error.message);
    }
  };

  return (
    <div className="signup-container">
      <div className="signup-form-wrapper">
        <div className="signup-logo">
          {/* <img src={logoIcon} alt="LinguaRoots Logo" /> */}
          <span>LinguaRoots</span>
        </div>
        <h2>Create your account</h2>
        <p className="sub-heading">Join the community and start learning</p>

        <form onSubmit={handleSignUp} className="signup-form">
          <div className="form-row">
            <div className="form-group">
              <label htmlFor="firstName">First name</label>
              <input
                type="text"
                id="firstName"
                value={firstName}
                onChange={(e) => setFirstName(e.target.value)}
                placeholder="John"
                required
              />
            </div>
            <div className="form-group">
              <label htmlFor="lastName">Last name</label>
              <input
                type="text"
                id="lastName"
                value={lastName}
                onChange={(e) => setLastName(e.target.value)}
                placeholder="Doe"
                required
              />
            </div>
          </div>

          <div className="form-group">
            <label htmlFor="email">Email</label>
            <input
              type="email"
              id="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              placeholder="m.davis@example.com"
              required
            />
          </div>

          <div className="form-group">
            <div className="label-with-hint">
              <label htmlFor="password">Password</label>
              <span className="hint">Min. 8 characters</span>
            </div>
            <input
              type="password"
              id="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              minLength="8"
              required
            />
          </div>

          <div className="form-group">
            <label htmlFor="primaryLanguage">Primary Language Interest <span title="Your learning experience will be tailored to this language" className="tooltip-icon">ⓘ</span></label>
            <select 
              id="primaryLanguage" 
              value={primaryLanguage} 
              onChange={(e) => setPrimaryLanguage(e.target.value)}
              required
            >
              <option value="" disabled>Select a language</option>
              {/* Add language options here, e.g., from a predefined list or API */}
              <option value="fulfulde">Fulfulde</option>
              <option value="ewondo">Ewondo</option>
              <option value="duala">Duala</option>
              <option value="basaa">Basaa</option>
              {/* ... more languages */}
            </select>
            <p className="field-description">Your learning experience will be tailored to this language</p>
          </div>

          <div className="checkbox-group">
            <input 
              type="checkbox" 
              id="termsAgreement" 
              checked={agreedToTerms} 
              onChange={(e) => setAgreedToTerms(e.target.checked)} 
              required
            />
            <label htmlFor="termsAgreement">
              I agree to the terms of service, privacy policy, and the collection of my data for learning personalization
            </label>
          </div>

          {error && <p className="error-message">{error}</p>}

          <button type="submit" className="btn-submit">Create account</button>

          <p className="login-link">
            Already have an account? <a href="/signin">Log in</a> {/* Adjust link as per your routing */}
          </p>
        </form>
      </div>
    </div>
  );
};

export default SignUp;