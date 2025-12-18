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
  setDoc,
  serverTimestamp,
  getDoc,
} from "firebase/firestore";
import {
  getProviderProfile,
  getProviderPayouts,
  listenProviderReviews,
} from "../../services/providersService";
import { useCriiptoVerify } from "@criipto/verify-expo";
import styles, { COLORS } from "../../styles/mechanics/providerProfileStyles";
import DeleteAccountSection from "../shared/DeleteAccountSection";
import { logout } from "../../services/authService";

WebBrowser.maybeCompleteAuthSession();

/* Links */
const SUPPORT_URL = "https://www.harborhub.me/";
const PRIVACY_URL = "https://www.harborhub.me/privacy.html";
const TERMS_URL = "https://www.harborhub.me/terms.html";
const SUPPORT_EMAIL = "support@harborhub.me";

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
  const starStyle = size >= 16 ? styles.starText16 : styles.starText14;
  return (
    <Text style={starStyle}>
      {"★".repeat(full)}
      {half ? "½" : ""}
      {full === 0 && !half ? "—" : ""} {r ? `(${r.toFixed(1)})` : ""}
    </Text>
  );
}

// Titelprioritet som i kalenderen (service_name først)
const pickTitle = (obj = {}) =>
  obj.service_name ||
  obj.serviceName ||
  obj.service_type ||
  obj.title ||
  obj.name ||
  null;

