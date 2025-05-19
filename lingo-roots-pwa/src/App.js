import logo from './logo.svg';
import React, { useState, useEffect } from 'react';
import './App.css';
import { auth } from './firebase'; // Import auth from your firebase.js
import { onAuthStateChanged, signOut } from "firebase/auth";
import SignUp from './components/SignUp';
import SignIn from './components/SignIn';
import LanguageDashboard from './components/LanguageDashboards';

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // To handle initial auth state check

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (user) => {
      setCurrentUser(user);
      setLoading(false); // Auth state determined
      console.log("Auth state changed, user:", user);
    });

    // Cleanup subscription on unmount
    return () => unsubscribe();
  }, []);

  const handleSignOut = async () => {
    try {
      await signOut(auth);
      console.log("User signed out");
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return <p>Loading...</p>; // Or a spinner component
  }

  return (
    <div className="App">
      <header className="App-header">
        <h1>LingoRoots</h1>
        {currentUser ? (
          <div>
            <p>Welcome, {currentUser.email}!</p>
            <button onClick={handleSignOut}>Sign Out</button>
            <hr />
            <LanguageDashboard userId={currentUser.uid}/>
          </div>
        ) : (
          <div>
            <p>Please sign in or sign up.</p>
            <SignIn />
            <hr />
            <SignUp />
          </div>
        )}
      </header>
    </div>
  );
}

export default App;