// src/components/lessons/LessonCompleteButton.jsx
import React from 'react';
import { addBadgeToUser, incrementUserPoints } from '../../services/achievementsService';
import { useAuthState } from 'react-firebase-hooks/auth';
import { auth } from '../../services/firebase';

const LessonCompleteButton = () => {
  const [user] = useAuthState(auth);

  const handleComplete = async () => {
    if (user) {
      await addBadgeToUser(user.uid, 'LessonMaster');
      await incrementUserPoints(user.uid, 20);
      alert('Achievement Updated!');
    }
  };

  return (
    <button onClick={handleComplete} className="p-2 bg-green-500 text-white rounded">
      Complete Lesson
    </button>
  );
};

export default LessonCompleteButton;