function statusLabel(raw) {
  const s = String(raw || "").toLowerCase();
  if (s === "assigned") return "Tildelt";
  if (s === "in_progress" || s === "in-progress") return "I gang";
  if (s === "completed" || s === "done" || s === "closed") return "Afsluttet";
  if (s === "paid") return "Betalt";
  if (s === "reviewed") return "Afsluttet & anmeldt";
  return "Ukendt";
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

  // cache med ekstra metadata fra service_requests (titel m.m.)
  const [jobMeta, setJobMeta] = useState({}); // { [jobId]: { title, description } }

  // Criipto (MitID) hook
  const { login: mitIdLogin, claims, error: mitIdError } = useCriiptoVerify();

  /* ---------- 1) Engangs: profil + payouts ---------- */
  useEffect(() => {
    let cancelled = false;

    (async () => {
      if (!uid) return;

      try {
        const [profile, payoutsData] = await Promise.all([
          getProviderProfile(uid).catch(() => ({})),
          getProviderPayouts(uid).catch(() => []),
        ]);

        if (cancelled) return;

        setProv(profile || {});
        const normalized = (payoutsData || [])
          .map((p) => {
            const amt = Number(p?.amount);
            const amountDKK = Number.isFinite(amt) ? amt / 100 : 0; // Stripe minor -> DKK
            return { ...p, amountDKK };
          })
          .sort(
            (a, b) =>
              (b?.createdAt?.toMillis?.() || 0) -
              (a?.createdAt?.toMillis?.() || 0)
          );

        setPayouts(normalized);
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

  /* ---------- 2) Live: assigned_jobs ---------- */
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

  /* ---------- 2b) Hent manglende titler fra service_requests ---------- */
  useEffect(() => {
    let isCancelled = false;

    (async () => {
      const missing = assigned
        .map((j) => ({ j, id: j.job_id || j.id }))
        .filter(({ j, id }) => {
          if (!id) return false;
          const hasLocal = !!pickTitle(j);
          const hasCached = !!pickTitle(jobMeta[id] || {});
          return !hasLocal && !hasCached;
        });

      if (missing.length === 0) return;

      try {
        const pairs = await Promise.all(
          missing.map(async ({ id }) => {
            const snap = await getDoc(doc(db, "service_requests", id));
            const data = snap.exists() ? snap.data() : {};
            const title = pickTitle(data);
            const description = data.description || null;
            return [id, { title, description }];
          })
        );

        if (isCancelled) return;

        setJobMeta((prev) => {
          const next = { ...prev };
          for (const [id, meta] of pairs) next[id] = meta;
          return next;
        });
      } catch (e) {
        console.log("Kunne ikke hente jobtitler:", e?.message || e);
      }
    })();

    return () => {
      isCancelled = true;
    };
  }, [assigned, jobMeta]);

  /* ---------- 3) Live: reviews ---------- */
  useEffect(() => {
    if (!uid) return;

    const unsub = listenProviderReviews(
      uid,
      (arr) => setReviews(arr || []),
      () => {}
    );

    return () => unsub?.();
  }, [uid]);

  /* ---------- KPI’er ---------- */
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

  const payoutsTotal = useMemo(() => {
    try {
      return (payouts || []).reduce((acc, p) => acc + (p?.amountDKK || 0), 0);
    } catch {
      return 0;
    }
  }, [payouts]);

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

  /* ---------- MitID verify ---------- */
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

  /* ---------- Logout ---------- */
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

  /* ---------- Loading / error ---------- */
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
    prov?.displayName ||
    prov?.companyName ||
    auth.currentUser?.email ||
    "Min profil";

  const greet = auth.currentUser?.email || displayName;

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

  const getDisplayTitle = (j) => {
    const id = j.job_id || j.id;
    return pickTitle(j) || (id && pickTitle(jobMeta[id] || {})) || `Job #${id || "—"}`;
  };

  /* Hjælp/links handlers */
  const openInBrowser = (url) => WebBrowser.openBrowserAsync(url);
  const emailSupport = () => Linking.openURL(`mailto:${SUPPORT_EMAIL}`);

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.content}>
      {/* Lille header */}
      <View style={styles.headerCard}>
        <Text style={styles.welcome}>Hej, {String(greet)} 👋</Text>
      </View>

      {/* KPI’er højt oppe */}
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

      {/* Stor kalender-knap */}
      <TouchableOpacity
        style={styles.bigActionBtn}
        onPress={() => navigation.navigate("ProviderCalendar")}
      >
        <View style={styles.bigActionLeft}>
          <Feather name="calendar" size={18} color={COLORS.accent} />
          <Text style={styles.bigActionText}>Kalender</Text>
        </View>
        <Feather name="chevron-right" size={18} color={COLORS.muted} />
      </TouchableOpacity>

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

      {/* Færdige jobs */}
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
            ItemSeparatorComponent={() => <View style={styles.listSeparator} />}
            renderItem={({ item }) => {
              const id = item.job_id || item.id;
              const title = getDisplayTitle(item);
              const s = item.status || "completed";

              return (
                <TouchableOpacity
                  style={styles.jobCard}
                  onPress={() => navigation.navigate("JobDetail", { jobId: id })}
                >
                  <View style={styles.rowBetween}>
                    <Text style={styles.jobTitle}>{title}</Text>
                    {item.price != null ? (
                      <Text style={styles.jobPrice}>
                        {DKK(Number(item.price))}
                      </Text>
                    ) : null}
                  </View>
                  <Text style={styles.cardMeta}>Status: {statusLabel(s)}</Text>
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
          <Text style={styles.emptyText}>
            Når dine jobs bliver betalt, vises de her.
          </Text>
        </View>
      ) : (
        <View style={styles.payoutList}>
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
                <View style={styles.flex1}>
                  <Text style={styles.payoutAmount}>{DKK(p.amountDKK)}</Text>
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

      {/* MitID rykket længere ned */}
      <View style={styles.identityCard}>
        <View style={styles.identityRow}>
          <Feather name="shield" size={20} color={COLORS.accent} />
          <Text style={styles.identityTitle}>Identitet</Text>
          <View style={styles.flex1} />
          <MitIDBadge />
        </View>

        <Text style={styles.identityDesc}>
          Bekræft din identitet med MitID og vis bådejerne, at du er troværdig.
        </Text>

        <TouchableOpacity
          style={[styles.identityBtn, prov?.mitidVerified && styles.disabled]}
          disabled={!!prov?.mitidVerified}
          onPress={handleMitIDVerify}
        >
          <Text style={styles.identityBtnText}>
            {prov?.mitidVerified ? "Allerede verificeret" : "Verificér med MitID"}
          </Text>
        </TouchableOpacity>

        {mitIdError ? (
          <Text style={styles.identityError}>
            MitID fejl: {String(mitIdError)}
          </Text>
        ) : null}
      </View>

      {/* Hjælp & juridisk */}
      <View style={[styles.card, styles.cardSpacer]}>
        <Text style={styles.cardTitle}>Hjælp & juridisk</Text>
        <View style={styles.helpRow}>
          <TouchableOpacity
            style={styles.helpBtn}
            onPress={() => openInBrowser(SUPPORT_URL)}
          >
            <Text style={styles.helpBtnText}>Support</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.helpBtn}
            onPress={() => openInBrowser(PRIVACY_URL)}
          >
            <Text style={styles.helpBtnText}>Privatliv</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={styles.helpBtn}
            onPress={() => openInBrowser(TERMS_URL)}
          >
            <Text style={styles.helpBtnText}>Vilkår</Text>
          </TouchableOpacity>
        </View>

        <TouchableOpacity onPress={emailSupport} style={styles.helpEmailLink}>
          <Text style={styles.helpEmailText}>Skriv til {SUPPORT_EMAIL}</Text>
        </TouchableOpacity>
      </View>

      {/* Stor log ud (lige over faresonen) */}
      <View style={styles.logoutCard}>
        <TouchableOpacity onPress={handleLogout} style={styles.logoutGhost}>
          <Feather name="log-out" size={18} color={COLORS.danger} />
          <Text style={styles.logoutGhostText}>Log ud</Text>
        </TouchableOpacity>
      </View>

      {/* Faresone nederst */}
      <DeleteAccountSection style={styles.deleteSectionSpacing} />
    </ScrollView>
  );
}
