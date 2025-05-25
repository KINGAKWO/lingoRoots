import React from 'react';
import Navbar from '../components/Navbar';
import Footer from '../components/Footer';

const MainLayout = ({ children }) => {
  return (
    <div className="flex flex-col min-h-screen bg-gray-100">
      <Navbar /> {/* Navbar will be made sticky in its own component */}
      {/* The main content area will grow and allow scrolling if content overflows */}
      <main className="flex-grow overflow-y-auto container mx-auto px-4 sm:px-6 lg:px-8 py-8">
        <div className="bg-white shadow-md rounded-lg p-6">
          {children}
        </div>
      </main>
      <Footer /> {/* Footer will be at the bottom */}
    </div>
  );
};

export default MainLayout;