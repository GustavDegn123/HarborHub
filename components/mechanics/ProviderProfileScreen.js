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
import { auth, db } from "../../firebase";
import {
  doc,
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import {
  getProviderProfile,
  getProviderPayouts,
  listenProviderReviews,
} from "../../services/providersService";
import styles from "../../styles/mechanics/providerProfileStyles";

/* Helpers */
const DKK = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("da-DK", {
        style: "currency",
        currency: "DKK",
        maximumFractionDigits: 0,
      }).format(n)
    : "—";

function Stars({ rating = 0, size = 14 }) {
  const r = Math.max(0, Math.min(5, Number(rating) || 0));
  const full = Math.floor(r);
  const half = r - full >= 0.5;
  return (
    <Text style={{ color: "#F59E0B", fontWeight: "700", fontSize: size }}>
      {"★".repeat(full)}
      {half ? "½" : ""}
      {full === 0 && !half ? "—" : ""} {r ? `(${r.toFixed(1)})` : ""}
    </Text>
  );
}

/* Status-label med farvekoder */
function StatusLabel({ status }) {
  const s = String(status || "assigned").toLowerCase();
  let color = "#6B7280";
  let label = s;

  if (s === "assigned") {
    color = "#3B82F6"; // blå
    label = "Tildelt";
  } else if (s === "in_progress") {
    color = "#FBBF24"; // gul
    label = "I gang";
  } else if (s === "completed") {
    color = "#9CA3AF"; // grå
    label = "Afsluttet (afventer betaling)";
  } else if (s === "paid") {
    color = "#10B981"; // grøn
    label = "Betalt (afventer anmeldelse)";
  } else if (s === "reviewed") {
    color = "#22C55E"; // mørk grøn
    label = "Afsluttet & anmeldt";
  }

  return <Text style={{ color, fontWeight: "600" }}>{label}</Text>;
}

export default function ProviderProfileScreen({ navigation }) {
  const uid = auth.currentUser?.uid;

  const [loading, setLoading] = useState(true);
  const [prov, setProv] = useState(null);
  const [assigned, setAssigned] = useState([]); // providers/{uid}/assigned_jobs
  const [payouts, setPayouts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);
  const [jobSummaries, setJobSummaries] = useState({});
  const [showCompleted, setShowCompleted] = useState(false);

  /* 1) Profil + udbetalinger */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!uid) return;
      try {
        const [profile, payoutsData] = await Promise.all([
          getProviderProfile(uid).catch(() => ({})),
          getProviderPayouts(uid).catch(() => []),
        ]);
        if (!cancelled) {
          setProv(profile || {});
          setPayouts(
            (payoutsData || []).sort(
              (a, b) =>
                (b?.createdAt?.toMillis?.() || 0) -
                (a?.createdAt?.toMillis?.() || 0)
            )
          );
        }
      } catch (e) {
        if (!cancelled) setError(e?.message || String(e));
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [uid]);

  /* 2) Live: jobs + resuméer */
  useEffect(() => {
    if (!uid) return;
    const qRef = query(
      collection(db, "providers", uid, "assigned_jobs"),
      orderBy("assigned_at", "desc")
    );
    const unsub = onSnapshot(
      qRef,
      async (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAssigned(rows);

        const missing = rows
          .map((r) => r.job_id || r.id)
          .filter((id) => id && !jobSummaries[id]);

        if (missing.length) {
          const updates = {};
          for (const jobId of missing) {
            try {
              const s = await getDoc(doc(db, "service_requests", jobId));
              if (s.exists()) {
                const d = s.data() || {};
                updates[jobId] = {
                  service_type: d.service_type || d.title || "Serviceopgave",
                  owner_id: d.owner_id || null,
                };
              } else {
                updates[jobId] = { service_type: "Serviceopgave", owner_id: null };
              }
            } catch {
              updates[jobId] = { service_type: "Serviceopgave", owner_id: null };
            }
          }
          setJobSummaries((prev) => ({ ...prev, ...updates }));
        }
      },
      (e) => setError(e?.message || String(e))
    );
    return () => unsub();
  }, [uid, jobSummaries]);

  /* 3) Reviews */
  useEffect(() => {
    if (!uid) return;
    const unsub = listenProviderReviews(uid, (arr) => setReviews(arr || []));
    return () => unsub?.();
  }, [uid]);

  /* KPI’er */
  const { activeJobs, completedJobs, activeCount, completedCount, earnings } =
    useMemo(() => {
      const act = [];
      const done = [];
      let sum = 0;

      for (const j of assigned) {
        const s = String(j.status || "").toLowerCase();
        if (["completed", "paid", "reviewed"].includes(s)) {
          done.push(j);
          if (typeof j.price === "number") sum += j.price; // 100% af pris
        } else {
          act.push(j);
        }
      }
      return {
        activeJobs: act,
        completedJobs: done,
        activeCount: act.length,
        completedCount: done.length,
        earnings: sum,
      };
    }, [assigned]);

  /* Rating fallback */
  const { avgFromReviews, countFromReviews } = useMemo(() => {
    const valid = (reviews || []).filter(
      (r) => typeof r?.rating === "number" && !Number.isNaN(r.rating)
    );
    const count = valid.length;
    const avg = count
      ? Math.round(
          (valid.reduce((s, r) => s + Number(r.rating), 0) / count) * 10
        ) / 10
      : 0;
    return { avgFromReviews: avg, countFromReviews: count };
  }, [reviews]);

  const avgRating =
    typeof prov?.avgRating === "number" && prov?.reviewCount > 0
      ? prov.avgRating
      : avgFromReviews;
  const reviewCount =
    typeof prov?.reviewCount === "number" && prov?.reviewCount > 0
      ? prov.reviewCount
      : countFromReviews;

  /* Total udbetalinger (90% gemt i payouts af webhook) */
  const totalPayouts = useMemo(
    () => payouts.reduce((s, p) => s + (p.amount || 0), 0),
    [payouts]
  );

  /* Status-opdatering */
  async function setStatus(job, status) {
    try {
      const jobId = job.job_id || job.id;
      if (!jobId) throw new Error("Mangler job-id");

      await updateDoc(doc(db, "service_requests", jobId), {
        status,
        updated_at: serverTimestamp(),
        ...(status === "in_progress" ? { startedAt: serverTimestamp() } : {}),
        ...(status === "completed" ? { completedAt: serverTimestamp() } : {}),
      });

      await updateDoc(doc(db, "providers", uid, "assigned_jobs", jobId), {
        status,
        ...(status === "in_progress" ? { started_at: serverTimestamp() } : {}),
        ...(status === "completed" ? { completed_at: serverTimestamp() } : {}),
      });
    } catch (e) {
      Alert.alert("Fejl", e?.message || "Kunne ikke opdatere jobstatus.");
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
  if (error) {
    return (
      <View style={styles.loader}>
        <Text style={styles.loaderText}>Fejl: {error}</Text>
      </View>
    );
  }

  const displayName =
    prov?.displayName || prov?.companyName || auth.currentUser?.email || "Min profil";
  const titleFor = (job) =>
    jobSummaries[job.job_id || job.id]?.service_type || "Serviceopgave";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
      {/* Header */}
      <Text style={styles.header}>{displayName}</Text>
      {prov?.email ? <Text style={styles.subheader}>{prov.email}</Text> : null}

      {/* KPI’er */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Aktive</Text>
          <Text style={styles.kpiValue}>{activeCount}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Færdige</Text>
          <Text style={styles.kpiValue}>{completedCount}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Indtjening</Text>
          <Text style={styles.kpiValue}>{DKK(earnings)}</Text>
        </View>
        <View style={styles.kpiCard}>
          <Text style={styles.kpiLabel}>Udbetalt</Text>
          <Text style={styles.kpiValue}>{DKK(totalPayouts)}</Text>
        </View>
      </View>

      {/* Rating */}
      <View style={[styles.card, { alignItems: "flex-start", marginTop: 12 }]}>
        <Text style={styles.cardTitle}>Rating</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
          <Stars rating={avgRating} size={16} />
          <Text style={styles.cardMeta}>
            {reviewCount} {reviewCount === 1 ? "anmeldelse" : "anmeldelser"}
          </Text>
        </View>
      </View>

      {/* Genveje */}
      <TouchableOpacity
        style={styles.fixBtn}
        onPress={() => navigation.navigate("AssignedJobs")}
      >
        <Text style={styles.fixBtnText}>Åbn “Mine opgaver”</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.fixBtn}
        onPress={() => navigation.navigate("ProviderCalendar")}
      >
        <Text style={styles.fixBtnText}>Åbn kalender</Text>
      </TouchableOpacity>

      {/* Aktive jobs */}
      <Text style={styles.sectionTitle}>Aktive jobs</Text>
      {activeJobs.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Ingen aktive jobs</Text>
        </View>
      ) : (
        <FlatList
          data={activeJobs}
          keyExtractor={(it) => it.job_id || it.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => {
            const id = item.job_id || item.id;
            return (
              <View style={styles.card}>
                <View style={styles.cardRowTop}>
                  <Text style={styles.cardTitle}>{titleFor(item)}</Text>
                  {item.price != null ? (
                    <Text style={styles.cardPrice}>{DKK(Number(item.price))}</Text>
                  ) : null}
                </View>
                <StatusLabel status={item.status} />

                <View style={{ flexDirection: "row", gap: 8, marginTop: 10 }}>
                  {String(item.status).toLowerCase() !== "in_progress" && (
                    <TouchableOpacity
                      style={styles.btnWarn}
                      onPress={() => setStatus(item, "in_progress")}
                    >
                      <Text style={styles.btnText}>Start</Text>
                    </TouchableOpacity>
                  )}
                  <TouchableOpacity
                    style={styles.btnSuccess}
                    onPress={() => setStatus(item, "completed")}
                  >
                    <Text style={styles.btnText}>Afslut</Text>
                  </TouchableOpacity>
                  <TouchableOpacity
                    style={styles.smallBtn}
                    onPress={() => navigation.navigate("JobDetail", { jobId: id })}
                  >
                    <Text style={styles.smallBtnText}>Detaljer</Text>
                  </TouchableOpacity>
                </View>
              </View>
            );
          }}
        />
      )}

      {/* Færdige jobs – fold ud */}
      <Text style={styles.sectionTitle}>Færdige jobs</Text>
      <TouchableOpacity
        onPress={() => setShowCompleted((v) => !v)}
        style={[
          styles.card,
          { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
        ]}
      >
        <Text style={styles.cardTitle}>Færdige jobs</Text>
        <Text style={styles.cardPrice}>
          {completedJobs.length} {completedJobs.length === 1 ? "job" : "jobs"}{" "}
          {showCompleted ? "▾" : "▸"}
        </Text>
      </TouchableOpacity>

      {showCompleted &&
        (completedJobs.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Ingen færdige jobs endnu</Text>
          </View>
        ) : (
          <FlatList
            data={completedJobs}
            keyExtractor={(it) => it.job_id || it.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
            renderItem={({ item }) => {
              const id = item.job_id || item.id;
              return (
                <TouchableOpacity
                  style={styles.card}
                  onPress={() => navigation.navigate("JobDetail", { jobId: id })}
                >
                  <View style={styles.cardRowTop}>
                    <Text style={styles.cardTitle}>{titleFor(item)}</Text>
                    {item.price != null ? (
                      <Text style={styles.cardPrice}>{DKK(Number(item.price))}</Text>
                    ) : null}
                  </View>
                  <StatusLabel status={item.status} />
                  <Text style={[styles.cardMeta, { marginTop: 4 }]}>
                    Tryk for detaljer (ejer, beskrivelse, mm.)
                  </Text>
                </TouchableOpacity>
              );
            }}
          />
        ))}

      {/* Udbetalinger */}
      <Text style={styles.sectionTitle}>Udbetalinger</Text>
      {payouts.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Ingen udbetalinger endnu</Text>
        </View>
      ) : (
        <View style={{ gap: 8 }}>
          {payouts.map((p) => (
            <View key={p.id} style={styles.payoutRow}>
              <Text style={{ fontWeight: "700" }}>{DKK(p.amount)}</Text>
              <Text style={{ color: "#6b7280" }}>
                {p.createdAt?.toDate?.().toLocaleDateString?.("da-DK") || ""}
              </Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
