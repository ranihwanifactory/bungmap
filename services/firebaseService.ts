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
  // Use orderBy to sort by date on the server side.
  // NOTE: This requires a Composite Index in Firestore (storeId ASC, createdAt DESC).
  // Check the browser console for the link to create this index automatically.
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

export const updateReview = async (reviewId: string, data: Partial<Review>): Promise<void> => {
  const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
  await updateDoc(reviewRef, data);
};

export const deleteReview = async (reviewId: string): Promise<void> => {
  const reviewRef = doc(db, REVIEWS_COLLECTION, reviewId);
  await deleteDoc(reviewRef);
};
