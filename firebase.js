// firebase.js
import { initializeApp } from "firebase/app";
import { initializeAuth, getReactNativePersistence } from "firebase/auth";
import ReactNativeAsyncStorage from "@react-native-async-storage/async-storage";
import { getFirestore } from "firebase/firestore";
import { getStorage } from "firebase/storage";

// Din Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCyiOE2Wa5FJYy7mwt3yTdaMPGQI-qIcqg",
  authDomain: "harborhub-f15de.firebaseapp.com",
  projectId: "harborhub-f15de",
  storageBucket: "harborhub-f15de.firebasestorage.app",
  messagingSenderId: "16622525056",
  appId: "1:16622525056:web:cc30d1c66367b08cfa2465",
  measurementId: "G-S53BY4B59T",
};

// 👇 VIGTIGT: eksporter app
export const app = initializeApp(firebaseConfig);

// Auth
export const auth = initializeAuth(app, {
  persistence: getReactNativePersistence(ReactNativeAsyncStorage),
});

// Firestore
export const db = getFirestore(app);

// Storage
export const storage = getStorage(app);