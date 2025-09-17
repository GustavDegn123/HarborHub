// /services/jobsService.js
import { db } from "../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
  onSnapshot,
} from "firebase/firestore";
import { distanceBetween } from "geofire-common";

const CHUNK_SIZE = 10;

/**
 * Hent provider info fra Firestore
 * @param {string} uid - Provider UID
 * @returns {Promise<object>} Provider-data eller tomt object
 */
export async function getProvider(uid) {
  const snap = await getDoc(doc(db, "providers", uid));
  return snap.exists() ? snap.data() : {};
}

/**
 * Hent jobs for en provider baseret på services + afstand
 * OBS: Dette er en *engangsforespørgsel*, ikke live.
 *
 * @param {string} uid - Provider UID
 * @returns {Promise<Array<object>>} Liste af jobs
 */
export async function getJobsForProvider(uid) {
  const prov = await getProvider(uid);
  const services = Array.isArray(prov?.services) ? prov.services : [];

  if (services.length === 0) return [];

  // Split services i chunks pga Firestore "in" begrænsning (max 10)
  const chunks = [];
  for (let i = 0; i < services.length; i += CHUNK_SIZE) {
    chunks.push(services.slice(i, i + CHUNK_SIZE));
  }

  let all = [];
  for (const c of chunks) {
    const qRef = query(
      collection(db, "jobs"),
      where("status", "==", "open"),
      where("serviceId", "in", c),
      limit(50)
    );
    const snap = await getDocs(qRef);
    snap.forEach((d) => all.push({ id: d.id, ...d.data() }));
  }

  // Sortering: afstand først, ellers createdAt
  if (prov?.geo?.lat && prov?.geo?.lng) {
    const base = [prov.geo.lat, prov.geo.lng];
    all = all.map((j) => {
      let km = null;
      if (j?.geo?.lat && j?.geo?.lng) {
        km = distanceBetween(base, [j.geo.lat, j.geo.lng]);
      }
      return { ...j, distanceKm: km };
    });

    all.sort((a, b) => {
      if (a.distanceKm != null && b.distanceKm != null)
        return a.distanceKm - b.distanceKm;
      if (a.distanceKm != null) return -1;
      if (b.distanceKm != null) return 1;
      const ta = a?.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tb = b?.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tb - ta;
    });
  } else {
    all.sort((a, b) => {
      const ta = a?.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
      const tb = b?.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
      return tb - ta;
    });
  }

  return all;
}

/**
 * Live-lyt på alle åbne jobs
 * @param {function} callback - Kaldes med jobs-array
 * @param {function} errorCallback - Kaldes ved fejl
 * @returns {function} unsubscribe - Stopper listener
 */
export function listenOpenJobs(callback, errorCallback) {
  const q = query(collection(db, "jobs"), where("status", "==", "open"), limit(200));

  return onSnapshot(
    q,
    (snap) => {
      const jobs = [];
      snap.forEach((d) => jobs.push({ id: d.id, ...d.data() }));
      callback(jobs);
    },
    (error) => {
      if (errorCallback) errorCallback(error);
    }
  );
}
