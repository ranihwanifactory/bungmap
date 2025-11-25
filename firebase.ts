import { initializeApp } from "firebase/app";
import { getFirestore } from "firebase/firestore";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getStorage } from "firebase/storage";

// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyD8dsOCAgQULxE_PMc-_M0we-3fGdCA7uY",
  authDomain: "foodmap-347b3.firebaseapp.com",
  projectId: "foodmap-347b3",
  storageBucket: "foodmap-347b3.firebasestorage.app",
  messagingSenderId: "480140006620",
  appId: "1:480140006620:web:08e02966aed64d3e521019"
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);
export const db = getFirestore(app);
export const auth = getAuth(app);
export const storage = getStorage(app);
export const googleProvider = new GoogleAuthProvider();