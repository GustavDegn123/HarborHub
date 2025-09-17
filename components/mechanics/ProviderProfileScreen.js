// components/mechanics/ProviderProfileScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
} from "react-native";
import { getAuth } from "firebase/auth";
import {
  Timestamp,
  doc,
  updateDoc,
  serverTimestamp,
  collection,
  query,
  where,
  getDocs,
  onSnapshot,
} from "firebase/firestore";
import { db } from "../../firebase";
import {
  getProviderProfile,
  listenProviderReviews,
  getProviderPayouts,
} from "../../services/providersService";
import styles from "../../styles/mechanics/providerProfileStyles";

const DKK = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("da-DK", {
        style: "currency",
        currency: "DKK",
        maximumFractionDigits: 0,
      }).format(n)
    : "–";

const formatDateShort = (ts) => {
  if (ts instanceof Timestamp) {
    const d = ts.toDate();
    return new Intl.DateTimeFormat("da-DK", {
      day: "2-digit",
      month: "short",
    }).format(d);
  }
  return "";
};

// --- Lyt service_requests for en provider ---
function listenProviderRequests(uid, callback, errorCallback) {
  const q = query(collection(db, "service_requests"), where("acceptedBy", "==", uid));
  return onSnapshot(
    q,
    (snap) => {
      const arr = [];
      snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
      callback(arr);
    },
    (err) => errorCallback?.(err)
  );
}

