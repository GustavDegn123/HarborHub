// services/bidNotificationWatcher.js
import { db } from "../firebase";
import {
  collection,
  onSnapshot,
  orderBy,
  query,
  limit,
} from "firebase/firestore";
import * as Notifications from "expo-notifications";

// simpel DKK-format til beskedteksten
const DKK = (n) =>
  Number.isFinite(Number(n))
    ? new Intl.NumberFormat("da-DK", {
        style: "currency",
        currency: "DKK",
        maximumFractionDigits: 0,
      }).format(Number(n))
    : "—";

export function watchBidsForJobs(jobIds) {
  // ryd op ved tom liste
  if (!Array.isArray(jobIds) || jobIds.length === 0) {
    return () => {};
  }

  const unsubs = [];
  const lastSeenMap = new Map(); // jobId -> lastSeenTimestamp (ms)
  const primed = new Set(); // jobIds der har fået første snapshot

  jobIds.forEach((jobId) => {
    try {
      const bidsRef = collection(db, `service_requests/${jobId}/bids`);
      const q = query(bidsRef, orderBy("created_at", "desc"), limit(1));

      const unsub = onSnapshot(
        q,
        async (snap) => {
          const doc = snap.docs[0];
          if (!doc) {
            // ingen bud endnu
            lastSeenMap.set(jobId, 0);
            primed.add(jobId);
            return;
          }

          const data = doc.data() || {};
          const createdAt =
            (data.created_at?.toMillis && data.created_at.toMillis()) ||
            (data.created_at?.seconds
              ? data.created_at.seconds * 1000
              : undefined) ||
            Date.now();

          const prev = lastSeenMap.get(jobId) || 0;

          // Første gang: sæt baseline, ingen notifikation
          if (!primed.has(jobId)) {
            lastSeenMap.set(jobId, createdAt);
            primed.add(jobId);
            return;
          }

          // Efter baseline: hvis nyt bud er nyere end sidste kendte -> notifikation
          if (createdAt > prev) {
            lastSeenMap.set(jobId, createdAt);

            const provider =
              data.provider_name || data.provider || "Mekaniker";
            const price = DKK(data.price);

            try {
              await Notifications.scheduleNotificationAsync({
                content: {
                  title: "Nyt bud på din opgave",
                  body: `${provider} har budt ${price}`,
                  data: { screen: "RequestBids", jobId },
                },
                trigger: null, // lever straks
              });
            } catch (e) {
              // undgå crash hvis permissions mangler
              console.log("Kunne ikke schedule lokal notifikation:", e?.message || e);
            }
          }
        },
        (err) => {
          console.log("Bid watcher fejl for job", jobId, err?.message || err);
        }
      );

      unsubs.push(unsub);
    } catch (e) {
      console.log("Kunne ikke starte bid-watcher for", jobId, e?.message || e);
    }
  });

  // returner samlet stop-funktion
  return () => {
    unsubs.forEach((u) => u?.());
  };
}
