import React from 'react';
import Navbar from '../components/shared/Navbar'; // Corrected path
import Footer from '../components/shared/Footer'; // Corrected path

const MainLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-50 dark:bg-gray-900">
      <Navbar />
      {/* Main content area: responsive padding, grows to fill space */}
      <main 
        className="flex-grow container mx-auto px-4 py-6 sm:px-6 sm:py-8 lg:px-8 lg:py-10"
        role="main" // ARIA role for main content
      >
        {/* Optional: Add a wrapper for content styling if needed, or apply directly to children's parent */}
        {/* This example keeps the children directly, assuming they handle their own background/card styling */}
        {/* If a consistent card-like appearance is desired for all pages, a wrapper div can be added here: */}
        {/* <div className="bg-white dark:bg-gray-800 shadow-lg rounded-lg p-4 sm:p-6 lg:p-8"> */}
        {/*   {children} */}
        {/* </div> */}
        {children} 
      </main>
      <Footer />
    </div>
  );
};

export default MainLayout;