import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider } from "firebase/auth";
import { getFirestore, collection, query, where, getDocs, addDoc, setDoc, doc, getDoc } from "firebase/firestore";
import { getStorage } from "firebase/storage";
import { getFunctions } from "firebase/functions";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKfJZidtjwXl-3m4-pz0lQhl9IV2DXYfA",
  authDomain: "backend-stuff-ee071.firebaseapp.com",
  projectId: "backend-stuff-ee071",
  storageBucket: "backend-stuff-ee071.appspot.com",
  messagingSenderId: "449147492921",
  appId: "1:449147492921:web:8164eb6d56debfe0f38be8",
  measurementId: "G-WJ2WKR5ZPT",
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