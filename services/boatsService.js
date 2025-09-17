// /services/boatsService.js
import { db } from "../firebase";
import {
  collection,
  addDoc,
  getDocs,
  getDoc,
  doc,
  updateDoc,
  deleteDoc,
  serverTimestamp,
} from "firebase/firestore";

/** Tilføj en ny båd */
export async function addBoat(ownerId, boatData) {
  const boatsRef = collection(db, "owners", ownerId, "boats");
  const docRef = await addDoc(boatsRef, {
    ...boatData,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return docRef.id;
}

/** Hent alle både for en ejer */
export async function getBoats(ownerId) {
  const ref = collection(db, "owners", ownerId, "boats");
  const snap = await getDocs(ref);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export async function getBoat(ownerId, boatId) {
  const ref = doc(db, "owners", ownerId, "boats", boatId);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Opdater båd */
export async function updateBoat(ownerId, boatId, data) {
  const ref = doc(db, "owners", ownerId, "boats", boatId);
  await updateDoc(ref, { ...data, updated_at: serverTimestamp() });
}

/** Slet båd */
export async function deleteBoat(ownerId, boatId) {
  const ref = doc(db, "owners", ownerId, "boats", boatId);
  await deleteDoc(ref);
}
