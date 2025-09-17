import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { getAuth } from "firebase/auth";
import { Timestamp } from "firebase/firestore";
import styles from "../../styles/mechanics/jobsFeedStyles";
import { getProvider, listenOpenServiceRequests } from "../../services/requestsService";
import { getBoat } from "../../services/boatsService"; // 👈 Hent båd-info

// --- Helper: valuta ---
function DKK(n) {
  return typeof n === "number"
    ? new Intl.NumberFormat("da-DK", {
        style: "currency",
        currency: "DKK",
        maximumFractionDigits: 0,
      }).format(n)
    : "—";
}

// --- Helper: afstand (km) ---
function haversineKm(a, b) {
  if (!a || !b) return null;
  const R = 6371;
  const dLat = ((b.lat - a.lat) * Math.PI) / 180;
  const dLng = ((b.lng - a.lng) * Math.PI) / 180;
  const lat1 = (a.lat * Math.PI) / 180;
  const lat2 = (b.lat * Math.PI) / 180;
  const x =
    Math.sin(dLat / 2) * Math.sin(dLat / 2) +
    Math.cos(lat1) * Math.cos(lat2) *
    Math.sin(dLng / 2) * Math.sin(dLng / 2);
  return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
}

export default function JobsFeedScreen({ navigation }) {
  const auth = getAuth();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState([]);
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState(null);

  // Hent provider-profil (for geo → afstand)
  useEffect(() => {
    if (!user?.uid) return;
    getProvider(user.uid)
      .then(setProvider)
      .catch((e) => setError(e?.message || String(e)));
  }, [user?.uid]);

  // Live-lyt på service_requests
  useEffect(() => {
    const unsub = listenOpenServiceRequests(
      async (reqs) => {
        // 👇 Hent bådnavne for hver request
        const enriched = await Promise.all(
  reqs.map(async (r) => {
    let boat = null;
    if (r.boat_id && r.owner_id) {
      try {
        boat = await getBoat(r.owner_id, r.boat_id);
      } catch (e) {
        console.log("Kunne ikke hente båd:", e);
      }
    }
    return { ...r, boat };
  })
);
        setRequests(enriched);
        setLoading(false);
      },
      (e) => {
        setError(e?.message || String(e));
        setLoading(false);
      }
    );
    return () => unsub();
  }, []);

  const providerGeo =
    provider?.geo?.lat && provider?.geo?.lng
      ? { lat: provider.geo.lat, lng: provider.geo.lng }
      : null;

  // Berig med afstand + sortér
  const displayRequests = useMemo(() => {
    const enriched = requests.map((r) => {
      const reqGeo =
        r?.geo?.lat && r?.geo?.lng ? { lat: r.geo.lat, lng: r.geo.lng } : null;
      const distanceKm =
        providerGeo && reqGeo ? haversineKm(providerGeo, reqGeo) : null;
      return { ...r, distanceKm };
    });

    enriched.sort((a, b) => {
      if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
      if (a.distanceKm != null) return -1;
      if (b.distanceKm != null) return 1;
      const ta = a.created_at instanceof Timestamp ? a.created_at.toMillis() : 0;
      const tb = b.created_at instanceof Timestamp ? b.created_at.toMillis() : 0;
      return tb - ta;
    });

    return enriched;
  }, [requests, providerGeo]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const renderItem = ({ item }) => {
    // Deadline tekst
    let deadlineText = null;
    if (item.deadline === "flexible") {
      deadlineText = "Fleksibel";
    } else if (item.deadline instanceof Timestamp) {
      deadlineText = item.deadline.toDate().toLocaleDateString("da-DK");
    }

    return (
      <View style={styles.card}>
        {/* Titel */}
        <Text style={styles.cardTitle}>{item.service_type || "Serviceforespørgsel"}</Text>

        {/* Budget */}
        {item.budget ? <Text style={styles.cardBudget}>{DKK(item.budget)}</Text> : null}

        {/* Beskrivelse */}
        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {/* Bådnavn */}
        {item.boat?.name ? (
          <Text style={styles.cardMeta}>Båd: {item.boat.name}</Text>
        ) : null}

        {/* Deadline */}
        {deadlineText && (
          <Text style={styles.cardMeta}>Deadline: {deadlineText}</Text>
        )}

        {/* Afstand */}
        {item.distanceKm != null ? (
          <Text style={styles.cardMeta}>{item.distanceKm} km væk</Text>
        ) : (
          <Text style={styles.cardMeta}>Ukendt afstand</Text>
        )}

        {/* Se detaljer */}
        <TouchableOpacity
          onPress={() => navigation.navigate("JobDetail", { jobId: item.id })}
          style={styles.btnPrimary}
        >
          <Text style={styles.btnPrimaryText}>Se detaljer</Text>
        </TouchableOpacity>
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
        <Text style={styles.loaderText}>Henter service requests…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>Kunne ikke hente forespørgsler</Text>
        <Text style={styles.emptySubtitle}>{error}</Text>
      </View>
    );
  }

  const empty = !displayRequests || displayRequests.length === 0;

  return (
    <View style={styles.screen}>
      {empty ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Ingen åbne forespørgsler</Text>
          <Text style={styles.emptySubtitle}>Der er ingen åbne forespørgsler lige nu.</Text>
        </View>
      ) : (
        <FlatList
          data={displayRequests}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={
            <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
          }
        />
      )}
    </View>
  );
}
