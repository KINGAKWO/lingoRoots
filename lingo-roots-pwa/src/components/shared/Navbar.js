import React, { useState, useEffect, useRef } from 'react';
import { NavLink, Link } from 'react-router-dom'; // Use NavLink for active styling

// Define your theme colors here for consistency, e.g., from project_rules.md
const themeColors = {
  marineBlue: 'bg-blue-700', // Example: Replace with actual hex/Tailwind color
  skyBlueText: 'text-blue-300',
  whiteText: 'text-white',
  activeLinkSkyBlue: 'text-sky-400',
  hoverGray: 'hover:text-gray-300',
  hoverBgGray: 'hover:bg-gray-700',
};

const Navbar = () => {
  const [isOpen, setIsOpen] = useState(false);
  const navRef = useRef(null);

  // Close mobile menu on click outside
  useEffect(() => {
    const handleClickOutside = (event) => {
      if (navRef.current && !navRef.current.contains(event.target)) {
        setIsOpen(false);
      }
    };
    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
    };
  }, [isOpen]);

  const commonLinkClasses = "py-2 px-3 rounded-md text-sm font-medium";
  const activeClassName = `${themeColors.activeLinkSkyBlue} ${themeColors.marineBlue.replace('bg-', 'bg-opacity-25')}`;
  const inactiveClassName = `${themeColors.whiteText} ${themeColors.hoverGray}`;

  const navLinkItems = [
    { to: "/", text: "Home" },
    { to: "/learn", text: "Learn" },
    { to: "/practice", text: "Practice" },
    { to: "/profile", text: "Profile" },
  ];

  return (
    <nav ref={navRef} className={`${themeColors.marineBlue} ${themeColors.whiteText} shadow-lg sticky top-0 z-50`} aria-label="Main navigation">
      <div className="container mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16">
          <div className="flex items-center">
            <Link to="/" className="text-2xl font-bold ${themeColors.whiteText}">
              LingoRoots
            </Link>
          </div>
          <div className="flex items-center">
            {/* Desktop Menu */}
            <div className="hidden md:block">
              <div className="ml-10 flex items-baseline space-x-4">
                {navLinkItems.map((item) => (
                  <NavLink
                    key={item.to}
                    to={item.to}
                    className={({ isActive }) => 
                      `${commonLinkClasses} ${isActive ? activeClassName : inactiveClassName}`
                    }
                  >
                    {item.text}
                  </NavLink>
                ))}
              </div>
            </div>
            {/* Mobile Menu Button */}
            <div className="-mr-2 flex md:hidden">
              <button
                onClick={() => setIsOpen(!isOpen)}
                type="button"
                className="inline-flex items-center justify-center p-2 rounded-md text-gray-400 hover:text-white hover:bg-gray-700 focus:outline-none focus:ring-2 focus:ring-inset focus:ring-white"
                aria-controls="mobile-menu"
                aria-expanded={isOpen}
                aria-label="Toggle navigation menu"
              >
                <span className="sr-only">Open main menu</span>
                {isOpen ? (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                ) : (
                  <svg className="block h-6 w-6" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24" stroke="currentColor" aria-hidden="true">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 6h16M4 12h16M4 18h16" />
                  </svg>
                )}
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* Mobile Menu Dropdown */}
      {isOpen && (
        <div className="md:hidden transition-all ease-out duration-300" id="mobile-menu">
          <div className="px-2 pt-2 pb-3 space-y-1 sm:px-3">
            {navLinkItems.map((item) => (
              <NavLink
                key={item.to}
                to={item.to}
                className={({ isActive }) => 
                  `block ${commonLinkClasses} ${isActive ? activeClassName : inactiveClassName} ${themeColors.hoverBgGray}`
                }
                onClick={() => setIsOpen(false)} // Close menu on click
              >
                {item.text}
              </NavLink>
            ))}
          </div>
        </div>
      )}
    </nav>
  );
};

export default Navbar;