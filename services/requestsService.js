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
  deleteDoc,
  increment,
} from "firebase/firestore";

// Evt. “enriched” lytter bruger denne (cirkulær import undgås i praksis)
import { getProviderPublicSummary } from "./providersService";

/* =========================
   Helpers
========================= */

const withId = (d) => ({ id: d.id, ...d.data() });

/* =========================
   CREATE
========================= */

/** Opret en ny service request */
export async function addRequest(ownerId, boatId, data) {
  const ref = collection(db, "service_requests");

  const payload = {
    owner_id: ownerId || null,
    boat_id: boatId || null,

    // medtag hele payload (image, deadlineType, specificTime osv.)
    ...data,

    // normaliser kritiske felter
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
  if (!ownerId) return [];
  const ref = collection(db, "service_requests");
  const qRef = query(ref, where("owner_id", "==", ownerId));
  const snap = await getDocs(qRef);
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
  const qRef = query(ref, where("status", "==", "open"), limit(max));
  const snap = await getDocs(qRef);
  return snap.docs.map(withId);
}

/** Live-lyt på åbne service_requests (til fx feed) */
export function listenOpenServiceRequests(callback, errorCallback) {
  const qRef = query(
    collection(db, "service_requests"),
    where("status", "==", "open"),
    limit(200)
  );

  return onSnapshot(
    qRef,
    (snap) => callback(snap.docs.map(withId)),
    (error) => errorCallback?.(error)
  );
}

/* =========================
   UPDATE – Requests
========================= */

export async function updateRequestStatus(requestId, status) {
  if (!requestId) return;
  await updateDoc(doc(db, "service_requests", requestId), {
    status,
    updated_at: serverTimestamp(),
  });
}

export async function updateServiceRequest(id, data) {
  if (!id) return;
  await updateDoc(doc(db, "service_requests", id), {
    ...data,
    updated_at: serverTimestamp(),
  });
}

/**
 * Marker en service request som BETALT (klientside efter vellykket Stripe-betaling).
 * amountMinor = beløb i øre (valgfri, kun til log/visning).
 * NB: Webhooken må også gerne sætte paid=true → ingen konflikt.
 */
export async function markRequestPaid(jobId, amountMinor) {
  if (!jobId) return;
  const ref = doc(db, "service_requests", jobId);
  await updateDoc(ref, {
    status: "paid",
    paid: true,
    paidAt: serverTimestamp(),
    payment: {
      clientMarkedPaid: true,
      amount: typeof amountMinor === "number" ? amountMinor : null,
      currency: "dkk",
      updatedAt: serverTimestamp(),
    },
    updated_at: serverTimestamp(),
  });
}

/* =========================
   Providers / profiler
========================= */

/** Hent provider-profil (rå) */
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
  if (!jobId) throw new Error("jobId mangler");
  if (!providerId) throw new Error("providerId mangler");

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

/** Intern helper: hent et specifikt bud */
async function getBid(jobId, bidId) {
  const snap = await getDoc(doc(db, "service_requests", jobId, "bids", bidId));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/**
 * Bådejer accepterer et bud:
 * - sætter request -> status="assigned"
 * - sætter acceptedBidId, acceptedProviderId, acceptedPrice, acceptedAt
 * - markerer buddet som accepted=true
 * - opretter providers/{providerId}/assigned_jobs/{jobId} (så mekaniker ser opgaven)
 */
export async function acceptBid(jobId, bidId) {
  if (!jobId || !bidId) throw new Error("jobId/bidId mangler.");

  const bid = await getBid(jobId, bidId);
  if (!bid) throw new Error("Bud findes ikke.");
  const providerId = bid.provider_id || null;
  const price =
    typeof bid.price === "number" ? bid.price : Number(bid.price || 0);

  // 1) Opdater selve requesten
  const requestRef = doc(db, "service_requests", jobId);
  await updateDoc(requestRef, {
    status: "assigned",
    acceptedBidId: bidId,
    acceptedProviderId: providerId,
    acceptedPrice: price,
    acceptedAt: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  // 2) Marker buddet som accepteret
  const bidRef = doc(db, "service_requests", jobId, "bids", bidId);
  await updateDoc(bidRef, { accepted: true });

  // 3) Opret reference under provider → assigned_jobs/{jobId}
  if (providerId) {
    const assignedRef = doc(
      db,
      "providers",
      providerId,
      "assigned_jobs",
      jobId
    );
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

/* =========================
   Mekaniker-handlinger på tildelte jobs
========================= */

/** Start et tildelt job (mekaniker) → status = "in_progress" */
export async function startAssignedJob(jobId, providerId) {
  if (!jobId || !providerId) throw new Error("jobId/providerId mangler");

  const jobRef = doc(db, "service_requests", jobId);
  const jobSnap = await getDoc(jobRef);
  if (!jobSnap.exists()) throw new Error("Job ikke fundet");

  const job = jobSnap.data();
  if (job.acceptedProviderId !== providerId) {
    throw new Error("Du er ikke tildelt dette job.");
  }

  await updateDoc(jobRef, {
    status: "in_progress",
    startedAt: job.startedAt || serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  // hold også providerens assigned_jobs opdateret
  const assignedRef = doc(db, "providers", providerId, "assigned_jobs", jobId);
  const assignedSnap = await getDoc(assignedRef);
  if (assignedSnap.exists()) {
    await updateDoc(assignedRef, { status: "in_progress" });
  }
}

/** Afslut et igangværende job (mekaniker) → status = "completed" (ingen betaling her) */
export async function completeAssignedJob(jobId, providerId) {
  if (!jobId || !providerId) throw new Error("jobId/providerId mangler");

  const jobRef = doc(db, "service_requests", jobId);
  const jobSnap = await getDoc(jobRef);
  if (!jobSnap.exists()) throw new Error("Job ikke fundet");

  const job = jobSnap.data();
  if (job.acceptedProviderId !== providerId) {
    throw new Error("Du er ikke tildelt dette job.");
  }

  await updateDoc(jobRef, {
    status: "completed",
    paid: false, // vigtigt: marker at den IKKE er betalt endnu
    completedAt: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  const assignedRef = doc(db, "providers", providerId, "assigned_jobs", jobId);
  const assignedSnap = await getDoc(assignedRef);
  if (assignedSnap.exists()) {
    await updateDoc(assignedRef, {
      status: "completed",
      paid: false,
      completed_at: serverTimestamp(),
    });
  }
}

/** Annullér et tildelt job (mekaniker) → frigiv job igen */
export async function cancelAssignedJob(jobId, providerId) {
  if (!jobId || !providerId) throw new Error("jobId/providerId mangler");

  const jobRef = doc(db, "service_requests", jobId);
  const jobSnap = await getDoc(jobRef);
  if (!jobSnap.exists()) throw new Error("Job ikke fundet");

  const job = jobSnap.data();
  if (job.acceptedProviderId !== providerId) {
    throw new Error("Du er ikke tildelt dette job.");
  }

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
  const assignedSnap = await getDoc(assignedRef);
  if (assignedSnap.exists()) {
    await deleteDoc(assignedRef);
  }
}

/* =========================
   Hent jobs for provider
========================= */

/** Hent alle jobs, som er tildelt til en given mekaniker (uanset status) */
export async function getAssignedJobsForProvider(providerId, max = 100) {
  if (!providerId) return [];
  const ref = collection(db, "service_requests");
  const qRef = query(
    ref,
    where("acceptedProviderId", "==", providerId),
    limit(max)
  );
  const snap = await getDocs(qRef);
  return snap.docs.map(withId);
}

/* ======================================================================
   NYE FUNKTIONER – lyttere/filtre
====================================================================== */

export function listenOwnerRequestsWithBids(
  ownerId,
  callback,
  { onlyWithBids = false } = {}
) {
  if (!ownerId) return () => {};
  const qRef = query(
    collection(db, "service_requests"),
    where("owner_id", "==", ownerId),
    orderBy("created_at", "desc")
  );

  return onSnapshot(qRef, (snap) => {
    let items = snap.docs.map(withId);
    if (onlyWithBids) {
      items = items.filter((it) =>
        typeof it.bidsCount === "number" ? it.bidsCount > 0 : true
      );
    }
    callback(items);
  });
}

export async function getRequestsByOwnerWithBids(
  ownerId,
  { onlyWithBids = true } = {}
) {
  if (!ownerId) return [];
  const refCol = collection(db, "service_requests");
  const qRef = query(
    refCol,
    where("owner_id", "==", ownerId),
    orderBy("created_at", "desc")
  );
  const snap = await getDocs(qRef);
  let items = snap.docs.map(withId);
  if (onlyWithBids) {
    items = items.filter((it) =>
      typeof it.bidsCount === "number" ? it.bidsCount > 0 : true
    );
  }
  return items;
}

export function listenOpenServiceRequestsForProvider(
  providerId,
  callback,
  errorCallback
) {
  const qRef = query(
    collection(db, "service_requests"),
    where("status", "==", "open"),
    orderBy("created_at", "desc"),
    limit(200)
  );

  return onSnapshot(
    qRef,
    (snap) => {
      const all = snap.docs.map(withId);
      const filtered = providerId
        ? all.filter((r) => r.owner_id !== providerId)
        : all;
      callback(filtered);
    },
    (err) => errorCallback?.(err)
  );
}

/** Live-lyt til bud på et bestemt job */
export function listenBids(jobId, callback) {
  if (!jobId) return () => {};
  const qRef = query(
    collection(db, "service_requests", jobId, "bids"),
    orderBy("created_at", "desc")
  );
  return onSnapshot(qRef, (snap) => {
    const items = snap.docs.map((d) => {
      const data = d.data();
      return {
        id: d.id,
        ...data,
        created_at: data.created_at || null,
        accepted: !!data.accepted,
      };
    });
    callback(items);
  });
}

/**
 * Live-lyt med “enrichment”: bud + provider-navn/rating (simpel cache).
 * callback(enrichedBids)
 */
export function listenBidsEnriched(jobId, callback) {
  if (!jobId) return () => {};
  const cache = new Map(); // providerId -> summary

  return listenBids(jobId, async (raw) => {
    try {
      const enriched = await Promise.all(
        raw.map(async (b) => {
          const pid = b.provider_id;
          let sum = cache.get(pid);
          if (!sum && pid) {
            sum = await getProviderPublicSummary(pid).catch(() => null);
            if (sum) cache.set(pid, sum);
          }
          return {
            ...b,
            provider: {
              name:
                sum?.companyName ||
                sum?.displayName ||
                sum?.email ||
                "Ukendt udbyder",
              avgRating: sum?.avgRating ?? 0,
              reviewCount: sum?.reviewCount ?? 0,
            },
          };
        })
      );
      callback(enriched);
    } catch (e) {
      // fald tilbage til rå bud
      callback(raw);
    }
  });
}

/** Afgiv bud + opdater simpel `bidsCount` på request (atomisk) */
export async function addBidAndUpdateCount(jobId, providerId, price, message) {
  await addBid(jobId, providerId, price, message);
  const jobRef = doc(db, "service_requests", jobId);
  await updateDoc(jobRef, {
    bidsCount: increment(1),
    updated_at: serverTimestamp(),
  });
}

export async function decrementBidsCount(jobId, by = 1) {
  const jobRef = doc(db, "service_requests", jobId);
  await updateDoc(jobRef, {
    bidsCount: increment(-Math.abs(by)),
    updated_at: serverTimestamp(),
  });
}

/** Live-lyt: alle requests for en ejer */
export function listenOwnerRequests(ownerId, callback) {
  if (!ownerId) return () => {};
  const qRef = query(
    collection(db, "service_requests"),
    where("owner_id", "==", ownerId),
    orderBy("created_at", "desc")
  );
  return onSnapshot(qRef, (snap) => callback(snap.docs.map(withId)));
}

/**
 * Fleksibel lytter: vælg hvilke statuser der er “actionable” for ejer.
 * (NB: where("status","in",statuses) kan kræve Firestore-index)
 */
export function listenOwnerRequestsByStatus(ownerId, statuses, callback) {
  if (!ownerId || !Array.isArray(statuses) || statuses.length === 0)
    return () => {};

  const qRef = query(
    collection(db, "service_requests"),
    where("owner_id", "==", ownerId),
    where("status", "in", statuses),
    orderBy("created_at", "desc")
  );

  return onSnapshot(qRef, (snap) => {
    const items = snap.docs.map(withId);
    callback(items);
  });
}

/** Live-lyt: alle jobs tildelt til en given mekaniker (uanset status) */
export function listenAssignedJobsForProvider(
  providerId,
  callback,
  errorCallback
) {
  if (!providerId) return () => {};
  const qRef = query(
    collection(db, "service_requests"),
    where("acceptedProviderId", "==", providerId),
    orderBy("updated_at", "desc"),
    limit(500)
  );

  return onSnapshot(
    qRef,
    (snap) => {
      const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(rows);
    },
    (err) => errorCallback?.(err)
  );
}

/* =========================
   SAFE listener (ingen index-krav)
========================= */

/** Safe live-lyt til ejerens requests uden orderBy (kræver intet index) */
export function listenOwnerRequestsSafe(ownerId, callback, errorCallback) {
  if (!ownerId) return () => {};
  const qRef = query(
    collection(db, "service_requests"),
    where("owner_id", "==", ownerId),
    limit(500)
  );
  return onSnapshot(
    qRef,
    (snap) => callback(snap.docs.map(withId)),
    (err) => errorCallback?.(err)
  );
}

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
    const assignedSnap = await getDoc(assignedRef);
    if (assignedSnap.exists()) {
      await updateDoc(assignedRef, {
        status: "paid",
        paid: true,
        paidAt: serverTimestamp(),
      });
    }
  }
}


/* =========================
   Reviews
========================= */

/** Marker at ejer har givet anmeldelse på dette job */
export async function markJobReviewed(jobId) {
  if (!jobId) return;

  const jobRef = doc(db, "service_requests", jobId);
  const jobSnap = await getDoc(jobRef);
  if (!jobSnap.exists()) return;

  const data = jobSnap.data();
  const providerId = data.acceptedProviderId || null;

  // Opdater selve service_request
  await updateDoc(jobRef, {
    status: "reviewed",
    reviewGiven: true,
    reviewGivenAt: serverTimestamp(),
    updated_at: serverTimestamp(),
  });

  // Hvis der er en provider → opdater også providerens assigned_jobs
  if (providerId) {
    const assignedRef = doc(db, "providers", providerId, "assigned_jobs", jobId);
    const assignedSnap = await getDoc(assignedRef);
    if (assignedSnap.exists()) {
      await updateDoc(assignedRef, {
        status: "reviewed",
        reviewGiven: true,
        reviewGivenAt: serverTimestamp(),
      });
    }
  }
}

// Lytter på antal bud i en subcollection (ingen orderBy -> intet indexkrav)
export function listenBidsCount(jobId, callback) {
  if (!jobId) return () => {};
  const qRef = query(collection(db, "service_requests", jobId, "bids"));
  return onSnapshot(
    qRef,
    (snap) => callback(snap?.size ?? 0),
    () => callback(0)
  );
}


