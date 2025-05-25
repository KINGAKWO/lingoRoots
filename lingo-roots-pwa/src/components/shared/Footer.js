import React from 'react';
import { Link } from 'react-router-dom'; // Assuming React Router for navigation links

const Footer = () => {
  return (
    <footer className="bg-gray-800 text-white py-8 px-4 shadow-inner mt-auto">
      <div className="container mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
        <div>
          <h3 className="text-xl font-semibold mb-3">LingoRoots</h3>
          <p className="text-gray-400 text-sm">
            Your journey to language mastery starts here. Learn, practice, and grow with us.
          </p>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm">
            <li><Link to="/about" className="hover:text-gray-300">About Us</Link></li>
            <li><Link to="/contact" className="hover:text-gray-300">Contact</Link></li>
            <li><Link to="/privacy" className="hover:text-gray-300">Privacy Policy</Link></li>
            <li><Link to="/terms" className="hover:text-gray-300">Terms of Service</Link></li>
          </ul>
        </div>
        <div>
          <h3 className="text-xl font-semibold mb-3">Connect With Us</h3>
          <div className="flex justify-center md:justify-start space-x-4">
            {/* Replace with actual social media icons/links */}
            <a href="#" className="hover:text-gray-300">Facebook</a>
            <a href="#" className="hover:text-gray-300">Twitter</a>
            <a href="#" className="hover:text-gray-300">Instagram</a>
          </div>
        </div>
      </div>
      <div className="text-center text-gray-500 pt-8 mt-8 border-t border-gray-700 text-sm">
        <p>&copy; {new Date().getFullYear()} LingoRoots. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;