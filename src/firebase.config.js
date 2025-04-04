import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, addDoc, setDoc, doc, getDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
  authDomain:import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
  projectId:  import.meta.env.VITE_FIREBASE_PROJECT_ID,
  storageBucket:  import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
  appId:  import.meta.env.VITE_FIREBASE_APP_ID,
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID,
};

// Initialize Firebase
const app = initializeApp(firebaseConfig);

// Initialize Services
export const auth = getAuth(app);
export const googleProvider = new GoogleAuthProvider();
export const db = getFirestore(app);
export const storage = getStorage(app);
export const functions = getFunctions(app);

// Collection references
export const usersCollection = collection(db, "users");
export const jobPostingsCollection = collection(db, "jobPostings");
export const skillTrendsCollection = collection(db, "skillTrends");
export const userRecommendationsCollection = collection(db, "userRecommendations");
export const searchHistoryCollection = collection(db, "searchHistory");

// Save search history function
export const saveSearchHistory = async (userId, searchQuery, metadata = {}) => {
  try {
    const searchData = {
      userId,
      searchQuery,
      timestamp: new Date(),
      ...metadata
    };
    
    await addDoc(searchHistoryCollection, searchData);
  } catch (error) {
    console.error("Error saving search history:", error);
  }
};

// The rest of your Firebase config remains the same...

export default app;