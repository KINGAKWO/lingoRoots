// src/services/achievementsService.js

import { doc, setDoc, getDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from './firebase';

// Initialize the achievement document if not existing
export const initUserAchievements = async (uid) => {
  const ref = doc(db, 'achievements', uid);
  const snapshot = await getDoc(ref);
  if (!snapshot.exists()) {
    await setDoc(ref, {
      points: 0,
      badges: [],
      milestonesCompleted: []
    });
  }
};

// Award a badge
export const awardBadge = async (uid, badgeName) => {
  const ref = doc(db, 'achievements', uid);
  await updateDoc(ref, {
    badges: arrayUnion(badgeName)
  });
};

// Add points
export const addPoints = async (uid, points) => {
  const ref = doc(db, 'achievements', uid);
  await updateDoc(ref, {
    points: increment(points)
  });
};

// Mark a milestone completed
export const completeMilestone = async (uid, milestoneId) => {
  const ref = doc(db, 'achievements', uid);
  await updateDoc(ref, {
    milestonesCompleted: arrayUnion(milestoneId)
  });
};
