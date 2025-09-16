import { auth, db } from "../firebase";
import { doc, setDoc, getDoc } from "firebase/firestore";
import {
  createUserWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
} from "firebase/auth";

// Signup med email/password
export const signUpUser = async (email, password, name, role, phone, location) => {
  const userCredential = await createUserWithEmailAndPassword(auth, email, password);
  const user = userCredential.user;

  await setDoc(doc(db, "users", user.uid), {
    name,
    email,
    phone,
    role,
    location,
    created_at: new Date(),
    updated_at: new Date(),
  });

  return user;
};

// Håndter login med Google-credential (når vi får token fra UI)
export const firebaseGoogleLogin = async (idToken) => {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);

  // Hvis ny bruger → opret i Firestore
  const userDoc = await getDoc(doc(db, "users", result.user.uid));
  if (!userDoc.exists()) {
    await setDoc(doc(db, "users", result.user.uid), {
      name: result.user.displayName,
      email: result.user.email,
      role: "provider", // default fx
      created_at: new Date(),
      updated_at: new Date(),
    });
  }

  return result.user;
};
