// src/services/achievementsService.js
import { doc, getDoc, setDoc, updateDoc, arrayUnion, increment } from 'firebase/firestore';
import { db } from './firebase';

export async function awardAchievement(userId, badge, points) {
  const achievementRef = doc(db, 'achievements', userId);
  const achievementSnap = await getDoc(achievementRef);

  if (achievementSnap.exists()) {
    await updateDoc(achievementRef, {
      badges: arrayUnion(badge),
      points: increment(points),
    });
  } else {
    await setDoc(achievementRef, {
      badges: [badge],
      points: points,
    });
  }
}
