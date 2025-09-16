// /services/requestsService.js
import { db } from "../firebase";
import {
  collection,
  addDoc,
  query,
  where,
  getDocs,
  serverTimestamp,
} from "firebase/firestore";

/** Opret en ny service request */
export async function addRequest(ownerId, boatId, data) {
  const ref = collection(db, "service_requests");
  const docRef = await addDoc(ref, {
    owner_id: ownerId,
    boat_id: boatId,
    service_type: data.service_type,
    description: data.description || "",
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
