import React from 'react';
import { Link } from 'react-router-dom';

// Define your theme colors here for consistency, e.g., from project_rules.md
const themeColors = {
  marineBlue: 'bg-blue-800', // Example: Darker blue for footer
  whiteText: 'text-white',
  grayText: 'text-gray-400',
  hoverGray: 'hover:text-gray-300',
  borderColor: 'border-gray-700',
};

const Footer = () => {
  const quickLinks = [
    { to: "/about", text: "About Us" },
    { to: "/contact", text: "Contact" },
    { to: "/privacy", text: "Privacy Policy" },
    { to: "/terms", text: "Terms of Service" },
  ];

  const socialLinks = [
    { href: "#", text: "Facebook", label: "LingoRoots on Facebook" }, // Added aria-label
    { href: "#", text: "Twitter", label: "LingoRoots on Twitter" },
    { href: "#", text: "Instagram", label: "LingoRoots on Instagram" },
  ];

  return (
    <footer className={`${themeColors.marineBlue} ${themeColors.whiteText} py-8 px-4 sm:px-6 lg:px-8 shadow-inner mt-auto`} role="contentinfo">
      <div className="container mx-auto grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-8 text-center sm:text-left">
        {/* About Section */}
        <div className="mb-6 sm:mb-0">
          <h3 className="text-xl font-semibold mb-3">LingoRoots</h3>
          <p className={`${themeColors.grayText} text-sm leading-relaxed`}>
            Your journey to language mastery starts here. Learn, practice, and grow with us.
          </p>
        </div>

        {/* Quick Links Section */}
        <div className="mb-6 sm:mb-0">
          <h3 className="text-xl font-semibold mb-3">Quick Links</h3>
          <ul className="space-y-2 text-sm" aria-label="Quick navigation links">
            {quickLinks.map(link => (
              <li key={link.to}>
                <Link to={link.to} className={`${themeColors.hoverGray} transition-colors duration-200`}>
                  {link.text}
                </Link>
              </li>
            ))}
          </ul>
        </div>

        {/* Connect With Us Section */}
        <div>
          <h3 className="text-xl font-semibold mb-3">Connect With Us</h3>
          <div className="flex justify-center sm:justify-start space-x-4" aria-label="Social media links">
            {socialLinks.map(social => (
              <a 
                key={social.text} 
                href={social.href} 
                className={`${themeColors.hoverGray} transition-colors duration-200`} 
                aria-label={social.label} // Accessibility improvement
                target="_blank" // Open social links in new tab
                rel="noopener noreferrer" // Security for target="_blank"
              >
                {social.text} {/* Replace with actual icons later */}
              </a>
            ))}
          </div>
        </div>
      </div>
      <div className={`text-center ${themeColors.grayText} pt-8 mt-8 border-t ${themeColors.borderColor} text-sm`}>
        <p>&copy; {new Date().getFullYear()} LingoRoots. All rights reserved.</p>
      </div>
    </footer>
  );
};

export default Footer;