// Import Firebase modules
import { initializeApp } from "firebase/app";
import { getAuth, GoogleAuthProvider, signInWithPopup } from "firebase/auth";
import { getFirestore, doc, getDoc, setDoc } from "firebase/firestore";
import { getAnalytics } from "firebase/analytics";

// Your Firebase configuration
const firebaseConfig = {
  apiKey: import.meta.env.VITE_FIREBASE_API_KEY || "AIzaSyBrYJYI93j_sh0jxo0qMdHqzq0u1aFyA-Q",
  authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN || "upi1-b605a.firebaseapp.com",
  projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID || "upi1-b605a",
  storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET || "upi1-b605a.firebasestorage.app",
  messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID || "769072686959",
  appId: import.meta.env.VITE_FIREBASE_APP_ID || "1:769072686959:web:b3822b7033be03e1b82a9a",
  measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID || "G-W8GSNBF182"
};

// Initialize Firebase with error handling
let app, auth, db, analytics;
let firebaseInitialized = false;

try {
  console.log("Firebase config being used:", firebaseConfig);
  console.log("Environment variables:", {
    VITE_FIREBASE_API_KEY: import.meta.env.VITE_FIREBASE_API_KEY,
    VITE_FIREBASE_AUTH_DOMAIN: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    VITE_FIREBASE_PROJECT_ID: import.meta.env.VITE_FIREBASE_PROJECT_ID
  });
  
  // Initialize core Firebase services
  app = initializeApp(firebaseConfig);
  auth = getAuth(app);
  db = getFirestore(app);
  
  // Configure auth settings
  auth.useDeviceLanguage();
  
  console.log("Firebase core services initialized successfully");
  console.log("Auth domain:", firebaseConfig.authDomain);
  console.log("Project ID:", firebaseConfig.projectId);
  
  // Initialize analytics separately to prevent blocking core services
  try {
    analytics = getAnalytics(app);
    console.log("Firebase Analytics initialized successfully");
  } catch (analyticsError) {
    console.warn("Firebase Analytics initialization failed (this is non-critical):", analyticsError.message);
    console.warn("This is common with adblockers, privacy settings, or localhost development");
    analytics = null; // Set to null instead of throwing
  }
  
  // Mark Firebase as successfully initialized
  firebaseInitialized = true;
  
} catch (error) {
  console.error("Firebase core initialization error:", error);
  console.error("Error details:", error.message, error.code);
  console.error("Firebase initialization failed - this is a critical error that will prevent the app from functioning properly");
  
  // Set initialization status to false
  firebaseInitialized = false;
  
  // Rethrow the error to fail fast - Firebase is critical for this application
  throw new Error(`Firebase initialization failed: ${error.message}. Please check your Firebase configuration and network connection.`);
}

export { auth, db, analytics, firebaseInitialized };
