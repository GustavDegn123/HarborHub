import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { auth, db } from "../../firebase";
import { doc, collection, onSnapshot, query, orderBy, getDoc } from "firebase/firestore";
import { getProviderProfile, listenProviderPayouts, listenProviderReviews } from "../../services/providersService";
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

export default function ProviderProfileScreen({ navigation }) {
  const uid = auth.currentUser?.uid;

  const [loading, setLoading] = useState(true);
  const [prov, setProv] = useState(null);
  const [assigned, setAssigned] = useState([]);
  const [payouts, setPayouts] = useState([]);
  const [reviews, setReviews] = useState([]);
  const [error, setError] = useState(null);
  const [jobSummaries, setJobSummaries] = useState({});

  /* Profil */
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!uid) return;
      try {
        const profile = await getProviderProfile(uid).catch(() => ({}));
        if (!cancelled) setProv(profile || {});
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

  /* Udbetalinger */
  useEffect(() => {
    if (!uid) return;
    const unsub = listenProviderPayouts(uid, (rows) => setPayouts(rows));
    return () => unsub();
  }, [uid]);

  /* Jobs */
  useEffect(() => {
    if (!uid) return;
    const qRef = query(collection(db, "providers", uid, "assigned_jobs"), orderBy("assigned_at", "desc"));
    const unsub = onSnapshot(
      qRef,
      async (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAssigned(rows);

        // hent manglende jobdata
        const missing = rows.map((r) => r.job_id || r.id).filter((id) => id && !jobSummaries[id]);
        if (missing.length) {
          const updates = {};
          for (const jobId of missing) {
            try {
              const s = await getDoc(doc(db, "service_requests", jobId));
              if (s.exists()) {
                const d = s.data() || {};
                updates[jobId] = { service_type: d.service_type || d.title || "Serviceopgave" };
              } else {
                updates[jobId] = { service_type: "Serviceopgave" };
              }
            } catch {
              updates[jobId] = { service_type: "Serviceopgave" };
            }
          }
          setJobSummaries((prev) => ({ ...prev, ...updates }));
        }
      },
      (e) => setError(e?.message || String(e))
    );
    return () => unsub();
  }, [uid, jobSummaries]);

  /* Reviews */
  useEffect(() => {
    if (!uid) return;
    const unsub = listenProviderReviews(uid, (arr) => setReviews(arr || []));
    return () => unsub?.();
  }, [uid]);

  /* KPI’er */
  const { activeJobs, completedJobs, activeCount, completedCount, earnings } = useMemo(() => {
    const act = [];
    const done = [];
    let sum = 0;
    for (const j of assigned) {
      const s = String(j.status || "").toLowerCase();
      if (["completed", "paid", "reviewed"].includes(s)) {
        done.push(j);
        if (typeof j.price === "number") sum += j.price;
      } else {
        act.push(j);
      }
    }
    return { activeJobs: act, completedJobs: done, activeCount: act.length, completedCount: done.length, earnings: sum };
  }, [assigned]);

  /* Rating */
  const { avgFromReviews, countFromReviews } = useMemo(() => {
    const valid = (reviews || []).filter((r) => typeof r?.rating === "number" && !Number.isNaN(r.rating));
    const count = valid.length;
    const avg = count ? Math.round((valid.reduce((s, r) => s + Number(r.rating), 0) / count) * 10) / 10 : 0;
    return { avgFromReviews: avg, countFromReviews: count };
  }, [reviews]);

  const avgRating =
    typeof prov?.avgRating === "number" && prov?.reviewCount > 0 ? prov.avgRating : avgFromReviews;
  const reviewCount =
    typeof prov?.reviewCount === "number" && prov?.reviewCount > 0 ? prov.reviewCount : countFromReviews;

  const totalPayouts = useMemo(() => payouts.reduce((s, p) => s + (p.amount || 0), 0), [payouts]);

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

  const displayName = prov?.displayName || prov?.companyName || auth.currentUser?.email || "Min profil";
  const titleFor = (job) => jobSummaries[job.job_id || job.id]?.service_type || "Serviceopgave";

  const statusLabel = (s) => {
    switch (String(s).toLowerCase()) {
      case "completed":
        return "Afsluttet (afventer betaling)";
      case "paid":
        return "Betalt (afventer anmeldelse)";
      case "reviewed":
        return "Afsluttet & anmeldt";
      default:
        return s;
    }
  };

  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
      {/* Header */}
      <Text style={styles.header}>{displayName}</Text>
      {prov?.email ? <Text style={styles.subheader}>{prov.email}</Text> : null}

      {/* KPI’er */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Aktive</Text><Text style={styles.kpiValue}>{activeCount}</Text></View>
        <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Færdige</Text><Text style={styles.kpiValue}>{completedCount}</Text></View>
        <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Indtjening</Text><Text style={styles.kpiValue}>{DKK(earnings)}</Text></View>
        <View style={styles.kpiCard}><Text style={styles.kpiLabel}>Udbetalt</Text><Text style={styles.kpiValue}>{DKK(totalPayouts)}</Text></View>
      </View>

      {/* Rating */}
      <View style={[styles.card, { alignItems: "flex-start", marginTop: 12 }]}>
        <Text style={styles.cardTitle}>Rating</Text>
        <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginTop: 6 }}>
          <Stars rating={avgRating} size={16} />
          <Text style={styles.cardMeta}>{reviewCount} {reviewCount === 1 ? "anmeldelse" : "anmeldelser"}</Text>
        </View>
      </View>

      {/* Completed jobs */}
      <Text style={styles.sectionTitle}>Færdige jobs</Text>
      {completedJobs.length === 0 ? (
        <View style={styles.emptyBox}><Text style={styles.emptyTitle}>Ingen færdige jobs endnu</Text></View>
      ) : (
        <FlatList
          data={completedJobs}
          keyExtractor={(it) => it.job_id || it.id}
          scrollEnabled={false}
          ItemSeparatorComponent={() => <View style={{ height: 8 }} />}
          renderItem={({ item }) => (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("JobDetail", { jobId: item.job_id || item.id })}
            >
              <View style={styles.cardRowTop}>
                <Text style={styles.cardTitle}>{titleFor(item)}</Text>
                {item.price != null ? <Text style={styles.cardPrice}>{DKK(Number(item.price))}</Text> : null}
              </View>
              <Text style={styles.cardMeta}>{statusLabel(item.status)}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {/* Udbetalinger */}
      <Text style={styles.sectionTitle}>Udbetalinger</Text>
      {payouts.length === 0 ? (
        <View style={styles.emptyBox}><Text style={styles.emptyTitle}>Ingen udbetalinger endnu</Text></View>
      ) : (
        <View style={{ gap: 8 }}>
          {payouts.map((p) => (
            <View key={p.id} style={styles.payoutRow}>
              <Text style={{ fontWeight: "700" }}>{DKK(p.amount)}</Text>
              <Text style={{ color: "#6b7280" }}>{p.createdAt?.toDate?.().toLocaleDateString?.("da-DK") || ""}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}
