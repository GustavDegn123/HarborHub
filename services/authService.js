// services/authService.js
import { auth, db } from "../firebase";
import { doc, setDoc } from "firebase/firestore";
import { createUserWithEmailAndPassword } from "firebase/auth";

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
