import React, { useState, useEffect } from 'react';
import './App.css';
import { auth } from './firebase'; // Import auth from your firebase.js
import { onAuthStateChanged, signOut } from "firebase/auth";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import SignUp from './components/SignUp';
import SignIn from './components/SignIn';
import LanguageDashboard from './components/LanguageDashboards';
import Dashboard from './components/Dashboard'; // Import Dashboard component

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
      // Navigate to sign-in or home page after sign out is handled by Navigate component below
    } catch (error) {
      console.error("Error signing out:", error);
    }
  };

  if (loading) {
    return <p>Loading...</p>; // Or a spinner component
  }

  return (
    <Router>
      <div className="App">
        <header className="App-header">
          <Link to={currentUser ? "/dashboard" : "/signin"} style={{ textDecoration: 'none', color: 'inherit' }}>
            <h1>LingoRoots</h1>
          </Link>
          {currentUser && (
            <nav style={{ marginBottom: '20px' }}>
              <Link to="/dashboard" style={{ marginRight: '10px' }}>Dashboard</Link>
              <Link to="/lessons" style={{ marginRight: '10px' }}>Lessons</Link>
              {/* Add other navigation links here as needed */}
              <button onClick={handleSignOut} style={{ background: 'none', border: 'none', color: 'white', cursor: 'pointer', textDecoration: 'underline', fontSize: '1em' }}>Sign Out</button>
              <p style={{ fontSize: '0.8em', marginTop: '5px' }}>Logged in as: {currentUser.email}</p>
            </nav>
          )}
        </header>
        
        <main>
          <Routes>
            {currentUser ? (
              <>
                <Route path="/dashboard" element={<Dashboard userId={currentUser.uid} />} />
                <Route path="/lessons" element={<LanguageDashboard userId={currentUser.uid} />} />
                {/* Add routes for Quiz, Culture pages here */}
                {/* Default route for logged-in users */}
                <Route path="/*" element={<Navigate to="/dashboard" replace />} />
              </>
            ) : (
              <>
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                {/* Default route for non-logged-in users */}
                <Route path="/*" element={<Navigate to="/signin" replace />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;