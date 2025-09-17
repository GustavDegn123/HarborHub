import React, { useEffect, useMemo, useState } from "react";
import { View, Text, StyleSheet, FlatList, ActivityIndicator, TouchableOpacity, ScrollView } from "react-native";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, query, where, limit } from "firebase/firestore";

const DKK = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(n)
    : "–";

const dateStr = (ts) => {
  const d = ts?.toDate ? ts.toDate() : null;
  if (!d) return "";
  return new Intl.DateTimeFormat("da-DK", { dateStyle: "medium" }).format(d);
};

export default function ProviderProfileScreen() {
  const auth = getAuth();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [prov, setProv] = useState(null);

  const [jobsRaw, setJobsRaw] = useState([]);     // alle hentede jobs (claimedBy = uid)
  const [payouts, setPayouts] = useState([]);     // providers/{uid}/payouts
  const [reviews, setReviews] = useState([]);     // reviews hvor providerId = uid

  const [filter, setFilter] = useState("all");    // all | d1 | d7 | d30

  // HENT DATA (vi undgår krævende Firestore-indekser ved at sortere/filtrere i klienten)
  useEffect(() => {
    let cancelled = false;
    (async () => {
      if (!user) return;
      setLoading(true);
      try {
        // Provider-profil
        const provSnap = await getDoc(doc(db, "providers", user.uid));
        const provider = provSnap.exists() ? provSnap.data() : {};
        if (!cancelled) setProv(provider);

        // Jobs hvor jeg er udfører (claimedBy = uid), max 100
        const qJobs = query(collection(db, "jobs"), where("claimedBy", "==", user.uid), limit(100));
        const jobsSnap = await getDocs(qJobs);
        let jobsArr = [];
        jobsSnap.forEach(d => jobsArr.push({ id: d.id, ...d.data() }));
        // sortér nyeste først
        jobsArr.sort((a,b) => {
          const ta = a?.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tb = b?.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tb - ta;
        });
        if (!cancelled) setJobsRaw(jobsArr);

        // Payouts: providers/{uid}/payouts
        const qP = query(collection(db, "providers", user.uid, "payouts"), limit(50));
        const payoutsSnap = await getDocs(qP);
        const payoutsArr = [];
        payoutsSnap.forEach(d => payoutsArr.push({ id: d.id, ...d.data() }));
        payoutsArr.sort((a,b) => {
          const ta = a?.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tb = b?.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tb - ta;
        });
        if (!cancelled) setPayouts(payoutsArr);

        // Reviews: reviews hvor providerId = uid
        const qR = query(collection(db, "reviews"), where("providerId", "==", user.uid), limit(50));
        const reviewsSnap = await getDocs(qR);
        const reviewsArr = [];
        reviewsSnap.forEach(d => reviewsArr.push({ id: d.id, ...d.data() }));
        reviewsArr.sort((a,b) => {
          const ta = a?.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tb = b?.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tb - ta;
        });
        if (!cancelled) setReviews(reviewsArr);

      } catch (e) {
        console.warn("ProviderProfile load error:", e?.message || e);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, [user]);

  // Filtrer jobs (status completed/paid) og efter periode
  const jobsFiltered = useMemo(() => {
    const now = Date.now();
    const maxAgeDays =
      filter === "d1" ? 1 :
      filter === "d7" ? 7 :
      filter === "d30" ? 30 : null;

    return jobsRaw.filter(j => {
      const okStatus = j?.status === "completed" || j?.status === "paid";
      if (!okStatus) return false;
      if (!maxAgeDays) return true;
      const t = j?.createdAt?.toMillis ? j.createdAt.toMillis() : null;
      if (!t) return false;
      const diffDays = (now - t) / (1000*60*60*24);
      return diffDays <= maxAgeDays;
    });
  }, [jobsRaw, filter]);

  const stats = useMemo(() => {
    const total = jobsFiltered.reduce((s, j) => s + (typeof j.price === "number" ? j.price : 0), 0);
    return { totalEarnings: total, jobsDone: jobsFiltered.length };
  }, [jobsFiltered]);

  const ratingText = useMemo(() => {
    const avg = prov?.ratingAvg ?? null;
    const cnt = prov?.ratingCount ?? null;
    if (avg != null && cnt != null) return `${avg.toFixed(1)} / 5 • ${cnt} anmeldelser`;
    return "Ingen vurderinger endnu";
  }, [prov]);

  const renderJob = ({ item }) => (
    <View style={styles.card}>
      <View style={styles.rowBetween}>
        <Text style={styles.cardTitle}>{item?.title || "Opgave"}</Text>
        <Text style={styles.cardPrice}>{DKK(item?.price)}</Text>
      </View>
      <Text style={styles.cardSub} numberOfLines={2}>{item?.description || "Ingen beskrivelse"}</Text>
      <View style={[styles.rowBetween, { marginTop: 8 }]}>
        <Text style={styles.cardMeta}>{item?.serviceId || "ydelse"}</Text>
        <Text style={styles.cardMeta}>
          {(item?.status || "").toUpperCase()}{dateStr(item?.createdAt) ? ` • ${dateStr(item?.createdAt)}` : ""}
        </Text>
      </View>
    </View>
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: "#6b7280" }}>Henter profil…</Text>
      </View>
    );
  }

  const displayName = prov?.displayName || prov?.companyName || (auth.currentUser?.email ?? "Udbyder");

  return (
    <ScrollView style={{ flex: 1, backgroundColor: "#f6f9fc" }}>
      {/* HEADER */}
      <View style={styles.header}>
        <Text style={styles.name}>{displayName}</Text>
        <Text style={styles.rating}>{ratingText}</Text>

        {/* KPI'er + filterchips */}
        <View style={styles.kpis}>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Indtjening</Text>
            <Text style={styles.kpiValue}>{DKK(stats.totalEarnings)}</Text>
          </View>
          <View style={styles.kpi}>
            <Text style={styles.kpiLabel}>Udførte jobs</Text>
            <Text style={styles.kpiValue}>{stats.jobsDone}</Text>
          </View>
        </View>

        <View style={styles.filters}>
          {[
            {key:"all", label:"Alt"},
            {key:"d30", label:"30 dage"},
            {key:"d7",  label:"7 dage"},
            {key:"d1",  label:"24 timer"},
          ].map(f => (
            <TouchableOpacity key={f.key}
              onPress={() => setFilter(f.key)}
              style={[styles.filterChip, filter === f.key && styles.filterChipActive]}>
              <Text style={[styles.filterChipText, filter === f.key && styles.filterChipTextActive]}>{f.label}</Text>
            </TouchableOpacity>
          ))}
        </View>
      </View>

      {/* JOB-HISTORIK */}
      <Text style={styles.sectionTitle}>Seneste jobs</Text>
      {jobsFiltered.length === 0 ? (
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ color: "#6b7280" }}>Ingen afsluttede jobs i valgte periode.</Text>
        </View>
      ) : (
        <FlatList
          data={jobsFiltered}
          keyExtractor={(it) => it.id}
          renderItem={renderJob}
          scrollEnabled={false}
          contentContainerStyle={{ paddingBottom: 8 }}
        />
      )}

      {/* UDBETALINGER */}
      <Text style={styles.sectionTitle}>Udbetalinger</Text>
      {payouts.length === 0 ? (
        <View style={{ paddingHorizontal: 16, paddingVertical: 12 }}>
          <Text style={{ color: "#6b7280" }}>Ingen udbetalinger endnu.</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, paddingBottom: 8 }}>
          {payouts.map(p => (
            <View key={p.id} style={styles.payoutRow}>
              <Text style={{ color: "#0f1f2a", fontWeight: "700" }}>{DKK(p?.amount)}</Text>
              <Text style={{ color: "#6b7280" }}>{dateStr(p?.createdAt)}</Text>
            </View>
          ))}
        </View>
      )}

      {/* REVIEWS */}
      <Text style={styles.sectionTitle}>Anmeldelser</Text>
      {reviews.length === 0 ? (
        <View style={{ paddingHorizontal: 16, paddingVertical: 12, marginBottom: 20 }}>
          <Text style={{ color: "#6b7280" }}>Ingen anmeldelser endnu.</Text>
        </View>
      ) : (
        <View style={{ paddingHorizontal: 16, marginBottom: 20 }}>
          {reviews.map(r => (
            <View key={r.id} style={styles.reviewCard}>
              <View style={styles.rowBetween}>
                <Text style={{ fontWeight: "800", color: "#0f1f2a" }}>{r?.authorName || "Kunde"}</Text>
                <Text style={{ color: "#0f1f2a", fontWeight: "800" }}>{r?.rating != null ? `${r.rating}/5` : "—"}</Text>
              </View>
              {r?.comment ? <Text style={{ color: "#4b5563", marginTop: 4 }}>{r.comment}</Text> : null}
              <Text style={{ color: "#6b7280", marginTop: 6 }}>{dateStr(r?.createdAt)}</Text>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },

  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },
  name: { fontSize: 22, fontWeight: "800", color: "#0f1f2a" },
  rating: { marginTop: 4, color: "#4b5563" },

  kpis: { flexDirection: "row", gap: 10, marginTop: 14 },
  kpi: {
    flex: 1,
    backgroundColor: "#f8fbff",
    borderWidth: 1,
    borderColor: "#e6eef4",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  kpiLabel: { color: "#6b7280", marginBottom: 4, fontWeight: "600" },
  kpiValue: { color: "#0f1f2a", fontSize: 18, fontWeight: "900" },

  filters: { flexDirection: "row", gap: 8, marginTop: 12 },
  filterChip: {
    paddingVertical: 6, paddingHorizontal: 10, borderRadius: 999,
    backgroundColor: "#eef5fa", borderWidth: 1, borderColor: "#d8e6f0",
  },
  filterChipActive: { backgroundColor: "#1f5c7d", borderColor: "#1f5c7d" },
  filterChipText: { color: "#1f5c7d", fontWeight: "700" },
  filterChipTextActive: { color: "#fff" },

  sectionTitle: { marginTop: 16, marginBottom: 8, paddingHorizontal: 16, color: "#0f1f2a", fontWeight: "800", fontSize: 16 },

  card: {
    marginHorizontal: 16, marginVertical: 6, backgroundColor: "#fff",
    borderRadius: 12, borderWidth: 1, borderColor: "#e6eef4", padding: 12,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontWeight: "800", color: "#0f1f2a" },
  cardPrice: { fontWeight: "800", color: "#0f1f2a" },
  cardSub: { color: "#4b5563", marginTop: 2 },
  cardMeta: { color: "#6b7280" },

  payoutRow: {
    paddingVertical: 10, borderBottomWidth: 1, borderBottomColor: "#eef2f7",
    flexDirection: "row", justifyContent: "space-between"
  },

  reviewCard: {
    backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: "#e6eef4",
    padding: 12, marginBottom: 10
  },
});
