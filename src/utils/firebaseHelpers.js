import { collection, query, getDocs, doc, getDoc, setDoc, updateDoc } from "firebase/firestore";
import { db, auth } from "../firebase.config";

/**
 * Fetches daily challenges from Firestore
 * @returns {Promise<Array>} Array of daily challenges
 */
export const getDailyChallenges = async () => {
  try {
    const challengesRef = collection(db, "dailyChallenges");
    const q = query(challengesRef);
    const querySnapshot = await getDocs(q);
    
    const challenges = [];
    querySnapshot.forEach((doc) => {
      challenges.push({
        id: doc.id,
        ...doc.data()
      });
    });
    
    return challenges;
  } catch (error) {
    console.error("Error fetching daily challenges:", error);
    throw error;
  }
};

/**
 * Saves user's progress on a challenge
 * @param {string} challengeId - The ID of the challenge
 * @param {Object} progress - Progress data to save
 * @returns {Promise<void>}
 */
export const saveChallengeProgress = async (challengeId, progress) => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const userProgressRef = doc(db, "users", user.uid, "challengeProgress", challengeId);
    const docSnap = await getDoc(userProgressRef);
    
    if (docSnap.exists()) {
      await updateDoc(userProgressRef, progress);
    } else {
      await setDoc(userProgressRef, {
        ...progress,
        startedAt: new Date(),
        userId: user.uid
      });
    }
  } catch (error) {
    console.error("Error saving challenge progress:", error);
    throw error;
  }
};

/**
 * Gets user's progress for all challenges
 * @returns {Promise<Object>} Object mapping challenge IDs to progress
 */
export const getUserChallengeProgress = async () => {
  try {
    const user = auth.currentUser;
    
    if (!user) {
      throw new Error("User not authenticated");
    }
    
    const progressRef = collection(db, "users", user.uid, "challengeProgress");
    const querySnapshot = await getDocs(progressRef);
    
    const progress = {};
    querySnapshot.forEach((doc) => {
      progress[doc.id] = doc.data();
    });
    
    return progress;
  } catch (error) {
    console.error("Error getting user challenge progress:", error);
    throw error;
  }
};

/**
 * Saves or updates user data in Firestore
 * @param {string} userId - The user ID
 * @param {Object} data - User data to save
 * @returns {Promise<void>}
 */
export const saveUserData = async (userId, data) => {
  try {
    if (!userId) {
      throw new Error("User ID is required");
    }
    
    const userRef = doc(db, "users", userId);
    const docSnap = await getDoc(userRef);
    
    if (docSnap.exists()) {
      // Update existing user document
      await updateDoc(userRef, {
        ...data,
        updatedAt: new Date()
      });
    } else {
      // Create new user document
      await setDoc(userRef, {
        ...data,
        createdAt: new Date(),
        updatedAt: new Date()
      });
    }
  } catch (error) {
    console.error("Error saving user data:", error);
    throw error;
  }
};