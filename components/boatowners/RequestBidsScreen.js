// components/boatowners/RequestBidsScreen.js
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";

import {
  acceptBid,
  listenBids,
  getServiceRequest,
} from "../../services/requestsService";
import { getProviderPublicSummary } from "../../services/providersService";
import { recommendBid } from "../../utils/recommendation";
import styles, { sx } from "../../styles/boatowners/requestBidsStyles";
import { auth, db } from "../../firebase";

/* ---------- utils ---------- */
const DKK = (n) =>
  Number.isFinite(Number(n))
    ? new Intl.NumberFormat("da-DK", {
        style: "currency",
        currency: "DKK",
        maximumFractionDigits: 0,
      }).format(Number(n))
    : "—";

const toMs = (v) =>
  (v && typeof v === "object" && typeof v.toMillis === "function"
    ? v.toMillis()
    : new Date(v || 0).getTime()) || 0;

const deadlineLabel = (req) => {
  const t = req?.deadlineType;
  if (!t || t === "Fleksibel") return "Fleksibel";
  try {
    const d = req?.deadline?.toDate ? req.deadline.toDate() : new Date(req.deadline);
    if (!(d instanceof Date) || isNaN(d)) return t;
    const dateStr = d.toLocaleDateString("da-DK");
    return t === "Før Dato" ? `Senest ${dateStr}` : dateStr;
  } catch {
    return t;
  }
};

function Stars({ rating }) {
  const r = Number(rating || 0);
  const full = Math.floor(r);
  const half = r - full >= 0.5;
  return (
    <Text style={{ color: "#F59E0B", fontWeight: "600" }}>
      {`${"★".repeat(full)}${half ? "½" : ""}` || "—"} {r ? `(${r.toFixed(1)})` : ""}
    </Text>
  );
}

/* ---------- status helpers (så chip kan vise dansk label) ---------- */
function normalizeStatus(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (["open"].includes(s)) return "open";
  if (["assigned"].includes(s)) return "assigned";
  if (["in_progress", "in-progress"].includes(s)) return "in_progress";
  if (["completed"].includes(s)) return "completed";
  if (["paid"].includes(s)) return "paid";
  if (["reviewed"].includes(s)) return "reviewed";

  if (["åben", "aben", "aaben"].includes(s)) return "open";
  if (["tildelt"].includes(s)) return "assigned";
  if (["i_gang", "i-gang", "igang"].includes(s)) return "in_progress";
  if (["afsluttet"].includes(s)) return "completed";
  if (["betalt"].includes(s)) return "paid";
  if (["anmeldt"].includes(s)) return "reviewed";
  return "open";
}

function statusDisplay(raw) {
  const slug = normalizeStatus(raw);
  switch (slug) {
    case "open":
      return { label: "Åben", styleKey: "open" };
    case "assigned":
      return { label: "Tildelt", styleKey: "assigned" };
    case "in_progress":
      return { label: "I gang", styleKey: "in_progress" };
    case "completed":
      return { label: "Afsluttet", styleKey: "completed" };
    case "paid":
      return { label: "Betalt", styleKey: "paid" };
    case "reviewed":
      return { label: "Anmeldt", styleKey: "reviewed" };
    default:
      return { label: "Ukendt", styleKey: "unknown" };
  }
}

/* ---------- service catalog helpers ---------- */
function flattenLeaves(nodes, acc = []) {
  if (!Array.isArray(nodes)) return acc;
  for (const n of nodes) {
    if (Array.isArray(n?.children) && n.children.length) {
      flattenLeaves(n.children, acc);
    } else if (n?.id && n?.name) {
      acc.push({ id: String(n.id), name: String(n.name) });
    }
  }
  return acc;
}

