// firebase.js
import { initializeApp } from "firebase/app";
import { getAuth } from "firebase/auth";
import { getFirestore } from "firebase/firestore";

// Din Firebase config
const firebaseConfig = {
  apiKey: "AIzaSyCyiOE2Wa5FJYy7mwt3yTdaMPGQI-qIcqg",
  authDomain: "harborhub-f15de.firebaseapp.com",
  projectId: "harborhub-f15de",
  storageBucket: "harborhub-f15de.appspot.com", // 🔥 ændret: skal slutte med .appspot.com
  messagingSenderId: "16622525056",
  appId: "1:16622525056:web:cc30d1c66367b08cfa2465",
  measurementId: "G-S53BY4B59T"
};

// Init Firebase
const app = initializeApp(firebaseConfig);

// Eksportér services
export const auth = getAuth(app);
export const db = getFirestore(app);
