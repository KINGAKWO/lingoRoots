import { getFirestore, collection, getDocs } from 'firebase/firestore';

const db = getFirestore();

export const fetchLanguages = async () => {
  const langCollection = collection(db, 'languages');
  const langSnapshot = await getDocs(langCollection);
  return langSnapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
};
