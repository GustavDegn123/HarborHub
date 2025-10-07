// components/boatowners/RequestBidsScreen.js
import React, { useEffect, useMemo, useRef, useState } from "react";
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
import { acceptBid, listenBids, getServiceRequest } from "../../services/requestsService";
import { getProviderPublicSummary } from "../../services/providersService";
import { recommendBid } from "../../utils/recommendation";
import styles, { sx } from "../../styles/boatowners/requestBidsStyles";
import { auth } from "../../firebase";

/* ---------- utils ---------- */
const DKK = (n) =>
  Number.isFinite(Number(n))
    ? new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(Number(n))
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

  // cache af provider-summaries
  const providerCache = useRef(new Map());

  // Allerede accepteret?
  const acceptedBidId = useMemo(() => bids.find((b) => b.accepted)?.id || null, [bids]);

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
      if ((a.id === recommendedId) && (b.id !== recommendedId)) return -1;
      if ((b.id === recommendedId) && (a.id !== recommendedId)) return 1;
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
        if (req?.status && String(req.status).toLowerCase() !== "open") {
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
          } catch (e) {
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
    if (String(job?.status || "open").toLowerCase() !== "open") {
      Alert.alert("Lukket opgave", "Denne opgave kan ikke længere tildeles.");
      return;
    }

    try {
      setAccepting(true);
      await acceptBid(jobId, bid.id);
      setRequestAssigned(true);
      // 👉 Efter accept: videre til “Igangværende”
      navigation.navigate("OwnerAssigned");
    } catch (e) {
      Alert.alert("Fejl", e?.message || "Kunne ikke acceptere bud.");
    } finally {
      setAccepting(false);
    }
  }

  const onRefresh = () => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 350); // visuel feedback – live-lyt kører allerede
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
  const statusText = String(job?.status || (isNowAssigned ? "assigned" : "open"));

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
            <Text style={sx.jobType}>{(job.service_type || "Service request").toUpperCase()}</Text>
            <View style={[sx.chip, sx[`chip_${statusText.toLowerCase()}`] || sx.chip_unknown]}>
              <Text style={sx.chipText}>{statusText}</Text>
            </View>
          </View>

          {!!job.description && <Text style={sx.jobDesc} numberOfLines={3}>{job.description}</Text>}

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
                      {b.provider.reviewCount} {Number(b.provider.reviewCount) === 1 ? "anmeldelse" : "anmeldelser"}
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
