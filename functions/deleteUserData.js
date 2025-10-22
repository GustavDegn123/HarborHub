// functions/deleteUserData.js
const { onRequest } = require("firebase-functions/v2/https");
const { setGlobalOptions } = require("firebase-functions/v2");
const { logger } = require("firebase-functions");
const { admin, db, bucket } = require("./admin");

// Alt i EU (matcher din klient)
setGlobalOptions({ region: "europe-west1" });

function allowCORS(req, res) {
  res.set("Access-Control-Allow-Origin", "*");
  res.set("Access-Control-Allow-Headers", "Content-Type, Authorization");
  res.set("Access-Control-Allow-Methods", "POST, OPTIONS");
  if (req.method === "OPTIONS") {
    res.status(204).send("");
    return true;
  }
  return false;
}

async function deleteQueryBatch(query, batchSize = 300) {
  let total = 0;
  // eslint-disable-next-line no-constant-condition
  while (true) {
    const snap = await query.limit(batchSize).get();
    if (snap.empty) break;
    const batch = db.batch();
    for (const d of snap.docs) batch.delete(d.ref);
    await batch.commit();
    total += snap.size;
    if (snap.size < batchSize) break;
  }
  return total;
}

async function deleteStoragePrefix(prefix) {
  try {
    await bucket.deleteFiles({ prefix });
    return { ok: true };
  } catch (e) {
    // Retention / object hold / precondition osv. — vi logger, men lader sletning fortsætte
    const msg = e?.message || String(e);
    logger.warn(`Storage delete failed for prefix "${prefix}": ${msg}`);
    return { ok: false, error: msg };
  }
}

exports.deleteUserData = onRequest(async (req, res) => {
  try {
    if (allowCORS(req, res)) return;
    if (req.method !== "POST") {
      return res.status(405).json({ error: "Kun POST er tilladt." });
    }

    // ---- Verificér ID-token ----
    const authHeader = req.headers.authorization || "";
    const m = authHeader.match(/^Bearer\s+(.+)$/i);
    if (!m) return res.status(401).json({ error: "Login kræves (mangler ID token)." });

    let decoded;
    try {
      decoded = await admin.auth().verifyIdToken(m[1]);
    } catch {
      return res.status(401).json({ error: "Ugyldigt ID token." });
    }
    const uid = decoded.uid;

    const progress = {
      uid,
      deleted: { jobs: 0, bidsByUser: 0, bidsUnderUserJobs: 0, assignedJobs: 0 },
      storage: { profiles: null, userUploads: null, jobImages: [] },
      warnings: [],
    };

    // 1) Hent brugerens job-ids
    let jobIds = [];
    try {
      const jobsSnap = await db.collection("service_requests").where("ownerId", "==", uid).get();
      jobIds = jobsSnap.docs.map((d) => d.id);
    } catch (e) {
      const msg = e?.message || String(e);
      logger.error("Step 1 (fetch jobs) failed:", msg);
      return res.status(500).json({ error: `Fetch jobs failed: ${msg}` });
    }

    // 2) Slet bids oprettet af brugeren (collectionGroup)
    try {
      const q = db.collectionGroup("bids").where("mechanicId", "==", uid);
      progress.deleted.bidsByUser = await deleteQueryBatch(q);
    } catch (e) {
      const msg = e?.message || String(e);
      logger.error("Step 2 (delete bidsByUser) failed:", msg);
      if (msg.toLowerCase().includes("requires an index")) {
        return res.status(500).json({
          error:
            "Firestore-indeks mangler til collection group 'bids' på feltet 'mechanicId'. Opret det foreslåede indeks i Firestore → Indexes.",
        });
      }
      progress.warnings.push(`Kunne ikke slette egne bud: ${msg}`);
    }

    // 3) Slet bids under brugerens egne jobs
    try {
      let n = 0;
      for (const jobId of jobIds) {
        const bidsSub = db.collection("service_requests").doc(jobId).collection("bids");
        n += await deleteQueryBatch(bidsSub);
      }
      progress.deleted.bidsUnderUserJobs = n;
    } catch (e) {
      const msg = e?.message || String(e);
      logger.error("Step 3 (delete bids under my jobs) failed:", msg);
      progress.warnings.push(`Kunne ikke slette bud under egne jobs: ${msg}`);
    }

    // 4) Slet jobs ejet af brugeren
    try {
      const jobsByOwner = db.collection("service_requests").where("ownerId", "==", uid);
      progress.deleted.jobs = await deleteQueryBatch(jobsByOwner);
    } catch (e) {
      const msg = e?.message || String(e);
      logger.error("Step 4 (delete jobs) failed:", msg);
      progress.warnings.push(`Kunne ikke slette jobs: ${msg}`);
    }

    // 5) Slet assigned_jobs (provider)
    try {
      const assignedRef = db.collection("providers").doc(uid).collection("assigned_jobs");
      progress.deleted.assignedJobs = await deleteQueryBatch(assignedRef);
    } catch (e) {
      const msg = e?.message || String(e);
      logger.error("Step 5 (delete assigned_jobs) failed:", msg);
      progress.warnings.push(`Kunne ikke slette assigned_jobs: ${msg}`);
    }

    // 6) Slet profiler
    try {
      await Promise.allSettled([
        db.collection("owners").doc(uid).delete(),
        db.collection("providers").doc(uid).delete(),
        db.collection("users").doc(uid).delete(),
      ]);
    } catch (e) {
      const msg = e?.message || String(e);
      logger.warn("Step 6 (delete profiles) warning:", msg);
      progress.warnings.push(`Kunne ikke slette profil-docs: ${msg}`);
    }

    // 7) Storage – best-effort; ignorer retention-fejl
    progress.storage.profiles = await deleteStoragePrefix(`profiles/${uid}/`);
    progress.storage.userUploads = await deleteStoragePrefix(`userUploads/${uid}/`);
    for (const jobId of jobIds) {
      const r = await deleteStoragePrefix(`jobImages/${jobId}/`);
      progress.storage.jobImages.push({ jobId, ...r });
    }

    return res.json({ ok: true, progress });
  } catch (err) {
    const msg = err?.message || String(err);
    logger.error("deleteUserData UNHANDLED ERROR:", msg);
    return res.status(500).json({ error: msg });
  }
});