export default function ProviderProfileScreen({ navigation }) {
  const auth = getAuth();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [fixing, setFixing] = useState(false);

  const [prov, setProv] = useState(null);
  const [jobs, setJobs] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [reviews, setReviews] = useState([]);

  // Hent profil + payouts
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user?.uid) return;
      try {
        const [provData, payoutsData] = await Promise.all([
          getProviderProfile(user.uid),
          getProviderPayouts(user.uid),
        ]);
        if (!cancelled) {
          setProv(provData || {});
          setPayouts(
            payoutsData.sort(
              (a, b) =>
                (b?.createdAt?.toMillis?.() || 0) - (a?.createdAt?.toMillis?.() || 0)
            )
          );
        }
      } catch (e) {
        console.warn("ProviderProfile load error:", e?.message || e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [user?.uid]);

  // Live service_requests
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = listenProviderRequests(user.uid, (arr) => setJobs(arr));
    return () => unsub();
  }, [user?.uid]);

  // Live reviews
  useEffect(() => {
    if (!user?.uid) return;
    const unsub = listenProviderReviews(user.uid, (arr) => setReviews(arr));
    return () => unsub();
  }, [user?.uid]);

  // Split jobs
  const activeJobs = useMemo(
    () =>
      jobs.filter((j) =>
        ["claimed", "in_progress", "inprogress"].includes(
          String(j.status || "").toLowerCase()
        )
      ),
    [jobs]
  );
  const completedJobs = useMemo(
    () =>
      jobs.filter((j) =>
        ["completed", "done", "finished", "complete"].includes(
          String(j.status || "").toLowerCase()
        )
      ),
    [jobs]
  );

  // KPI’er
  const activeCount = activeJobs.length;
  const completedCount = completedJobs.length;
  const totalEarnings = useMemo(
    () =>
      completedJobs.reduce(
        (s, j) => s + (typeof j.price === "number" ? j.price : 0),
        0
      ),
    [completedJobs]
  );
  const ratingStats = useMemo(() => {
    if (!reviews || reviews.length === 0) return { avg: null, count: 0 };
    const valid = reviews.filter((r) => typeof r.rating === "number");
    if (valid.length === 0) return { avg: null, count: 0 };
    const avg = valid.reduce((s, r) => s + r.rating, 0) / valid.length;
    return { avg: Math.round(avg * 10) / 10, count: valid.length };
  }, [reviews]);

  // Actions
  async function startJob(job) {
    if (job.acceptedBy !== user?.uid) return;
    await updateDoc(doc(db, "service_requests", job.id), {
      status: "in_progress",
      startedAt: job.startedAt || serverTimestamp(),
    });
  }
  async function completeJob(job) {
    if (job.acceptedBy !== user?.uid) return;
    await updateDoc(doc(db, "service_requests", job.id), {
      status: "completed",
      completedAt: serverTimestamp(),
    });
  }

  async function normalizeLegacyJobs() {
    if (!user?.uid) return;
    setFixing(true);
    try {
      let changed = 0;
      // A) Ret status for jobs i state
      for (const j of jobs) {
        const raw = String(j.status || "").toLowerCase();
        const upd = {};
        if (raw === "inprogress") upd.status = "in_progress";
        if (["done", "finished", "complete"].includes(raw)) upd.status = "completed";
        if (["accepted", "taken"].includes(raw)) upd.status = "claimed";
        if (Object.keys(upd).length) {
          await updateDoc(doc(db, "service_requests", j.id), upd);
          changed++;
        }
      }
      // B) Tilføj acceptedBy hvis mangler
      const qLegacy = query(
        collection(db, "service_requests"),
        where("providerId", "==", user.uid)
      );
      const snapLegacy = await getDocs(qLegacy);
      for (const d of snapLegacy.docs) {
        const j = { id: d.id, ...d.data() };
        if (!j.acceptedBy) {
          const upd = { acceptedBy: user.uid, acceptedAt: serverTimestamp() };
          const raw = String(j.status || "").toLowerCase();
          if (raw === "inprogress") upd.status = "in_progress";
          if (["accepted", "taken"].includes(raw)) upd.status = "claimed";
          if (["done", "finished", "complete"].includes(raw)) upd.status = "completed";
          await updateDoc(doc(db, "service_requests", j.id), upd);
          changed++;
        }
      }
      Alert.alert("Normalisering fuldført", `${changed} opgave(r) opdateret.`);
    } catch (e) {
      Alert.alert("Fejl", e?.message || "Kunne ikke normalisere opgaver.");
    } finally {
      setFixing(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
        <Text style={styles.loaderText}>Henter profil…</Text>
      </View>
    );
  }

  const displayName =
    prov?.displayName || prov?.companyName || auth.currentUser?.email || "Udbyder";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
      <Text style={styles.header}>{displayName}</Text>
      <Text style={styles.subheader}>
        {ratingStats.avg != null
          ? `${ratingStats.avg}/5 • ${ratingStats.count} anmeldelser`
          : "Ingen vurderinger endnu"}
      </Text>

      {/* KPI GRID */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>I gang</Text>
          <Text style={styles.kpiValue}>{activeCount}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Færdige</Text>
          <Text style={styles.kpiValue}>{completedCount}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Indtjening</Text>
          <Text style={styles.kpiValue}>{DKK(totalEarnings)}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Rating</Text>
          <Text style={styles.kpiValue}>
            {ratingStats.avg != null ? `${ratingStats.avg}★` : "—"}{" "}
            <Text style={styles.kpiMuted}>({ratingStats.count})</Text>
          </Text>
        </View>
      </View>

      <TouchableOpacity
        disabled={fixing}
        onPress={normalizeLegacyJobs}
        style={[styles.fixBtn, fixing && { opacity: 0.6 }]}
      >
        <Text style={styles.fixBtnText}>
          {fixing ? "Normaliserer…" : "Ret gamle opgaver"}
        </Text>
      </TouchableOpacity>

      {/* Aktive jobs */}
      <Text style={styles.sectionTitle}>Aktive jobs</Text>
      {activeJobs.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Ingen aktive jobs</Text>
          <Text style={styles.emptyText}>
            Tag et job fra oversigten for at komme i gang.
          </Text>
        </View>
      ) : (
        <FlatList
          data={activeJobs}
          keyExtractor={(it) => it.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRowTop}>
                <Text style={styles.cardTitle}>{item.title || "Job"}</Text>
                <Text style={styles.cardPrice}>{DKK(item.price)}</Text>
              </View>
              <Text style={styles.cardMeta}>{formatDateShort(item.createdAt)}</Text>
              <View style={{ flexDirection: "row", gap: 8, marginTop: 8 }}>
                <TouchableOpacity
                  style={styles.btnWarn}
                  onPress={() => startJob(item)}
                >
                  <Text style={styles.btnText}>Start</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  style={styles.btnSuccess}
                  onPress={() => completeJob(item)}
                >
                  <Text style={styles.btnText}>Afslut</Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        />
      )}

      {/* Færdige jobs med stack */}
      <Text style={styles.sectionTitle}>Færdige jobs</Text>
      <CompletedStackVertical
        items={completedJobs}
        onOpen={(jobId) => navigation.navigate("JobDetail", { jobId })}
      />

      {/* Udbetalinger */}
      <Text style={styles.sectionTitle}>Udbetalinger</Text>
      {payouts.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Ingen udbetalinger endnu</Text>
        </View>
      ) : (
        <View style={{ paddingBottom: 8 }}>
          {payouts.map((p) => (
            <View key={p.id} style={styles.payoutRow}>
              <Text style={{ fontWeight: "700" }}>{DKK(p.amount)}</Text>
              <Text style={{ color: "#6b7280" }}>{formatDateShort(p.createdAt)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* Reviews */}
      <Text style={styles.sectionTitle}>Anmeldelser</Text>
      {reviews.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Ingen anmeldelser endnu</Text>
          <Text style={styles.emptyText}>
            Når bådejere anmelder dig, vises de her.
          </Text>
        </View>
      ) : (
        <FlatList
          data={reviews}
          keyExtractor={(it) => it.id}
          scrollEnabled={false}
          contentContainerStyle={{ gap: 10 }}
          renderItem={({ item }) => (
            <View style={styles.card}>
              <View style={styles.cardRowTop}>
                <Text style={styles.cardTitle}>
                  {item.authorName || "Bådejer"}
                </Text>
                <Text style={styles.cardPrice}>
                  {typeof item.rating === "number" ? `${item.rating}/5★` : "—"}
                </Text>
              </View>
              {item.comment && (
                <Text style={styles.cardSub}>{item.comment}</Text>
              )}
              <Text style={styles.cardMeta}>
                {formatDateShort(item.createdAt)}
              </Text>
            </View>
          )}
        />
      )}
    </ScrollView>
  );
}

/* ---------- Collapsed Completed Stack ---------- */
function CompletedStackVertical({ items, onOpen }) {
  const [expanded, setExpanded] = useState(false);

  if (!items || items.length === 0) {
    return (
      <View style={styles.emptyBox}>
        <Text style={styles.emptyTitle}>Ingen færdige jobs endnu</Text>
      </View>
    );
  }

  if (expanded) {
    return (
      <>
        <FlatList
          data={items}
          keyExtractor={(it) => it.id}
          scrollEnabled={false}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => onOpen(item.id)}
              style={styles.card}
            >
              <View style={styles.cardRowTop}>
                <Text style={styles.cardTitle}>{item.title}</Text>
                <Text style={styles.cardPrice}>{DKK(item.price)}</Text>
              </View>
              <Text style={styles.cardMeta}>{formatDateShort(item.createdAt)}</Text>
            </TouchableOpacity>
          )}
        />
        <TouchableOpacity
          onPress={() => setExpanded(false)}
          style={styles.stackToggle}
        >
          <Text style={styles.stackToggleText}>Vis som stak</Text>
        </TouchableOpacity>
      </>
    );
  }

  const topN = items.slice(0, 3);
  return (
    <>
      <View style={styles.stackWrap}>
        {topN.map((it, idx) => (
          <TouchableOpacity
            key={it.id}
            onPress={() => onOpen(it.id)}
            style={[
              styles.stackCard,
              { top: idx * 12, zIndex: 100 - idx },
            ]}
          >
            <View style={styles.cardRowTop}>
              <Text style={styles.cardTitle}>{it.title}</Text>
              <Text style={styles.cardPrice}>{DKK(it.price)}</Text>
            </View>
            <Text style={styles.cardMeta}>{formatDateShort(it.createdAt)}</Text>
          </TouchableOpacity>
        ))}
      </View>
      <TouchableOpacity
        onPress={() => setExpanded(true)}
        style={styles.stackToggle}
      >
        <Text style={styles.stackToggleText}>
          Se alle {items.length}
        </Text>
      </TouchableOpacity>
    </>
  );
}
