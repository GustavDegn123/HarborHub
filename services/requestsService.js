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
  orderBy,
  setDoc,
  deleteDoc,
  onSnapshot,
} from "firebase/firestore";

import { getProviderPublicSummary } from "./providersService"; // bruges til enriched bids

/* =========================
   Helpers
========================= */
const withId = (d) => ({ id: d.id, ...d.data() });

/* =========================
   CREATE
========================= */
export async function addRequest(ownerId, boatId, data) {
  const ref = collection(db, "service_requests");
  const payload = {
    owner_id: ownerId || null,
    boat_id: boatId || null,
    ...data,

    service_type: data?.service_type ?? "",
    description: data?.description ?? "",
    budget: typeof data?.budget === "string" ? parseInt(data.budget, 10) : data?.budget ?? null,
    status: data?.status ?? "open",

    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };
  const docRef = await addDoc(ref, payload);
  return docRef.id;
}

/* =========================
   READ
========================= */
export async function getServiceRequest(id) {
  if (!id) return null;
  const snap = await getDoc(doc(db, "service_requests", id));
  return snap.exists() ? withId(snap) : null;
}

export async function getRequestsByOwner(ownerId) {
  if (!ownerId) return [];
  const qRef = query(collection(db, "service_requests"), where("owner_id", "==", ownerId));
  const snap = await getDocs(qRef);
  return snap.docs.map(withId);
}

/* =========================
   Bids
========================= */
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

export async function getBids(jobId) {
  if (!jobId) return [];
  const ref = collection(db, "service_requests", jobId, "bids");
  const qRef = query(ref, orderBy("created_at", "desc"));
  const snap = await getDocs(qRef);
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

async function getBid(jobId, bidId) {
  const snap = await getDoc(doc(db, "service_requests", jobId, "bids", bidId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function acceptBid(jobId, bidId) {
  if (!jobId || !bidId) throw new Error("jobId/bidId mangler.");
  const bid = await getBid(jobId, bidId);
  if (!bid) throw new Error("Bud findes ikke.");
  const providerId = bid.provider_id || null;
  const price = typeof bid.price === "number" ? bid.price : Number(bid.price || 0);

  await updateDoc(doc(db, "service_requests", jobId), {
    status: "assigned",
    acceptedBidId: bidId,
    acceptedProviderId: providerId,
    acceptedPrice: price,
    acceptedAt: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  await updateDoc(doc(db, "service_requests", jobId, "bids", bidId), { accepted: true });

  if (providerId) {
    await setDoc(doc(db, "providers", providerId, "assigned_jobs", jobId), {
      job_id: jobId,
      accepted_bid_id: bidId,
      price,
      status: "assigned",
      assigned_at: serverTimestamp(),
    });
  }
  return true;
}

/* =========================
   Provider job-handlinger
========================= */
export async function startAssignedJob(jobId, providerId) {
  if (!jobId || !providerId) throw new Error("jobId/providerId mangler");
  const jobRef = doc(db, "service_requests", jobId);
  const jobSnap = await getDoc(jobRef);
  if (!jobSnap.exists()) throw new Error("Job ikke fundet");
  const job = jobSnap.data();
  if (job.acceptedProviderId !== providerId) throw new Error("Du er ikke tildelt dette job.");

  await updateDoc(jobRef, {
    status: "in_progress",
    startedAt: job.startedAt || serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  const assignedRef = doc(db, "providers", providerId, "assigned_jobs", jobId);
  if ((await getDoc(assignedRef)).exists()) {
    await updateDoc(assignedRef, { status: "in_progress" });
  }
}

export async function completeAssignedJob(jobId, providerId) {
  if (!jobId || !providerId) throw new Error("jobId/providerId mangler");
  const jobRef = doc(db, "service_requests", jobId);
  const jobSnap = await getDoc(jobRef);
  if (!jobSnap.exists()) throw new Error("Job ikke fundet");
  const job = jobSnap.data();
  if (job.acceptedProviderId !== providerId) throw new Error("Du er ikke tildelt dette job.");

  await updateDoc(jobRef, {
    status: "completed",
    paid: false,
    completedAt: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  const assignedRef = doc(db, "providers", providerId, "assigned_jobs", jobId);
  if ((await getDoc(assignedRef)).exists()) {
    await updateDoc(assignedRef, {
      status: "completed",
      paid: false,
      completed_at: serverTimestamp(),
    });
  }
}

export async function cancelAssignedJob(jobId, providerId) {
  if (!jobId || !providerId) throw new Error("jobId/providerId mangler");
  const jobRef = doc(db, "service_requests", jobId);
  const jobSnap = await getDoc(jobRef);
  if (!jobSnap.exists()) throw new Error("Job ikke fundet");
  const job = jobSnap.data();
  if (job.acceptedProviderId !== providerId) throw new Error("Du er ikke tildelt dette job.");

  await updateDoc(jobRef, {
    status: "open",
    acceptedBidId: null,
    acceptedProviderId: null,
    acceptedPrice: null,
    acceptedAt: null,
    startedAt: null,
    updated_at: serverTimestamp(),
  });

  const assignedRef = doc(db, "providers", providerId, "assigned_jobs", jobId);
  if ((await getDoc(assignedRef)).exists()) {
    await deleteDoc(assignedRef);
  }
}

/* =========================
   Statusmarkeringer
========================= */
export async function markJobPaid(jobId, amountMinor) {
  if (!jobId) return;
  const jobRef = doc(db, "service_requests", jobId);
  const jobSnap = await getDoc(jobRef);
  if (!jobSnap.exists()) return;
  const data = jobSnap.data();
  const providerId = data.acceptedProviderId || null;

  await updateDoc(jobRef, {
    status: "paid",
    paid: true,
    paidAt: serverTimestamp(),
    payment: {
      ...(data.payment || {}),
      clientMarkedPaid: true,
      amount: typeof amountMinor === "number" ? amountMinor : null,
      currency: "dkk",
      updatedAt: serverTimestamp(),
    },
    updated_at: serverTimestamp(),
  });

  if (providerId) {
    const assignedRef = doc(db, "providers", providerId, "assigned_jobs", jobId);
    if ((await getDoc(assignedRef)).exists()) {
      await updateDoc(assignedRef, {
        status: "paid",
        paid: true,
        paidAt: serverTimestamp(),
      });
    }
  }
}

export async function markJobReviewed(jobId) {
  if (!jobId) return;
  const jobRef = doc(db, "service_requests", jobId);
  const jobSnap = await getDoc(jobRef);
  if (!jobSnap.exists()) return;
  const data = jobSnap.data();
  const providerId = data.acceptedProviderId || null;

  await updateDoc(jobRef, {
    status: "reviewed",
    reviewGiven: true,
    reviewGivenAt: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  if (providerId) {
    const assignedRef = doc(db, "providers", providerId, "assigned_jobs", jobId);
    if ((await getDoc(assignedRef)).exists()) {
      await updateDoc(assignedRef, {
        status: "reviewed",
        reviewGiven: true,
        reviewGivenAt: serverTimestamp(),
      });
    }
  }
}

/* =========================
   Provider data
========================= */
export async function getProvider(uid) {
  if (!uid) return null;
  const snap = await getDoc(doc(db, "providers", uid));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/* =========================
   Live-lyttere
========================= */
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
