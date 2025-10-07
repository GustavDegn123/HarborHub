// /components/mechanics/ProviderProfileScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  ScrollView,
  Alert,
  Image,
} from "react-native";
import * as Linking from "expo-linking";
import * as WebBrowser from "expo-web-browser";
import Constants from "expo-constants";
import { Feather } from "@expo/vector-icons";
import { auth, db } from "../../firebase";
import {
  doc,
  collection,
  onSnapshot,
  query,
  orderBy,
  updateDoc,
  setDoc,
  serverTimestamp,
} from "firebase/firestore";
import {
  getProviderProfile,
  getProviderPayouts,
  listenProviderReviews,
} from "../../services/providersService";
import { useCriiptoVerify } from "@criipto/verify-expo";
import styles, { COLORS } from "../../styles/mechanics/providerProfileStyles";
import { logout } from "../../services/authService";
 
// Sørg for at AuthSession færdiggøres når vi vender tilbage fra browser
WebBrowser.maybeCompleteAuthSession();
 
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
  const [showCompleted, setShowCompleted] = useState(false);
 
  // Criipto (MitID) hook
  const { login: mitIdLogin, claims, error: mitIdError } = useCriiptoVerify();
 
  // 1) Hent basis-profil + udbetalinger (engangs)
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
 
  // 2) Live: lyt til tildelte jobs
  useEffect(() => {
    if (!uid) return;
    const qRef = query(
      collection(db, "providers", uid, "assigned_jobs"),
      orderBy("assigned_at", "desc")
    );
    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setAssigned(rows);
      },
      (e) => setError(e?.message || String(e))
    );
    return () => unsub();
  }, [uid]);
 
  // 3) Live: lyt til reviews
  useEffect(() => {
    if (!uid) return;
    const unsub = listenProviderReviews(
      uid,
      (arr) => setReviews(arr || []),
      () => {}
    );
    return () => unsub?.();
  }, [uid]);
 
  // Split på aktive / færdige + KPI’er
  const { activeJobs, completedJobs, activeCount, completedCount, earnings } =
    useMemo(() => {
      const act = [];
      const done = [];
      let sum = 0;
 
      for (const j of assigned) {
        const s = String(j.status || "").toLowerCase();
        if (
          s === "completed" ||
          s === "done" ||
          s === "closed" ||
          s === "reviewed" ||
          s === "paid"
        ) {
          done.push(j);
          if (typeof j.price === "number") sum += j.price;
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
 
  // Total udbetalt (sum af payouts.amount)
  const payoutsTotal = useMemo(() => {
    try {
      return (payouts || []).reduce((acc, p) => {
        const n = Number(p?.amount);
        return acc + (Number.isFinite(n) ? n : 0) / 100;
      }, 0);
    } catch {
      return 0;
    }
  }, [payouts]);
 
  // Fallback-beregning af rating ud fra reviews
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
 
  // Actions: opdatér jobstatus både i requests og i assigned_jobs
  async function setStatus(job, status) {
    try {
      const jobId = job.job_id || job.id;
      if (!jobId) throw new Error("Mangler job-id");
 
      // 1) service_requests/{jobId}
      await updateDoc(doc(db, "service_requests", jobId), {
        status,
        updated_at: serverTimestamp(),
        ...(status === "in_progress" ? { startedAt: serverTimestamp() } : {}),
        ...(status === "completed" ? { completedAt: serverTimestamp() } : {}),
      });
 
      // 2) providers/{uid}/assigned_jobs/{jobId}
      await updateDoc(doc(db, "providers", uid, "assigned_jobs", jobId), {
        status,
        ...(status === "in_progress" ? { started_at: serverTimestamp() } : {}),
        ...(status === "completed" ? { completed_at: serverTimestamp() } : {}),
      });
    } catch (e) {
      Alert.alert("Fejl", e?.message || "Kunne ikke opdatere jobstatus.");
    }
  }
 
  // MitID: Verificer-knap
  async function handleMitIDVerify() {
    if (!uid) {
      Alert.alert("MitID", "Du skal være logget ind for at verificere.");
      return;
    }
    try {
      const redirectUri =
        Constants.appOwnership === "expo"
          ? Linking.createURL("/auth/callback")
          : "harborhub://auth/callback";
 
      const acr = "urn:grn:authn:dk:mitid:substantial";
      const result = await mitIdLogin(acr, redirectUri);
 
      const c = claims || result?.claims || result || {};
 
      await setDoc(
        doc(db, "providers", uid),
        {
          mitidVerified: !!c?.sub,
          mitidSub: c?.sub || null,
          mitidAmr: Array.isArray(c?.amr) ? c.amr : [],
          mitidUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );
 
      await setDoc(
        doc(db, "users", uid),
        {
          mitidVerified: !!c?.sub,
          mitidSub: c?.sub || null,
          mitidAmr: Array.isArray(c?.amr) ? c.amr : [],
          mitidUpdatedAt: serverTimestamp(),
        },
        { merge: true }
      );
 
      Alert.alert("MitID", "✅ Din identitet er verificeret med MitID.");
      const latest = await getProviderProfile(uid).catch(() => ({}));
      setProv(latest || {});
    } catch (e) {
      const msg = String(e?.message || e);
      if (
        msg.includes("WebAuthenticationSession") ||
        msg.toLowerCase().includes("cancel")
      ) {
        Alert.alert(
          "Login afbrudt",
          "MitID-flowet blev afbrudt. Prøv igen og vent til du sendes tilbage til appen."
        );
      } else {
        Alert.alert(
          "MitID fejl",
          `${msg}\n\nTjek at denne URL er i Criipto “Callback URLs”:\n${
            Constants.appOwnership === "expo"
              ? Linking.createURL("/auth/callback")
              : "harborhub://auth/callback"
          }`
        );
      }
    }
  }
 
  // Log ud (med confirm)
  const handleLogout = () => {
    Alert.alert(
      "Log ud",
      "Er du sikker på, at du vil logge ud?",
      [
        { text: "Annuller", style: "cancel" },
        {
          text: "Log ud",
          style: "destructive",
          onPress: async () => {
            try {
              await logout();
            } catch (e) {
              Alert.alert("Fejl", e?.message || "Kunne ikke logge ud.");
            }
          },
        },
      ],
      { cancelable: true }
    );
  };
 
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
 
  const MitIDBadge = () =>
    prov?.mitidVerified ? (
      <View style={styles.badgeGood}>
        <Feather name="shield" size={14} color={COLORS.badgeGoodText} />
        <Text style={styles.badgeGoodText}>MitID verificeret</Text>
      </View>
    ) : (
      <View style={styles.badgeBad}>
        <Feather name="shield-off" size={14} color={COLORS.badgeBadText} />
        <Text style={styles.badgeBadText}>Ikke verificeret</Text>
      </View>
    );
 
  return (
    <ScrollView style={styles.screen} contentContainerStyle={{ padding: 16 }}>
      {/* Header – Airbnb varm */}
      <View style={styles.headerCard}>
        <Text style={styles.welcome}>
          Hej, {String(displayName).split(" ")[0]} 👋
        </Text>
        <Text style={styles.tagline}>Velkommen tilbage til HarborHub</Text>
      </View>
 
      {/* Identitet / MitID */}
      <View style={styles.identityCard}>
        <View style={styles.identityRow}>
          <Feather name="shield" size={20} color={COLORS.accent} />
          <Text style={styles.identityTitle}>Identitet</Text>
          <View style={{ flex: 1 }} />
          <MitIDBadge />
        </View>
 
        <Text style={styles.identityDesc}>
          Bekræft din identitet med MitID og vis bådejerne, at du er troværdig.
        </Text>
 
        <TouchableOpacity
          style={[
            styles.identityBtn,
            prov?.mitidVerified && { opacity: 0.6 },
          ]}
          disabled={!!prov?.mitidVerified}
          onPress={handleMitIDVerify}
        >
          <Text style={styles.identityBtnText}>
            {prov?.mitidVerified ? "Allerede verificeret" : "Verificér med MitID"}
          </Text>
        </TouchableOpacity>
 
        <Text style={styles.identityHelp}>
          Hvis du sidder fast på “Approved”, så vend tilbage til appen – den
          fortsætter automatisk. I Expo Go skal callback-URL’en være whitelisted
          i Criipto (General → Callback URLs).
        </Text>
 
        {mitIdError ? (
          <Text style={styles.identityError}>MitID fejl: {String(mitIdError)}</Text>
        ) : null}
      </View>
 
      {/* KPI’er – host-dashboard vibe */}
      <View style={styles.kpiGrid}>
        <View style={styles.kpiCard}>
          <Feather name="briefcase" size={18} color={COLORS.accent} />
          <Text style={styles.kpiValue}>{activeCount}</Text>
          <Text style={styles.kpiLabel}>Aktive jobs</Text>
        </View>
        <View style={styles.kpiCard}>
          <Feather name="check-circle" size={18} color={COLORS.good} />
          <Text style={styles.kpiValue}>{completedCount}</Text>
          <Text style={styles.kpiLabel}>Afsluttede</Text>
        </View>
        <View style={styles.kpiCard}>
          <Feather name="credit-card" size={18} color={COLORS.accent} />
          <Text style={styles.kpiValue}>{DKK(earnings)}</Text>
          <Text style={styles.kpiLabel}>Indtjening</Text>
        </View>
        <View style={styles.kpiCard}>
          <Feather name="arrow-down-circle" size={18} color={COLORS.accent} />
          <Text style={styles.kpiValue}>{DKK(payoutsTotal)}</Text>
          <Text style={styles.kpiLabel}>Udbetalt</Text>
        </View>
      </View>
 
      {/* Rating */}
      <View style={styles.card}>
        <View style={styles.rowBetween}>
          <Text style={styles.cardTitle}>Rating</Text>
          <Stars rating={avgRating} size={16} />
        </View>
        <Text style={styles.cardMeta}>
          {reviewCount} {reviewCount === 1 ? "anmeldelse" : "anmeldelser"}
        </Text>
      </View>
 
      {/* Genveje */}
      <View style={styles.quickRow}>
        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => navigation.navigate("AssignedJobs")}
        >
          <Feather name="clipboard" size={16} color={COLORS.accent} />
          <Text style={styles.quickText}>Mine opgaver</Text>
        </TouchableOpacity>
 
        <TouchableOpacity
          style={styles.quickButton}
          onPress={() => navigation.navigate("ProviderCalendar")}
        >
          <Feather name="calendar" size={16} color={COLORS.accent} />
          <Text style={styles.quickText}>Kalender</Text>
        </TouchableOpacity>
 
        <TouchableOpacity
          style={[styles.quickButton, { borderColor: "#FCA5A5", backgroundColor: "#FFE4E6" }]}
          onPress={handleLogout}
        >
          <Feather name="log-out" size={16} color={"#B91C1C"} />
          <Text style={[styles.quickText, { color: "#B91C1C" }]}>Log ud</Text>
        </TouchableOpacity>
      </View>
 
      {/* Færdige jobs – fold-ud */}
      <Text style={styles.sectionTitle}>Færdige jobs</Text>
      <TouchableOpacity
        onPress={() => setShowCompleted((v) => !v)}
        style={styles.expandCard}
      >
        <Text style={styles.cardTitle}>Se {completedJobs.length} færdige</Text>
        <Feather
          name={showCompleted ? "chevron-up" : "chevron-down"}
          size={18}
          color={COLORS.sub}
        />
      </TouchableOpacity>
 
      {showCompleted &&
        (completedJobs.length === 0 ? (
          <View style={styles.emptyBox}>
            <Text style={styles.emptyTitle}>Ingen færdige jobs endnu</Text>
            <Text style={styles.emptyText}>
              Når dine jobs afsluttes, vises de her.
            </Text>
          </View>
        ) : (
          <FlatList
            data={completedJobs}
            keyExtractor={(it) => it.job_id || it.id}
            scrollEnabled={false}
            ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
            renderItem={({ item }) => {
              const id = item.job_id || item.id;
              return (
                <TouchableOpacity
                  style={styles.jobCard}
                  onPress={() => navigation.navigate("JobDetail", { jobId: id })}
                >
                  <View style={styles.rowBetween}>
                    <Text style={styles.jobTitle}>Job #{id}</Text>
                    {item.price != null ? (
                      <Text style={styles.jobPrice}>
                        {DKK(Number(item.price))}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.cardMeta}>Status: completed</Text>
                </TouchableOpacity>
              );
            }}
          />
        ))}
 
      {/* Udbetalinger – “Airbnb payouts” */}
      <Text style={styles.sectionTitle}>Udbetalinger</Text>
      {payouts.length === 0 ? (
        <View style={styles.emptyBox}>
          <Text style={styles.emptyTitle}>Ingen udbetalinger endnu</Text>
          <Text style={styles.emptyText}>
            Når dine jobs bliver betalt, vises de her.
          </Text>
        </View>
      ) : (
        <View style={{ gap: 12 }}>
          {payouts.map((p) => (
            <View key={p.id} style={styles.payoutCard}>
              <View style={styles.payoutRow}>
                <View style={styles.payoutIconWrap}>
                  <Feather
                    name="arrow-down-circle"
                    size={18}
                    color={COLORS.accent}
                  />
                </View>
                <View style={{ flex: 1 }}>
                  <Text style={styles.payoutAmount}>{DKK(p.amount)}</Text>
                  <Text style={styles.payoutDate}>
                    {p.createdAt?.toDate?.().toLocaleDateString?.("da-DK") || ""}
                  </Text>
                </View>
                <Feather name="chevron-right" size={18} color={COLORS.muted} />
              </View>
            </View>
          ))}
        </View>
      )}
    </ScrollView>
  );
}