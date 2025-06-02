// src/services/progressService.js
import { getFirestore, doc, getDoc, setDoc, updateDoc, arrayUnion } from 'firebase/firestore';
import { getAuth } from 'firebase/auth';

const db = getFirestore();
const auth = getAuth();

export const initializeUserProgress = async () => {
    const user = auth.currentUser;
    if (!user) return;
  
    const progressRef = doc(db, 'progress', user.uid);
    const progressSnap = await getDoc(progressRef);
  
    if (!progressSnap.exists()) {
      await setDoc(progressRef, {
        lessonsCompleted: [],
        quizzesCompleted: [],
        flashcardsReviewed: 0,
      });
      console.log(`Initialized progress for user: ${user.uid}`);
    }
  };


export const getUserProgress = async (userId) => {
  const progressRef = doc(db, 'progress', userId);
  const progressSnap = await getDoc(progressRef);
  if (progressSnap.exists()) {
    return progressSnap.data();
  } else {
    await setDoc(progressRef, {
      lessonsCompleted: [],
      quizzesCompleted: [],
      flashcardsReviewed: 0
    });
    return {
      lessonsCompleted: [],
      quizzesCompleted: [],
      flashcardsReviewed: 0
    };
  }
};

export const updateLessonProgress = async (userId, lessonId) => {
  const progressRef = doc(db, 'progress', userId);
  await updateDoc(progressRef, {
    lessonsCompleted: arrayUnion(lessonId)
  });
};

export const updateQuizProgress = async (userId, quizId) => {
  const progressRef = doc(db, 'progress', userId);
  await updateDoc(progressRef, {
    quizzesCompleted: arrayUnion(quizId)
  });
};

export const incrementFlashcardsReviewed = async (userId, count) => {
  const progressRef = doc(db, 'progress', userId);
  const progressSnap = await getDoc(progressRef);
  if (progressSnap.exists()) {
    const currentCount = progressSnap.data().flashcardsReviewed || 0;
    await updateDoc(progressRef, {
      flashcardsReviewed: currentCount + count
    });
  }
};
