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
  orderBy,
  updateDoc,
  increment,
} from "firebase/firestore";

/* =========================
   Profiler & roller
========================= */

/** Gem/merge provider-profil */
export async function saveProviderProfile(userId, profileData) {
  if (!userId) return;
  const payload = { ...profileData, updatedAt: serverTimestamp() };
  await setDoc(doc(db, "providers", userId), payload, { merge: true });
}

/** Gem/merge Stripe connected account-id på provider-doc */
export async function setProviderStripeAccountId(userId, stripeAccountId) {
  if (!userId || !stripeAccountId) return;
  await setDoc(
    doc(db, "providers", userId),
    { stripeAccountId, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/** Sæt brugerens rolle */
export async function setUserRole(userId, role) {
  if (!userId) return;
  await setDoc(
    doc(db, "users", userId),
    { role, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/** Hent provider-profil (rå doc) */
export async function getProviderProfile(userId) {
  if (!userId) return null;
  const snap = await getDoc(doc(db, "providers", userId));
  return snap.exists() ? snap.data() : null;
}

/** Gem valgte services (kompetencer) for provider */
export async function saveProviderServices(userId, servicesArray) {
  if (!userId) return;
  await setDoc(
    doc(db, "providers", userId),
    { services: servicesArray, updatedAt: serverTimestamp() },
    { merge: true }
  );
}

/** Hent alle services (katalog) */
export async function getAvailableServices() {
  const snap = await getDocs(collection(db, "services"));
  return snap.empty ? [] : snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* =========================
   (Legacy) Jobs-hjælpere – beholdt hvis du stadig bruger "jobs"
========================= */
export async function getProviderJobs(uid, max = 100) {
  if (!uid) return [];
  const qRef = query(
    collection(db, "jobs"),
    where("acceptedBy", "==", uid),
    limit(max)
  );
  const snap = await getDocs(qRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

export function listenProviderJobs(uid, callback, errorCallback) {
  if (!uid) return () => {};
  const qRef = query(
    collection(db, "jobs"),
    where("acceptedBy", "==", uid),
    limit(200)
  );
  return onSnapshot(
    qRef,
    (snap) => {
      const jobs = [];
      snap.forEach((d) => jobs.push({ id: d.id, ...d.data() }));
      jobs.sort(
        (a, b) =>
          (b?.createdAt?.toMillis?.() || 0) -
          (a?.createdAt?.toMillis?.() || 0)
      );
      callback(jobs);
    },
    errorCallback
  );
}

/* =========================
   Payouts (hvis du bruger separat udbetalingssamling)
========================= */
export async function getProviderPayouts(uid, max = 50) {
  if (!uid) return [];
  const qRef = query(collection(db, "providers", uid, "payouts"), limit(max));
  const snap = await getDocs(qRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/* =========================
   Reviews (providers/{providerId}/reviews)
   – aggregatfelter på providers-doc: ratingSum, ratingCount
========================= */

export async function addProviderReview({
  providerId,
  ownerId,
  jobId,
  rating,
  comment,
}) {
  if (!providerId || !ownerId || !jobId)
    throw new Error("Mangler providerId/ownerId/jobId");

  const stars = Math.max(1, Math.min(5, Number(rating) || 0));
  const reviewId = `${jobId}_${ownerId}`;
  const reviewRef = doc(db, "providers", providerId, "reviews", reviewId);

  const prev = await getDoc(reviewRef);
  const existed = prev.exists();

  await setDoc(
    reviewRef,
    {
      providerId,
      ownerId,
      jobId,
      rating: stars,
      comment: comment || "",
      createdAt: serverTimestamp(),
    },
    { merge: true }
  );

  const provRef = doc(db, "providers", providerId);

  if (!existed) {
    // første review for denne kombination → øg sum og count
    await updateDoc(provRef, {
      ratingSum: increment(stars),
      ratingCount: increment(1),
      ratingUpdatedAt: serverTimestamp(),
    }).catch(async () => {
      // hvis provider-doc ikke fandtes, initialiser
      await setDoc(
        provRef,
        {
          ratingSum: stars,
          ratingCount: 1,
          ratingUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    });
  }
  return true;
}

/** Hent provider-reviews (subcollection) – nyeste først */
export async function getProviderReviews(uid, max = 50) {
  if (!uid) return [];
  const qRef = query(
    collection(db, "providers", uid, "reviews"),
    orderBy("createdAt", "desc"),
    limit(max)
  );
  const snap = await getDocs(qRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Live-lyt provider-reviews (subcollection) – nyeste først */
export function listenProviderReviews(uid, callback, errorCallback) {
  if (!uid) return () => {};
  const qRef = query(
    collection(db, "providers", uid, "reviews"),
    orderBy("createdAt", "desc"),
    limit(200)
  );
  return onSnapshot(
    qRef,
    (snap) => {
      const reviews = [];
      snap.forEach((d) => reviews.push({ id: d.id, ...d.data() }));
      callback(
        reviews.sort(
          (a, b) =>
            (b?.createdAt?.toMillis?.() || 0) -
            (a?.createdAt?.toMillis?.() || 0)
        )
      );
    },
    errorCallback
  );
}

/** Beregn gennemsnit fra provider-doc felter */
export function calcProviderAvgFromDoc(providerDoc) {
  const sum = Number(providerDoc?.ratingSum || 0);
  const cnt = Number(providerDoc?.ratingCount || 0);
  if (cnt <= 0) return { avg: 0, count: 0 };
  return { avg: sum / cnt, count: cnt };
}

/** Hent gennemsnit direkte fra provider-doc (hurtigt) */
export async function getProviderAverage(uid) {
  if (!uid) return { avg: 0, count: 0 };
  const snap = await getDoc(doc(db, "providers", uid));
  if (!snap.exists()) return { avg: 0, count: 0 };
  return calcProviderAvgFromDoc(snap.data());
}

/* =========================
   Public summary til budlister m.m.
========================= */

/** Helper: lav et visningsnavn */
export function pickProviderDisplayName(p) {
  return (
    p?.companyName ||
    p?.displayName ||
    p?.email ||
    "Ukendt udbyder"
  );
}

/**
 * Offentligt sammendrag til visning i budlister m.m.
 * Returnerer: { displayName, companyName, email, services, avgRating, reviewCount }
 * Hvis rating-felter mangler på provider-doc, beregnes de fra reviews og caches.
 */
/**
 * Offentligt sammendrag til budlister.
 * Returnerer: { displayName, companyName, email, services, avgRating, reviewCount }
 * Fallback: henter også users/{providerId} hvis providers/{providerId} mangler navn.
 */
export async function getProviderPublicSummary(providerId) {
  if (!providerId) return null;

  const pref = doc(db, "providers", providerId);
  const psnap = await getDoc(pref);
  const pdata = psnap.exists() ? (psnap.data() || {}) : {};

  // Fallback til users/{providerId}
  let udata = null;
  try {
    const usnap = await getDoc(doc(db, "users", providerId));
    if (usnap.exists()) udata = usnap.data() || null;
  } catch {}

  // Navn/e-mail i prioriteret rækkefølge
  const companyName = pdata.companyName ?? pdata.company ?? null;
  const displayName =
    pdata.displayName ??
    pdata.name ??
    udata?.displayName ??
    udata?.name ??
    null;
  const email = pdata.email ?? udata?.email ?? null;

  // Rating: brug cachefelter → sum/count → ellers beregn fra reviews
  let avg = typeof pdata.avgRating === "number" ? pdata.avgRating : undefined;
  let count = typeof pdata.reviewCount === "number" ? pdata.reviewCount : undefined;

  if (avg === undefined || count === undefined) {
    const sum = Number(pdata.ratingSum || 0);
    const cnt = Number(pdata.ratingCount || 0);
    if (cnt > 0) {
      avg = sum / cnt;
      count = cnt;
    }
  }

  if (avg === undefined || count === undefined) {
    const qRef = query(collection(db, "providers", providerId, "reviews"), limit(500));
    const rsnap = await getDocs(qRef);
    let s = 0, c = 0;
    rsnap.forEach((d) => {
      const r = d.data()?.rating;
      if (typeof r === "number" && isFinite(r)) { s += r; c += 1; }
    });
    avg = c > 0 ? s / c : 0;
    count = c;

    try {
      await setDoc(
        pref,
        {
          avgRating: avg,
          reviewCount: count,
          ratingSum: typeof pdata.ratingSum === "number" ? pdata.ratingSum : s,
          ratingCount: typeof pdata.ratingCount === "number" ? pdata.ratingCount : c,
          ratingUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );
    } catch {}
  }

  return {
    displayName,
    companyName,
    email,
    services: Array.isArray(pdata.services) ? pdata.services : [],
    avgRating: avg ?? 0,
    reviewCount: count ?? 0,
  };
}

/* =========================
   Earnings (indtjening) – udfyldes af Stripe-webhook
========================= */

/**
 * Engangslæsning: samlet indtjening (providers/{id}/earnings/summary)
 * Forventede felter:
 *  - totalEarnedMinor: number (øre)
 *  - totalEarned: number (DKK)
 *  - jobsPaid: number
 *  - updatedAt: Timestamp
 */
export async function getProviderEarningsSummary(providerId) {
  if (!providerId) return null;
  const snap = await getDoc(doc(db, `providers/${providerId}/earnings/summary`));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

/** Live-lyt: samlet indtjening for provider */
export function listenProviderEarningsSummary(providerId, callback, errorCallback) {
  if (!providerId) return () => {};
  const ref = doc(db, `providers/${providerId}/earnings/summary`);
  return onSnapshot(
    ref,
    (snap) => callback(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    (err) => errorCallback?.(err)
  );
}

/**
 * Detaljer pr. job (providers/{id}/earnings_by_job) – nyeste først.
 * Forventede felter pr. doc:
 *  - jobId, amountMinor, amount, currency, createdAt
 */
export async function getProviderEarningsByJob(providerId, max = 100) {
  if (!providerId) return [];
  const qRef = query(
    collection(db, `providers/${providerId}/earnings_by_job`),
    orderBy("createdAt", "desc"),
    limit(max)
  );
  const snap = await getDocs(qRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Live-lyt: detaljer pr. job (nyeste først) */
export function listenProviderEarningsByJob(providerId, callback, errorCallback) {
  if (!providerId) return () => {};
  const qRef = query(
    collection(db, `providers/${providerId}/earnings_by_job`),
    orderBy("createdAt", "desc"),
    limit(200)
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