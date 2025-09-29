// components/boatowners/RequestBidsScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  acceptBid,
  listenBids,
  getServiceRequest,
} from "../../services/requestsService";
import { getProviderPublicSummary } from "../../services/providersService";
import { recommendBid } from "../../utils/recommendation"; // AI-scorer
import styles from "../../styles/boatowners/requestBidsStyles";

const DKK = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("da-DK", {
        style: "currency",
        currency: "DKK",
        maximumFractionDigits: 0,
      }).format(n)
    : "—";

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

export default function RequestBidsScreen() {
  const navigation = useNavigation();
  const { params } = useRoute();
  const jobId = params?.jobId;

  const [bids, setBids] = useState([]);
  const [job, setJob] = useState(null);
  const [loading, setLoading] = useState(true);
  const [accepting, setAccepting] = useState(false);
  const [requestAssigned, setRequestAssigned] = useState(false);

  // Allerede accepteret?
  const acceptedBidId = useMemo(
    () => bids.find((b) => b.accepted)?.id || null,
    [bids]
  );

  // AI-anbefaling
  const ai = useMemo(() => recommendBid(bids), [bids]);
  const recommendedId = ai.bestId;

  useEffect(() => {
    if (!jobId) {
      Alert.alert("Fejl", "Mangler jobId – åbn opgaven igen fra oversigten.");
      return;
    }

    setLoading(true);

    // Hent jobstatus én gang
    getServiceRequest(jobId)
      .then((req) => {
        if (req) setJob(req);
        if (req?.status && req.status !== "open") setRequestAssigned(true);
      })
      .catch(() => {});

    // Live-lyt bud + hydrer med provider-opsummering
    const unsub = listenBids(jobId, async (list) => {
      try {
        const enriched = await Promise.all(
          list.map(async (b) => {
            const s = await getProviderPublicSummary(b.provider_id).catch(() => null);
            const name =
              s?.companyName ||
              s?.displayName ||
              s?.email ||
              "Ukendt udbyder";
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
        console.log("Kunne ikke hydre bud:", e);
      } finally {
        setLoading(false);
      }
    });

    return () => typeof unsub === "function" && unsub();
  }, [jobId]);

  async function onAccept(bid) {
    if (!bid?.id) return;
    if (requestAssigned || acceptedBidId) {
      Alert.alert("Allerede tildelt", "Opgaven har allerede et accepteret bud.");
      return;
    }

    try {
      setAccepting(true);
      await acceptBid(jobId, bid.id);

      const providerId = bid.provider_id;
      const amount = Number(bid.price);
      if (!providerId || !Number.isFinite(amount)) {
        Alert.alert(
          "Bud accepteret",
          "Opgaven er tildelt, men beløb/udbyder mangler for betaling."
        );
        return;
      }

      setRequestAssigned(true);
      navigation.navigate("OwnerCheckout", { jobId, providerId, amount });
    } catch (e) {
      Alert.alert("Fejl", e?.message || "Kunne ikke acceptere bud.");
    } finally {
      setAccepting(false);
    }
  }

  function goToPayment(bid) {
    if (!bid?.provider_id || typeof bid?.price !== "number") {
      Alert.alert("Mangler data", "Kunne ikke åbne betaling for dette bud.");
      return;
    }
    navigation.navigate("OwnerCheckout", {
      jobId,
      providerId: bid.provider_id,
      amount: Number(bid.price),
    });
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
        <Text style={styles.loaderText}>Henter bud…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bud på opgaven</Text>

      {/* AI-anbefaling (hvis der er bud) */}
      {bids.length > 0 && recommendedId && (
        <View
          style={{
            borderWidth: 1,
            borderColor: "#BFDBFE",
            backgroundColor: "#EFF6FF",
            padding: 12,
            borderRadius: 12,
            marginBottom: 12,
          }}
        >
          <Text style={{ fontWeight: "800", marginBottom: 4 }}>AI anbefaler</Text>
          <Text style={{ color: "#1F2937" }}>{ai.explanation}</Text>
        </View>
      )}

      {bids.length === 0 && <Text style={styles.emptyText}>Ingen bud endnu</Text>}

      {bids.map((b) => {
        const isAccepted = !!b.accepted || (acceptedBidId && acceptedBidId === b.id);
        const isRecommended = recommendedId === b.id;
        return (
          <View key={b.id} style={styles.bidCard}>
            <View style={{ flexDirection: "row", alignItems: "center", gap: 8 }}>
              <Text style={styles.bidPrice}>
                {DKK(b.price)} {isAccepted ? " (allerede accepteret)" : ""}
              </Text>
              {isRecommended && (
                <Text
                  style={{
                    paddingHorizontal: 8,
                    paddingVertical: 2,
                    borderRadius: 999,
                    backgroundColor: "#DCFCE7",
                    color: "#065F46",
                    fontWeight: "700",
                    fontSize: 12,
                  }}
                >
                  Anbefalet
                </Text>
              )}
            </View>

            {b.message ? <Text style={styles.bidMessage}>{b.message}</Text> : null}

            {b.provider && (
              <View style={styles.providerBox}>
                <Text style={styles.providerName}>{b.provider.name}</Text>
                <View style={{ marginTop: 4 }}>
                  <Stars rating={b.provider.avgRating} />
                  {b.provider.reviewCount > 0 && (
                    <Text style={{ color: "#6B7280" }}>
                      {b.provider.reviewCount}{" "}
                      {b.provider.reviewCount === 1 ? "anmeldelse" : "anmeldelser"}
                    </Text>
                  )}
                </View>
              </View>
            )}

            {/* Accepter → Betaling */}
            <TouchableOpacity
              style={styles.btnPrimary}
              onPress={() => onAccept(b)}
              disabled={accepting || requestAssigned || isAccepted}
            >
              <Text style={styles.btnPrimaryText}>
                {accepting ? "Accepterer…" : isAccepted ? "Allerede accepteret" : "Accepter bud"}
              </Text>
            </TouchableOpacity>

            {/* Hvis accepteret: separat “Gå til betaling” */}
            {isAccepted && typeof b.price === "number" && (
              <TouchableOpacity
                style={[styles.btnPrimary, { marginTop: 8, backgroundColor: "#111827" }]}
                onPress={() => goToPayment(b)}
              >
                <Text style={styles.btnPrimaryText}>
                  Gå til betaling ({DKK(Number(b.price))})
                </Text>
              </TouchableOpacity>
            )}
          </View>
        );
      })}
    </ScrollView>
  );
}