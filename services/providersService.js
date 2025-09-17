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
  onSnapshot,
} from "firebase/firestore";

/** Gem provider-profil */
export async function saveProviderProfile(userId, profileData) {
  const payload = { ...profileData, updatedAt: serverTimestamp() };
  await setDoc(doc(db, "providers", userId), payload, { merge: true });
}

/** Sæt brugerens rolle */
export async function setUserRole(userId, role) {
  await setDoc(
    doc(db, "users", userId),
    { role, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/** Hent provider-profil */
export async function getProviderProfile(userId) {
  const snap = await getDoc(doc(db, "providers", userId));
  return snap.exists() ? snap.data() : null;
}

/** Gem valgte services */
export async function saveProviderServices(userId, servicesArray) {
  await setDoc(
    doc(db, "providers", userId),
    { services: servicesArray, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/** Hent alle services */
export async function getAvailableServices() {
  const snap = await getDocs(collection(db, "services"));
  return snap.empty ? [] : snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Hent jobs hvor provider har claimed */
export async function getProviderJobs(uid, max = 100) {
  const q = query(collection(db, "jobs"), where("acceptedBy", "==", uid), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Live-lyt jobs */
export function listenProviderJobs(uid, callback, errorCallback) {
  const q = query(collection(db, "jobs"), where("acceptedBy", "==", uid), limit(200));
  return onSnapshot(
    q,
    (snap) => {
      const jobs = [];
      snap.forEach((d) => jobs.push({ id: d.id, ...d.data() }));
      jobs.sort(
        (a, b) =>
          (b?.createdAt?.toMillis?.() || 0) - (a?.createdAt?.toMillis?.() || 0)
      );
      callback(jobs);
    },
    errorCallback
  );
}

/** Hent payouts */
export async function getProviderPayouts(uid, max = 50) {
  const q = query(collection(db, "providers", uid, "payouts"), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Hent reviews */
export async function getProviderReviews(uid, max = 50) {
  const q = query(collection(db, "reviews"), where("providerId", "==", uid), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Live-lyt reviews */
export function listenProviderReviews(uid, callback, errorCallback) {
  const q = query(collection(db, "reviews"), where("providerId", "==", uid), limit(200));
  return onSnapshot(
    q,
    (snap) => {
      const reviews = [];
      snap.forEach((d) => reviews.push({ id: d.id, ...d.data() }));
      reviews.sort(
        (a, b) =>
          (b?.createdAt?.toMillis?.() || 0) - (a?.createdAt?.toMillis?.() || 0)
      );
      callback(reviews);
    },
    errorCallback
  );
}
