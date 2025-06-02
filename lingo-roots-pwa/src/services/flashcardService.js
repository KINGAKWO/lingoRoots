import { getFirestore, collection, getDocs } from 'firebase/firestore';

const db = getFirestore();

export const fetchFlashcards = async (lessonId) => {
  const flashcardsCollection = collection(db, `lessons/${lessonId}/flashcards`);
  const flashcardsSnapshot = await getDocs(flashcardsCollection);
  return flashcardsSnapshot.docs.map(doc => doc.data());
};
