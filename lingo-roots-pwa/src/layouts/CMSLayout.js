import React from 'react';
import { Link } from 'react-router-dom';

const CMSLayout = ({ children }) => {
  return (
    <div className="min-h-screen bg-gray-100">
      <header className="bg-white shadow p-4 flex justify-between items-center">
        <h1 className="text-xl font-bold">🛠️ CMS Dashboard</h1>
        <nav className="space-x-4">
          <Link to="/cms/lessons" className="text-blue-600 hover:underline">
            Lessons
          </Link>
          <Link to="/cms/quizzes" className="text-blue-600 hover:underline">
            Quizzes
          </Link>
          <Link to="/cms/languages" className="text-blue-600 hover:underline">
            Languages
          </Link>
        </nav>
      </header>

      <main className="p-6 max-w-6xl mx-auto">
        {children}
      </main>
    </div>
  );
};

export default CMSLayout;
