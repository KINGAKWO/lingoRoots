import { getFirestore, collection, getDocs } from 'firebase/firestore';

const db = getFirestore();

export const fetchQuiz = async (lessonId) => {
  const quizCollection = collection(db, `lessons/${lessonId}/quizzes`);
  const quizSnapshot = await getDocs(quizCollection);
  return quizSnapshot.docs.map(doc => doc.data());
};
