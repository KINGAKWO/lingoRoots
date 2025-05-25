import React from 'react';
import { Link } from 'react-router-dom';
import { FaFacebookF, FaTwitter, FaInstagram, FaLinkedinIn } from 'react-icons/fa'; // Example social icons
// import './Footer.css'; // Styles will be handled by Tailwind CSS utility classes

const Footer = () => {
  const currentYear = new Date().getFullYear();

  return (
    <footer className="bg-gray-800 text-gray-300 pt-12 pb-8">
      <div className="footer-content max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid grid-cols-1 md:grid-cols-3 gap-8 mb-8">
          {/* About Section */}
          <div>
            <h5 className="text-lg font-semibold text-white mb-4">LingoRoots</h5>
            <p className="text-sm">
              Master new languages with interactive lessons and a supportive community. Start your journey with LingoRoots today!
            </p>
          </div>

          {/* Quick Links */}
          <div>
            <h5 className="text-lg font-semibold text-white mb-4">Quick Links</h5>
            <ul className="space-y-2">
              <li><Link to="/about" className="footer-link hover:text-sky-blue transition-colors">About Us</Link></li>
              <li><Link to="/contact" className="footer-link hover:text-sky-blue transition-colors">Contact</Link></li>
              <li><Link to="/faq" className="footer-link hover:text-sky-blue transition-colors">FAQ</Link></li>
              <li><Link to="/terms" className="footer-link hover:text-sky-blue transition-colors">Terms of Service</Link></li>
              <li><Link to="/privacy" className="footer-link hover:text-sky-blue transition-colors">Privacy Policy</Link></li>
            </ul>
          </div>

          {/* Social Media & Contact */}
          <div>
            <h5 className="text-lg font-semibold text-white mb-4">Connect With Us</h5>
            <div className="flex space-x-4 mb-4">
              <a href="https://facebook.com" target="_blank" rel="noopener noreferrer" className="social-icon hover:text-sky-blue transition-colors"><FaFacebookF size={20} /></a>
              <a href="https://twitter.com" target="_blank" rel="noopener noreferrer" className="social-icon hover:text-sky-blue transition-colors"><FaTwitter size={20} /></a>
              <a href="https://instagram.com" target="_blank" rel="noopener noreferrer" className="social-icon hover:text-sky-blue transition-colors"><FaInstagram size={20} /></a>
              <a href="https://linkedin.com" target="_blank" rel="noopener noreferrer" className="social-icon hover:text-sky-blue transition-colors"><FaLinkedinIn size={20} /></a>
            </div>
            <p className="text-sm">Email: <a href="mailto:support@lingoroots.com" className="hover:text-sky-blue transition-colors">support@lingoroots.com</a></p>
            {/* <p className="text-sm">Phone: +1 (123) 456-7890</p> */}
          </div>
        </div>

        <div className="border-t border-gray-700 pt-8 text-center">
          <p className="text-sm">&copy; {currentYear} LingoRoots. All rights reserved.</p>
        </div>
      </div>
    </footer>
  );
};

export default Footer;