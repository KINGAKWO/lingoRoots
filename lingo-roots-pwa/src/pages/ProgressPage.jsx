// src/pages/ProgressPage.jsx
import React from 'react';
import ProgressTracker from '../components/ProgressTracker';
import { useAuth } from '../contexts/AuthContext';

const ProgressPage = () => {
  const { currentUser } = useAuth();

  return (
    <div className="p-4">
      <h1 className="text-2xl font-bold mb-4">Progress Overview</h1>
      {currentUser ? (
        <ProgressTracker userId={currentUser.uid} />
      ) : (
        <p>Please log in to view your progress.</p>
      )}
    </div>
  );
};

export default ProgressPage;
