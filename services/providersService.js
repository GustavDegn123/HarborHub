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
   (Legacy) Jobs-hjælpere
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
      const jobs = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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
   Payouts (udbetalinger)
========================= */

/** Engangslæsning */
export async function getProviderPayouts(uid, max = 50) {
  if (!uid) return [];
  const qRef = query(
    collection(db, "providers", uid, "payouts"),
    orderBy("createdAt", "desc"),
    limit(max)
  );
  const snap = await getDocs(qRef);
  return snap.docs.map((d) => ({ id: d.id, ...d.data() }));
}

/** Live-lyt */
export function listenProviderPayouts(uid, callback, errorCallback) {
  if (!uid) return () => {};
  const qRef = query(
    collection(db, "providers", uid, "payouts"),
    orderBy("createdAt", "desc"),
    limit(200)
  );
  return onSnapshot(
    qRef,
    (snap) => {
      const payouts = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
      callback(payouts);
    },
    errorCallback
  );
}

/* =========================
   Reviews
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
    await updateDoc(provRef, {
      ratingSum: increment(stars),
      ratingCount: increment(1),
      ratingUpdatedAt: serverTimestamp(),
    }).catch(async () => {
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
      const reviews = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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

/* =========================
   Public summary til budlister
========================= */

export function pickProviderDisplayName(p) {
  return p?.companyName || p?.displayName || p?.email || "Ukendt udbyder";
}

export async function getProviderPublicSummary(providerId) {
  if (!providerId) return null;

  const pref = doc(db, "providers", providerId);
  const psnap = await getDoc(pref);
  const pdata = psnap.exists() ? (psnap.data() || {}) : {};

  let udata = null;
  try {
    const usnap = await getDoc(doc(db, "users", providerId));
    if (usnap.exists()) udata = usnap.data() || null;
  } catch {}

  const companyName = pdata.companyName ?? pdata.company ?? null;
  const displayName =
    pdata.displayName ??
    pdata.name ??
    udata?.displayName ??
    udata?.name ??
    null;
  const email = pdata.email ?? udata?.email ?? null;

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
      if (typeof r === "number" && isFinite(r)) {
        s += r;
        c += 1;
      }
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
   Earnings
========================= */

export async function getProviderEarningsSummary(providerId) {
  if (!providerId) return null;
  const snap = await getDoc(doc(db, `providers/${providerId}/earnings/summary`));
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export function listenProviderEarningsSummary(providerId, callback, errorCallback) {
  if (!providerId) return () => {};
  const ref = doc(db, `providers/${providerId}/earnings/summary`);
  return onSnapshot(
    ref,
    (snap) => callback(snap.exists() ? { id: snap.id, ...snap.data() } : null),
    (err) => errorCallback?.(err)
  );
}

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
