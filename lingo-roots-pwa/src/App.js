import React, { useState, useEffect } from 'react';
import './App.css';
import { auth } from './firebase'; // Import auth from your firebase.js
import { onAuthStateChanged, signOut } from "firebase/auth";
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import SignUp from './components/SignUp';
import SignIn from './components/SignIn';
import LanguageDashboard from './components/LanguageDashboards';
import Dashboard from './components/Dashboard'; // Import Dashboard component
import LandingPage from './components/LandingPage/LandingPage'; // Import LandingPage component

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
          <Link to={currentUser ? "/dashboard" : "/"}> {/* Removed inline style */}
            <h1>LingoRoots</h1>
          </Link>
          {currentUser && (
            <nav className="main-navigation"> {/* Changed class, removed inline style */}
              <Link to="/dashboard" className="nav-link">Home</Link>
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/lessons" className="nav-link">Languages</Link>
              <Link to="/about" className="nav-link">About</Link> {/* Added About link, assumes /about route will be handled */}
              <Link to="/profile" className="nav-link">Profile</Link>
              <button onClick={handleSignOut} className="nav-link signout-btn">
                {/* Icon can be added here e.g. <FaSignOutAlt /> */}
                Sign Out
              </button>
              {/* <p className="user-email-display">Logged in as: {currentUser.email}</p> */}
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
                <Route path="/" element={<LandingPage />} />
                <Route path="/signin" element={<SignIn />} />
                <Route path="/signup" element={<SignUp />} />
                {/* Default route for non-logged-in users, if no other match, show landing */}
                <Route path="/*" element={<Navigate to="/" replace />} />
              </>
            )}
          </Routes>
        </main>
      </div>
    </Router>
  );
}

export default App;