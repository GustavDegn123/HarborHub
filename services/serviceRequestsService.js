// /services/serviceRequestsService.js
import { db } from "../firebase";
import {
  collection,
  query,
  where,
  limit,
  onSnapshot,
  getDocs,
  doc,
  getDoc,
} from "firebase/firestore";

/**
 * Hent provider-profil (bruges til geo osv.)
 */
export async function getProvider(uid) {
  const snap = await getDoc(doc(db, "providers", uid));
  return snap.exists() ? snap.data() : {};
}

/**
 * Live-lyt på åbne service_requests
 */
export function listenOpenServiceRequests(callback, errorCallback) {
  const q = query(
    collection(db, "service_requests"),
    where("status", "==", "open"),
    limit(200)
  );

  return onSnapshot(
    q,
    (snap) => {
      const requests = [];
      snap.forEach((d) => requests.push({ id: d.id, ...d.data() }));
      callback(requests);
    },
    (error) => {
      if (errorCallback) errorCallback(error);
    }
  );
}

/**
 * Engangsforespørgsel på åbne service_requests
 */
export async function getOpenServiceRequests(max = 100) {
  const q = query(
    collection(db, "service_requests"),
    where("status", "==", "open"),
    limit(max)
  );
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}
