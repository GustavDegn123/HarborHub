// /services/requestsService.js
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
  orderBy,
  setDoc,
} from "firebase/firestore";

/* =========================
   Helpers
========================= */

function withId(docSnap) {
  return { id: docSnap.id, ...docSnap.data() };
}


/** Opret en ny service request
 *  - Gemmer hele payload (fx image, deadlineType, specificTime)
 *  - Normaliserer vigtige felter
 */
export async function addRequest(ownerId, boatId, data) {
  const ref = collection(db, "service_requests");

  const payload = {
    owner_id: ownerId,
    boat_id: boatId,

    // tag alt med fra skærmen (image, deadlineType, specificTime mm.)
    ...data,

    service_type: data?.service_type ?? "",
    description: data?.description ?? "",
    budget:
      typeof data?.budget === "string"
        ? parseInt(data.budget, 10)
        : data?.budget ?? null,
    status: data?.status ?? "open",

    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };

  const docRef = await addDoc(ref, payload);
  return docRef.id;
}

/* =========================
   READ – Requests
========================= */

/** Hent alle requests for en bestemt owner (bådejer) */
export async function getRequestsByOwner(ownerId) {
  const ref = collection(db, "service_requests");
  const q = query(ref, where("owner_id", "==", ownerId));
  const snap = await getDocs(q);
  return snap.docs.map(withId);
}

/** Hent én service request */
export async function getServiceRequest(id) {
  if (!id) return null;
  const snap = await getDoc(doc(db, "service_requests", id));
  return snap.exists() ? withId(snap) : null;
}

/** Hent alle åbne requests (til fx feed) */
export async function getOpenRequests(max = 100) {
  const ref = collection(db, "service_requests");
  const q = query(ref, where("status", "==", "open"), limit(max));
  const snap = await getDocs(q);
  return snap.docs.map(withId);
}

/** Live-lyt på åbne service_requests (til fx feed) */
export function listenOpenServiceRequests(callback, errorCallback) {
  const q = query(
    collection(db, "service_requests"),
    where("status", "==", "open"),
    limit(200)
  );

  return onSnapshot(
    q,
    (snap) => {
      const requests = snap.docs.map(withId);
      callback(requests);
    },
    (error) => {
      if (errorCallback) errorCallback(error);
    }
  );
}

/* =========================
   UPDATE – Requests
========================= */

export async function updateRequestStatus(requestId, status) {
  const ref = doc(db, "service_requests", requestId);
  await updateDoc(ref, {
    status,
    updated_at: serverTimestamp(),
  });
}

/** Opdater en service request med vilkårlige felter */
export async function updateServiceRequest(id, data) {
  await updateDoc(doc(db, "service_requests", id), {
    ...data,
    updated_at: serverTimestamp(),
  });
}

/* =========================
   Providers / profiler
========================= */

/** Hent provider-profil (bruges bl.a. til at vise navn/email på bud) */
export async function getProvider(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, "providers", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/* =========================
   Bids
========================= */

/** Afgiv bud på en opgave */
export async function addBid(jobId, providerId, price, message) {
  if (!providerId) throw new Error("Provider ID mangler");

  const ref = collection(db, "service_requests", jobId, "bids");
  await addDoc(ref, {
    provider_id: providerId,
    price: Number(price),
    message: message || "",
    created_at: serverTimestamp(),
    accepted: false,
  });
}

/** Hent bud for et job, sorteret nyeste først */
export async function getBids(jobId) {
  const ref = collection(db, "service_requests", jobId, "bids");
  const q = query(ref, orderBy("created_at", "desc"));
  const snap = await getDocs(q);

  return snap.docs.map((d) => {
    const data = d.data();
    return {
      id: d.id,
      ...data,
      created_at: data.created_at || null,
      accepted: !!data.accepted,
    };
  });
}

/** Accepter et specifikt bid
 *  - Opdaterer request med acceptedBidId, acceptedProviderId, acceptedPrice, status="assigned"
 *  - Marker selve bid-subdoc som accepted=true
 *  - (Valgfrit) Opretter reference under provider, så det er let at vise “tildelte opgaver”
 */
export async function acceptBid(jobId, bidId) {
  if (!jobId || !bidId) throw new Error("jobId/bidId mangler.");

  // 1) Hent buddet for at kende provider og pris
  const bidRef = doc(db, "service_requests", jobId, "bids", bidId);
  const bidSnap = await getDoc(bidRef);
  if (!bidSnap.exists()) throw new Error("Bud findes ikke.");
  const bid = bidSnap.data();
  const providerId = bid.provider_id || null;
  const price = typeof bid.price === "number" ? bid.price : Number(bid.price || 0);

  // 2) Opdater selve requesten
  const requestRef = doc(db, "service_requests", jobId);
  await updateDoc(requestRef, {
    acceptedBidId: bidId,
    acceptedProviderId: providerId,
    acceptedPrice: price,
    acceptedAt: serverTimestamp(),
    status: "assigned",
    updated_at: serverTimestamp(),
  });

  // 3) Marker buddet som accepteret
  await updateDoc(bidRef, {
    accepted: true,
  });

  //    Så det er nemt at vise på mekanikerens profil / “Mine opgaver”
  if (providerId) {
    const assignedRef = doc(db, "providers", providerId, "assigned_jobs", jobId);
    await setDoc(assignedRef, {
      job_id: jobId,
      accepted_bid_id: bidId,
      price,
      status: "assigned",
      assigned_at: serverTimestamp(),
    });
  }

  return true;
}

// === Hent tildelte jobs for en provider (mekaniker) ===
export async function getAssignedJobsForProvider(providerId) {
  if (!providerId) return [];

  // Vi bruger den reference, acceptBid skriver til:
  // providers/{providerId}/assigned_jobs/{jobId}
  const assignedRef = collection(db, "providers", providerId, "assigned_jobs");
  const assignedSnap = await getDocs(assignedRef);

  const rows = [];
  for (const d of assignedSnap.docs) {
    const { job_id } = d.data() || {};
    if (!job_id) continue;
    const jobSnap = await getDoc(doc(db, "service_requests", job_id));
    if (jobSnap.exists()) {
      rows.push({ id: jobSnap.id, ...jobSnap.data() });
    }
  }
  return rows;
}
export function listenAssignedJobs(providerId, callback, errorCallback) {
  if (!providerId) return () => {};
  const assignedRef = collection(db, "providers", providerId, "assigned_jobs");
  return onSnapshot(
    assignedRef,
    async (snap) => {
      const rows = [];
      for (const d of snap.docs) {
        const { job_id } = d.data() || {};
        if (!job_id) continue;
        const jobSnap = await getDoc(doc(db, "service_requests", job_id));
        if (jobSnap.exists()) {
          rows.push({ id: jobSnap.id, ...jobSnap.data() });
        }
      }
      callback(rows);
    },
    (err) => errorCallback?.(err)
  );
}