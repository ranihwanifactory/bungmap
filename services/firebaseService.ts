import { db } from '../firebase';
import { collection, getDocs, addDoc, query, where, orderBy, doc, getDoc } from 'firebase/firestore';
import { Store, Review } from '../types';

const STORES_COLLECTION = 'stores';
const REVIEWS_COLLECTION = 'reviews';

export const getStores = async (): Promise<Store[]> => {
  try {
    const q = query(collection(db, STORES_COLLECTION));
    const querySnapshot = await getDocs(q);
    return querySnapshot.docs.map(doc => ({
      id: doc.id,
      ...doc.data()
    } as Store));
  } catch (error) {
    console.error("Error getting stores: ", error);
    return [];
  }
};

export const addStore = async (storeData: Omit<Store, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, STORES_COLLECTION), {
      ...storeData,
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding store: ", error);
    throw error;
  }
};

export const getReviews = async (storeId: string): Promise<Review[]> => {
  try {
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
  } catch (error) {
    console.error("Error getting reviews: ", error);
    return [];
  }
};

export const addReview = async (reviewData: Omit<Review, 'id' | 'createdAt'>): Promise<string> => {
  try {
    const docRef = await addDoc(collection(db, REVIEWS_COLLECTION), {
      ...reviewData,
      createdAt: Date.now()
    });
    return docRef.id;
  } catch (error) {
    console.error("Error adding review: ", error);
    throw error;
  }
};
