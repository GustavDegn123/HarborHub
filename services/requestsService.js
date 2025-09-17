import { db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  doc,
  updateDoc,
  getDoc,
  serverTimestamp,
  limit,
  onSnapshot,
} from "firebase/firestore";

/** Opret en ny service request */
export async function addRequest(ownerId, boatId, data) {
  const ref = collection(db, "service_requests");
  const docRef = await addDoc(ref, {
    owner_id: ownerId,
    boat_id: boatId,
    service_type: data.service_type,
    description: data.description || "",
    budget: data.budget || null,       // 💰 Budget
    deadline: data.deadline || null,   // ⏰ Deadline eller "flexible"
    status: "open",
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  });
  return docRef.id;
}

/** Hent alle requests for en bestemt owner */
export async function getRequestsByOwner(ownerId) {
  const ref = collection(db, "service_requests");
  const q = query(ref, where("owner_id", "==", ownerId));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Hent én service request */
export async function getServiceRequest(id) {
  const snap = await getDoc(doc(db, "service_requests", id));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Opdater status på en request */
export async function updateRequestStatus(requestId, status) {
  const ref = doc(db, "service_requests", requestId);
  await updateDoc(ref, {
    status,
    updated_at: serverTimestamp(),
  });
}

/** Opdater en service request med vilkårlige felter */
export async function updateServiceRequest(id, data) {
  return updateDoc(doc(db, "service_requests", id), {
    ...data,
    updated_at: serverTimestamp(),
  });
}

/** Hent alle åbne requests */
export async function getOpenRequests(max = 100) {
  const ref = collection(db, "service_requests");
  const q = query(ref, where("status", "==", "open"), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Live-lyt på åbne service_requests */
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

/** Hent provider-profil (fx geo, info osv.) */
export async function getProvider(uid) {
  const snap = await getDoc(doc(db, "providers", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}
