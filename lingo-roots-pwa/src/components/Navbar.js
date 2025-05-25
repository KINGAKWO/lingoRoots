import React, { useState } from 'react';
import { Link } from 'react-router-dom';
import { FaBars, FaTimes } from 'react-icons/fa'; // Example icons
import { useAuth } from '../context/AuthContext'; // Assuming AuthContext is in src/context
// import './Navbar.css'; // Styles will be handled by Tailwind CSS utility classes

const Navbar = () => {
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const { currentUser, logout } = useAuth();

  const toggleMobileMenu = () => {
    setIsMobileMenuOpen(!isMobileMenuOpen);
  };

  const handleLogout = async () => {
    try {
      await logout();
      // Optional: Navigate to home or sign-in page after logout
      // navigate('/');
    } catch (error) {
      console.error('Failed to log out:', error);
      // Handle logout error (e.g., show a notification)
    }
  };

  return (
    <nav className="sticky top-0 z-50 bg-marine-blue text-white shadow-md">
      <div className="navbar-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="navbar-logo text-xl font-bold">
              {/* <img src="/logo.jpg" alt="LingoRoots Logo" className="h-8 w-auto mr-2" /> */}
              LingoRoots
            </Link>
          </div>
          <div className="hidden md:block">
            <div className="navbar-links ml-10 flex items-baseline space-x-4">
              <Link to="/" className="nav-link hover:bg-sky-blue px-3 py-2 rounded-md text-sm font-medium">Home</Link>
              <Link to="/about" className="nav-link hover:bg-sky-blue px-3 py-2 rounded-md text-sm font-medium">About</Link>
              {currentUser ? (
                <>
                  {/* Role-based links can be added here */}
                  {/* Example: <Link to="/dashboard" className="nav-link hover:bg-sky-blue px-3 py-2 rounded-md text-sm font-medium">Dashboard</Link> */}
                  <button onClick={handleLogout} className="nav-link hover:bg-sky-blue px-3 py-2 rounded-md text-sm font-medium">
                    Sign Out
                  </button>
                  {currentUser.email && <span className="text-sm text-gray-300 ml-3">{currentUser.email}</span>}
                </>
              ) : (
                <>
                  <Link to="/signin" className="nav-link hover:bg-sky-blue px-3 py-2 rounded-md text-sm font-medium">Sign In</Link>
                  <Link to="/signup" className="nav-link bg-sky-blue hover:bg-sky-blue-dark px-3 py-2 rounded-md text-sm font-medium">Sign Up</Link>
                </>
              )}
            </div>
          </div>
          <div className="-mr-2 flex md:hidden">
            <button
              onClick={toggleMobileMenu}
              type="button"
              className="mobile-menu-button inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-sky-blue focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
              aria-controls="mobile-menu"
              aria-expanded={isMobileMenuOpen}
            >
              <span className="sr-only">Open main menu</span>
              {isMobileMenuOpen ? <FaTimes className="block h-6 w-6" /> : <FaBars className="block h-6 w-6" />}
            </button>
          </div>
        </div>
      </div>

      {/* Mobile menu, show/hide based on menu state. */}
      {isMobileMenuOpen && (
        <div className="md:hidden mobile-menu-items" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            <Link to="/" className="nav-link-mobile block px-3 py-2 rounded-md text-base font-medium" onClick={toggleMobileMenu}>Home</Link>
            <Link to="/about" className="nav-link-mobile block px-3 py-2 rounded-md text-base font-medium" onClick={toggleMobileMenu}>About</Link>
            {currentUser ? (
              <>
                {/* <Link to="/dashboard" className="nav-link-mobile block px-3 py-2 rounded-md text-base font-medium" onClick={toggleMobileMenu}>Dashboard</Link> */}
                <button onClick={() => { handleLogout(); toggleMobileMenu(); }} className="nav-link-mobile block w-full text-left px-3 py-2 rounded-md text-base font-medium">
                  Sign Out
                </button>
                {currentUser.email && <span className="block px-3 py-2 text-sm text-gray-400">{currentUser.email}</span>}
              </>
            ) : (
              <>
                <Link to="/signin" className="nav-link-mobile block px-3 py-2 rounded-md text-base font-medium" onClick={toggleMobileMenu}>Sign In</Link>
                <Link to="/signup" className="nav-link-mobile bg-sky-blue block px-3 py-2 rounded-md text-base font-medium" onClick={toggleMobileMenu}>Sign Up</Link>
              </>
            )}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;