import { db, storage } from '../firebase';
import { collection, getDocs, addDoc, query, where, doc, updateDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
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

export const uploadImage = async (file: File): Promise<string> => {
  const storageRef = ref(storage, `store_images/${Date.now()}_${file.name}`);
  const snapshot = await uploadBytes(storageRef, file);
  return getDownloadURL(snapshot.ref);
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
  // 복합 인덱스(Composite Index) 오류를 방지하기 위해
  // DB에서는 필터링만 하고, 정렬은 클라이언트(Javascript)에서 수행합니다.
  const q = query(
    collection(db, REVIEWS_COLLECTION),
    where('storeId', '==', storeId)
  );
  
  const querySnapshot = await getDocs(q);
  const reviews = querySnapshot.docs.map(doc => ({
    id: doc.id,
    ...doc.data()
  } as Review));

  // 최신순 정렬 (Client-side sorting)
  return reviews.sort((a, b) => b.createdAt - a.createdAt);
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