import { collection, query, orderBy, limit, getDocs } from 'firebase/firestore';
import { db } from './firebase';

export const getTopUsers = async (limitNumber = 10) => {
  const q = query(collection(db, 'leaderboards'), orderBy('points', 'desc'), limit(limitNumber));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => doc.data());
};