/* ---------- component ---------- */
export default function RequestBidsScreen() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const jobId = params?.jobId;

  const [bids, setBids] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [refreshing, setRefreshing] = useState(false);
  const [requestAssigned, setRequestAssigned] = useState(false);

  const [serviceNameById, setServiceNameById] = useState({});

  // cache af provider-summaries
  const providerCache = useRef(new Map());

  /* Hent service-katalog (id -> name) fra Firestore */
  useEffect(() => {
    let alive = true;

    (async () => {
      try {
        const snap = await getDoc(doc(db, "meta", "service_catalog"));
        const catalog = snap.exists() ? snap.data()?.catalog : null;

        const leaves = flattenLeaves(Array.isArray(catalog) ? catalog : []);
        const map = {};
        for (const l of leaves) map[l.id] = l.name;

        if (alive) setServiceNameById(map);
      } catch {
        if (alive) setServiceNameById({});
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const serviceTitle = useCallback(
    (item) =>
      item?.service_name ||
      serviceNameById[item?.service_type] ||
      item?.service_type ||
      "Serviceopgave",
    [serviceNameById]
  );

  // Allerede accepteret?
  const acceptedBidId = useMemo(
    () => bids.find((b) => b.accepted)?.id || null,
    [bids]
  );

  // AI-anbefaling (kun relevant før accept)
  const ai = useMemo(() => recommendBid(bids || []), [bids]);
  const recommendedId = ai?.bestId;

  // Sortér bud (bruges kun før accept)
  const sortedBids = useMemo(() => {
    const arr = [...bids];
    arr.sort((a, b) => {
      // accepted first
      if (a.accepted && !b.accepted) return -1;
      if (!a.accepted && b.accepted) return 1;
      // recommended next
      if (a.id === recommendedId && b.id !== recommendedId) return -1;
      if (b.id === recommendedId && a.id !== recommendedId) return 1;
      // price asc
      const ap = Number.isFinite(Number(a.price)) ? Number(a.price) : Number.POSITIVE_INFINITY;
      const bp = Number.isFinite(Number(b.price)) ? Number(b.price) : Number.POSITIVE_INFINITY;
      if (ap !== bp) return ap - bp;
      // newest first
      return toMs(b.created_at) - toMs(a.created_at);
    });
    return arr;
  }, [bids, recommendedId]);

  // Efter accept viser vi KUN det accepterede bud
  const visibleBids = useMemo(() => {
    if (requestAssigned || acceptedBidId) {
      return sortedBids.filter((b) => b.accepted || b.id === acceptedBidId);
    }
    return sortedBids;
  }, [sortedBids, requestAssigned, acceptedBidId]);

  useEffect(() => {
    if (!jobId) {
      Alert.alert("Fejl", "Mangler jobId – åbn opgaven igen fra oversigten.");
      return;
    }

    setLoading(true);
    let unsub;

    (async () => {
      try {
        // Hent job én gang (til header/status)
        const req = await getServiceRequest(jobId).catch(() => null);
        if (req) setJob(req);

        // Hvis job ikke er open, så er det “tildelt/igang/…” i praksis
        if (req?.status && normalizeStatus(req.status) !== "open") {
          setRequestAssigned(true);
        }

        // Live-lyt bud + hydrér med provider-opsummering (med cache)
        unsub = listenBids(jobId, async (list) => {
          try {
            const enriched = await Promise.all(
              (list || []).map(async (b) => {
                const pid = b.provider_id;
                let s = pid ? providerCache.current.get(pid) : null;
                if (!s && pid) {
                  s = await getProviderPublicSummary(pid).catch(() => null);
                  if (s) providerCache.current.set(pid, s);
                }
                const name = s?.companyName || s?.displayName || s?.email || "Ukendt udbyder";
                return {
                  ...b,
                  provider: {
                    name,
                    avgRating: s?.avgRating ?? 0,
                    reviewCount: s?.reviewCount ?? 0,
                  },
                };
              })
            );
            setBids(enriched);
            setRequestAssigned(enriched.some((b) => !!b.accepted));
          } catch {
            setBids(list || []);
          } finally {
            setLoading(false);
          }
        });
      } catch {
        setLoading(false);
      }
    })();

    return () => unsub?.();
  }, [jobId]);

  const confirmAndAccept = (bid) => {
    const price = DKK(bid?.price);
    Alert.alert(
      "Accepter bud?",
      `Du accepterer buddet på ${price}. Opgaven flyttes derefter til “Igangværende”.`,
      [
        { text: "Fortryd", style: "cancel" },
        { text: "Accepter", style: "default", onPress: () => onAccept(bid) },
      ]
    );
  };

  async function onAccept(bid) {
    if (!bid?.id || accepting) return;

    if (!auth.currentUser?.uid) {
      Alert.alert("Ikke logget ind", "Log ind for at acceptere bud.");
      return;
    }
    if (requestAssigned || acceptedBidId) {
      Alert.alert("Allerede tildelt", "Opgaven har allerede et accepteret bud.");
      return;
    }
    if (normalizeStatus(job?.status || "open") !== "open") {
      Alert.alert("Lukket opgave", "Denne opgave kan ikke længere tildeles.");
      return;
    }

    try {
      setAccepting(true);
      await acceptBid(jobId, bid.id);
      setRequestAssigned(true);
      navigation.navigate("OwnerAssigned");
    } catch (e) {
      Alert.alert("Fejl", e?.message || "Kunne ikke acceptere bud.");
    } finally {
      setAccepting(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 350);
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
        <Text style={styles.loaderText}>Henter bud…</Text>
      </View>
    );
  }

  const isNowAssigned = requestAssigned || !!acceptedBidId;
  const st = statusDisplay(job?.status || (isNowAssigned ? "assigned" : "open"));

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={styles.container}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Bud på opgaven</Text>

      {/* Job header */}
      {job ? (
        <View style={sx.jobCard}>
          <View style={sx.jobHeaderRow}>
            {/* ✅ Viser rigtige navn fra kataloget */}
            <Text style={sx.jobType}>{serviceTitle(job)}</Text>

            {/* ✅ Dansk label + samme chip-styleKey */}
            <View style={[sx.chip, sx[`chip_${st.styleKey}`] || sx.chip_unknown]}>
              <Text style={sx.chipText}>{st.label}</Text>
            </View>
          </View>

          {!!job.description && (
            <Text style={sx.jobDesc} numberOfLines={3}>
              {job.description}
            </Text>
          )}

          <View style={sx.metaRow}>
            <Text style={sx.metaLabel}>Budget</Text>
            <Text style={sx.metaValue}>{DKK(job.budget)}</Text>
          </View>

          <View style={sx.metaRow}>
            <Text style={sx.metaLabel}>Deadline</Text>
            <Text style={sx.metaValue}>{deadlineLabel(job)}</Text>
          </View>

          {!!job?.location?.label && (
            <View style={sx.metaRow}>
              <Text style={sx.metaLabel}>Placering</Text>
              <Text style={[sx.metaValue, { maxWidth: "65%" }]} numberOfLines={1}>
                {job.location.label}
              </Text>
            </View>
          )}
        </View>
      ) : null}

      {/* AI-anbefaling kun før accept */}
      {!isNowAssigned && visibleBids.length > 0 && recommendedId ? (
        <View style={sx.aiBox}>
          <Text style={sx.aiTitle}>AI anbefaler</Text>
          <Text style={sx.aiText}>{ai.explanation}</Text>
        </View>
      ) : null}

      {visibleBids.length === 0 && <Text style={styles.emptyText}>Ingen bud endnu</Text>}

      {visibleBids.map((b) => {
        const isAccepted = !!b.accepted || (acceptedBidId && acceptedBidId === b.id);
        const isRecommended = recommendedId === b.id;

        return (
          <View key={b.id} style={styles.bidCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 4 }}>
              <Text style={styles.bidPrice}>{DKK(Number(b.price))}</Text>
              {!isNowAssigned && isRecommended && <Text style={sx.badgeRecommended}>Anbefalet</Text>}
              {isAccepted && <Text style={sx.badgeAccepted}>Accepteret</Text>}
            </View>

            {b.message ? <Text style={styles.bidMessage}>{b.message}</Text> : null}

            {b.provider && (
              <View style={styles.providerBox}>
                <Text style={styles.providerName}>{b.provider.name}</Text>
                <View style={{ marginTop: 4 }}>
                  <Stars rating={b.provider.avgRating} />
                  {Number(b.provider.reviewCount) > 0 && (
                    <Text style={{ color: "#6B7280" }}>
                      {b.provider.reviewCount}{" "}
                      {Number(b.provider.reviewCount) === 1 ? "anmeldelse" : "anmeldelser"}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Knapper */}
            {!isNowAssigned ? (
              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => confirmAndAccept(b)}
                disabled={accepting}
              >
                <Text style={styles.btnPrimaryText}>
                  {accepting ? "Accepterer…" : "Accepter bud"}
                </Text>
              </TouchableOpacity>
            ) : isAccepted ? (
              <TouchableOpacity
                style={[styles.btnPrimary, { backgroundColor: "#111827", marginTop: 8 }]}
                onPress={() => navigation.navigate("OwnerAssigned")}
              >
                <Text style={styles.btnPrimaryText}>Gå til opgaven</Text>
              </TouchableOpacity>
            ) : null}
          </View>
        );
      })}
    </ScrollView>
  );
}
