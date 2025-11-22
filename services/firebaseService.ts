import { db } from '../firebase';
import { collection, getDocs, addDoc, query, where, orderBy } from 'firebase/firestore';
import { Store, Review } from '../types';

const STORES_COLLECTION = 'stores';
const REVIEWS_COLLECTION = 'reviews';

export const getStores = async (): Promise<Store[]> => {
  // Let errors propagate so App.tsx can handle permission issues
  const q = query(collection(db, STORES_COLLECTION));
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Store));
};

export const addStore = async (storeData: Omit<Store, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, STORES_COLLECTION), {
    ...storeData,
    createdAt: Date.now()
  });
  return docRef.id;
};

export const getReviews = async (storeId: string): Promise<Review[]> => {
  const q = query(
    collection(db, REVIEWS_COLLECTION),
    where('storeId', '==', storeId),
    orderBy('createdAt', 'desc')
  );
  const querySnapshot = await getDocs(q);
  return querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Review));
};

export const addReview = async (reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
    ...reviewData,
    createdAt: Date.now()
  });
  return docRef.id;
};