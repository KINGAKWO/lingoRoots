import React, { useState, useEffect } from 'react';
import './App.css';
import { auth } from './firebase'; // Import auth from your firebase.js
import { onAuthStateChanged, signOut } from "firebase/auth";
import { FaBars, FaTimes } from 'react-icons/fa'; // Import hamburger and close icons
import { BrowserRouter as Router, Routes, Route, Link, Navigate } from 'react-router-dom';
import SignUp from './pages/SignUp';
import SignIn from './pages/SignIn';
import LanguageDashboard from './components/LanguageDashboards';
import Dashboard from './components/Dashboard'; // Import Dashboard component
import LandingPage from './components/LandingPage/LandingPage'; // Import LandingPage component
import AboutPage from './components/AboutPage'; // Import AboutPage component
import LessonPage from './components/LessonPage'; // Import LessonPage component

function App() {
  const [currentUser, setCurrentUser] = useState(null);
  const [loading, setLoading] = useState(true); // To handle initial auth state check
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);

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
          <Link to={currentUser ? "/dashboard" : "/"} className="app-logo-link"> {/* Added class for specific styling if needed */}
            <h1>LingoRoots</h1>
          </Link>
          {currentUser && (
            <div className="mobile-menu-icon" onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}>
              {isMobileMenuOpen ? <FaTimes /> : <FaBars />}
            </div>
          )}
          {currentUser && (
            <nav className={`main-navigation ${isMobileMenuOpen ? 'mobile-active' : ''}`}> {/* Changed class, removed inline style */}
              <Link to="/" className="nav-link">Home</Link> {/* Corrected Home link to point to / */}
              <Link to="/dashboard" className="nav-link">Dashboard</Link>
              <Link to="/lessons" className="nav-link">Languages</Link>
              <Link to="/about" className="nav-link">About</Link> {/* Added About link, assumes /about route will be handled */}
              <Link to="/profile" className="nav-link">Profile</Link>
              <button onClick={handleSignOut} className="nav-link signout-btn">
                {/* Icon can be added here e.g. <FaSignOutAlt /> */}
                Sign Out
              </button>
              {/* <p className="user-email-display">Logged in as: {currentUser.email}</p> */}
              {/* Ensure mobile menu closes on link click if desired by adding onClick={() => setIsMobileMenuOpen(false)} to each Link */}
            </nav>
          )}
        </header>
        
        <main>
          <Routes>
            {currentUser ? (
              <>
                <Route path="/dashboard" element={<Dashboard userId={currentUser.uid} />} />
                <Route path="/lessons" element={<LanguageDashboard userId={currentUser.uid} />} />
                <Route path="/lessons/:languageId/:lessonId" element={<LessonPage userId={currentUser.uid} />} /> {/* Route for individual lessons, passing userId */}
                <Route path="/about" element={<AboutPage />} /> {/* Added route for AboutPage */}
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