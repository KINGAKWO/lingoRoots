import { getFirestore, collection, getDocs } from 'firebase/firestore';

const db = getFirestore();

export const fetchLessons = async (languageId) => {
  const lessonsCollection = collection(db, `languages/${languageId}/lessons`);
  const lessonsSnapshot = await getDocs(lessonsCollection);
  return lessonsSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
