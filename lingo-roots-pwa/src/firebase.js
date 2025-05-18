// Import the functions you need from the SDKs you need
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";


// Your web app's Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCKX7h5X5ypyot9HUZBLxWRNjOn2T3j-rI",
  authDomain: "lingoroots-30066.firebaseapp.com",
  projectId: "lingoroots-30066",
  storageBucket: "lingoroots-30066.firebasestorage.app",
  messagingSenderId: "100987690274",
  appId: "1:100987690274:web:876393787c77e6f32ad97b"
};

// Initialize Firebase
export const app = initializeApp(firebaseConfig);

// Export Firebase services
export const auth = getAuth(app);
export const db = getFirestore(app);
export const storage = getStorage(app); // Added for future use

export default app; // You can still export app if needed directly
