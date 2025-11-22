import { db } from '../firebase';
import { collection, getDocs, addDoc, query, where, orderBy, doc, updateDoc, deleteDoc } from 'firebase/firestore';
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

export const updateStore = async (storeId: string, data: Partial<Store>): Promise<void> => {
  const storeRef = doc(db, STORES_COLLECTION, storeId);
  await updateDoc(storeRef, data);
};

export const deleteStore = async (storeId: string): Promise<void> => {
  const storeRef = doc(db, STORES_COLLECTION, storeId);
  await deleteDoc(storeRef);
};

export const getReviews = async (storeId: string): Promise<Review[]> => {
  // NOTE: Changed to client-side sorting to avoid "Missing Index" errors in Firestore
  // when combining where() and orderBy().
  const q = query(
    collection(db, REVIEWS_COLLECTION),
    where('storeId', '==', storeId)
  );
  
  const querySnapshot = await getDocs(q);
  const reviews = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Review));

  // Sort by createdAt desc (newest first) in memory
  return reviews.sort((a, b) => b.createdAt - a.createdAt);
};

export const addReview = async (reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<string> => {
  const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
    ...reviewData,
    createdAt: Date.now()
  });
  return docRef.id;
};