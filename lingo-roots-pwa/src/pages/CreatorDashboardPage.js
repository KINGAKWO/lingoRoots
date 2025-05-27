import React from 'react';
import { Link } from 'react-router-dom'; // Import Link for navigation
import { FaPlusSquare, FaEdit, FaListAlt, FaChalkboardTeacher, FaQuestionCircle, FaUserShield } from 'react-icons/fa'; // Example icons

const CreatorDashboardPage = () => {
  // Placeholder for user role check, actual implementation will be in App.js or a HOC
  // For now, we assume the user has the 'contentCreator' role if they reach this page.

  const navItems = [
    { name: 'Manage Languages', path: '/creator/languages', icon: <FaListAlt className="mr-2" /> },
    { name: 'Create New Language', path: '/creator/languages/new', icon: <FaPlusSquare className="mr-2" /> },
    { name: 'Manage Lessons', path: '/creator/lessons', icon: <FaChalkboardTeacher className="mr-2" /> },
    { name: 'Create New Lesson', path: '/creator/lessons/new', icon: <FaPlusSquare className="mr-2" /> },
    { name: 'Manage Quizzes', path: '/creator/quizzes', icon: <FaQuestionCircle className="mr-2" /> },
    { name: 'Create New Quiz', path: '/creator/quizzes/new', icon: <FaPlusSquare className="mr-2" /> },
    // Future: { name: 'User Management', path: '/admin/users', icon: <FaUserShield className="mr-2" /> }
  ];

  return (
    <div className="min-h-screen bg-light-gray p-4 sm:p-6 lg:p-8">
      <header className="mb-8">
        <h1 className="text-3xl font-bold text-marine-blue">Creator Dashboard</h1>
        <p className="text-gray-700">Welcome! Manage your educational content efficiently.</p>
      </header>

      <nav className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
        {navItems.map((item) => (
          <Link
            key={item.name}
            to={item.path}
            className="flex items-center p-6 bg-white rounded-lg shadow-md hover:shadow-lg transition-shadow duration-300 ease-in-out text-marine-blue hover:text-ocean-green"
          >
            {item.icon}
            <span className="text-lg font-semibold">{item.name}</span>
          </Link>
        ))}
      </nav>

      {/* Placeholder for future content sections or widgets */}
      <div className="mt-10 p-6 bg-white rounded-lg shadow-md">
        <h2 className="text-xl font-semibold text-marine-blue mb-4">Quick Stats (Placeholder)</h2>
        <p className="text-gray-600">Languages: 5</p>
        <p className="text-gray-600">Lessons: 50</p>
        <p className="text-gray-600">Quizzes: 25</p>
      </div>
    </div>
  );
};

export default CreatorDashboardPage;