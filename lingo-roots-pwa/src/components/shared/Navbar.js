import React, { useState } from 'react';
import { Link } from 'react-router-dom'; // Assuming React Router is used for navigation

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);

  return (
    <nav className="bg-gray-800 text-white p-4 shadow-md">
      <div className="container mx-auto flex justify-between items-center">
        <Link to="/" className="text-2xl font-bold">
          LingoRoots
        </Link>

        {/* Mobile Menu Button */}
        <div className="md:hidden">
          <button onClick={() => setIsOpen(!isOpen)} className="text-white focus:outline-none">
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24" xmlns="http://www.w3.org/2000/svg">
              {isOpen ? (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
              ) : (
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16m-7 6h7" />
              )}
            </svg>
          </button>
        </div>

        {/* Desktop Menu */}
        <div className="hidden md:flex space-x-4">
          <Link to="/" className="hover:text-gray-300">Home</Link>
          <Link to="/learn" className="hover:text-gray-300">Learn</Link>
          <Link to="/practice" className="hover:text-gray-300">Practice</Link>
          <Link to="/profile" className="hover:text-gray-300">Profile</Link>
          {/* Add more links as needed */}
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden mt-2">
          <Link to="/" className="block py-2 px-4 text-sm hover:bg-gray-700" onClick={() => setIsOpen(false)}>Home</Link>
          <Link to="/learn" className="block py-2 px-4 text-sm hover:bg-gray-700" onClick={() => setIsOpen(false)}>Learn</Link>
          <Link to="/practice" className="block py-2 px-4 text-sm hover:bg-gray-700" onClick={() => setIsOpen(false)}>Practice</Link>
          <Link to="/profile" className="block py-2 px-4 text-sm hover:bg-gray-700" onClick={() => setIsOpen(false)}>Profile</Link>
          {/* Add more links as needed */}
        </div>
      )}
    </nav>
  );
};

export default Navbar;