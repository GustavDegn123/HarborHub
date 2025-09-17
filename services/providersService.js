// /services/providersService.js
import { db } from "../firebase";
import {
  doc,
  setDoc,
  getDoc,
  getDocs,
  collection,
  serverTimestamp,
  query,
  where,
  limit,
} from "firebase/firestore";

/**
 * Gem provider-profil (adresse, geo, km osv.)
 */
export async function saveProviderProfile(userId, profileData) {
  const payload = {
    ...profileData,
    updatedAt: serverTimestamp(),
  };
  await setDoc(doc(db, "providers", userId), payload, { merge: true });
}

/**
 * Opdater brugerens rolle
 */
export async function setUserRole(userId, role) {
  await setDoc(
    doc(db, "users", userId),
    { role, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/**
 * Hent provider-profil
 */
export async function getProviderProfile(userId) {
  const snap = await getDoc(doc(db, "providers", userId));
  return snap.exists() ? snap.data() : null;
}

/**
 * Gem valgte services for provider
 */
export async function saveProviderServices(userId, servicesArray) {
  await setDoc(
    doc(db, "providers", userId),
    { services: servicesArray, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/**
 * Hent liste over alle tilgængelige services
 */
export async function getAvailableServices() {
  const snap = await getDocs(collection(db, "services"));
  if (snap.empty) return [];
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Hent jobs hvor provider har claimed dem
 */
export async function getProviderJobs(uid, max = 100) {
  const q = query(collection(db, "jobs"), where("claimedBy", "==", uid), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Hent payouts for provider
 */
export async function getProviderPayouts(uid, max = 50) {
  const q = query(collection(db, "providers", uid, "payouts"), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/**
 * Hent reviews af provider
 */
export async function getProviderReviews(uid, max = 50) {
  const q = query(collection(db, "reviews"), where("providerId", "==", uid), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
