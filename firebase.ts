import { initializeApp } from "firebase/app";
import { getDatabase } from "firebase/database";
import { getAuth, GoogleAuthProvider } from "firebase/auth";

const firebaseConfig = {
  apiKey: "AIzaSyD8dsOCAgQULxE_PMc-_M0we-3fGdCA7uY",
  authDomain: "foodmap-347b3.firebaseapp.com",
  databaseURL: "https://foodmap-347b3-default-rtdb.firebaseio.com",
  projectId: "foodmap-347b3",
  storageBucket: "foodmap-347b3.firebasestorage.app",
  messagingSenderId: "480140006620",
  appId: "1:480140006620:web:08e02966aed64d3e521019"
};

const app = initializeApp(firebaseConfig);
export const db = getDatabase(app);
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();