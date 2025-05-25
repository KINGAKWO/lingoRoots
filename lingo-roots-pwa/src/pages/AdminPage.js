import React from 'react';

const AdminPage = () => {
  return (
    <div className="min-h-screen bg-gray-100 flex flex-col justify-center items-center">
      <div className="bg-white p-8 rounded-lg shadow-md w-full max-w-md text-center">
        <h1 className="text-2xl font-bold text-gray-800 mb-4">Administrator Dashboard</h1>
        <p className="text-gray-600 mb-6">Welcome, Admin! This is your control panel.</p>
        {/* Admin-specific content and functionalities will go here */}
        <div className="mt-6">
          <button 
            className="bg-marine-blue hover:bg-sky-blue text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => alert('Manage Users Clicked!')} // Placeholder action
          >
            Manage Users
          </button>
          <button 
            className="ml-4 bg-marine-blue hover:bg-sky-blue text-white font-bold py-2 px-4 rounded focus:outline-none focus:shadow-outline"
            onClick={() => alert('Manage Content Clicked!')} // Placeholder action
          >
            Manage Content
          </button>
        </div>
      </div>
    </div>
  );
};

export default AdminPage;