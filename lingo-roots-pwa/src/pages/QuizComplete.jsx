import React, { useEffect } from 'react';
import { addPoints, awardBadge, completeMilestone } from '../services/achievementsService';
import { useAuth } from '../context/AuthContext';

const QuizComplete = ({ quizId }) => {
  const { currentUser } = useAuth();

  useEffect(() => {
    const updateAchievements = async () => {
      const uid = currentUser?.uid;
      if (!uid) return;
      await addPoints(uid, 10);
      await completeMilestone(uid, quizId);
      await awardBadge(uid, 'quiz_master');
    };

    updateAchievements();
  }, [quizId, currentUser]);

  return <div>🎉 Quiz Complete! Your achievements have been updated.</div>;
};

export default QuizComplete;