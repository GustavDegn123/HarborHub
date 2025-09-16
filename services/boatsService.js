// /services/boatsService.js
import { db } from "../firebase";
import { collection, addDoc, serverTimestamp } from "firebase/firestore";

export async function addBoat(ownerId, boatData) {
  const boatsRef = collection(db, "owners", ownerId, "boats");
  const docRef = await addDoc(boatsRef, {
    ...boatData,
    created_at: serverTimestamp(),
  });
  return docRef.id;
}
