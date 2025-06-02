// src/components/ProgressTracker.jsx
import React, { useEffect, useState } from 'react';
import { getUserProgress } from '../services/progressService';
import { awardAchievement } from '../services/achievementsService';

const ProgressTracker = ({ userId }) => {
  const [progress, setProgress] = useState({
    lessonsCompleted: [],
    quizzesCompleted: [],
    flashcardsReviewed: 0
  });

  useEffect(() => {
    const fetchProgress = async () => {
      const userProgress = await getUserProgress(userId);
      setProgress(userProgress);
      await awardAchievement(currentUser.uid, 'first_lesson', 10);
    };
    fetchProgress();
  }, [userId]);

  return (
    <div className="p-4">
      <h2 className="text-xl font-bold mb-2">Your Progress</h2>
      <p>Lessons Completed: {progress.lessonsCompleted.length}</p>
      <p>Quizzes Completed: {progress.quizzesCompleted.length}</p>
      <p>Flashcards Reviewed: {progress.flashcardsReviewed}</p>
    </div>
  );
};

export default ProgressTracker;
