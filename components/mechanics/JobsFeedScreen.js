// components/mechanics/JobsFeedScreen.js
import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import { getAuth } from "firebase/auth";
import { Timestamp } from "firebase/firestore";

import styles from "../../styles/mechanics/jobsFeedStyles";

// VIGTIGT: hent provider-profil fra requestsService,
// men lyt til åbne opgaver fra serviceRequestsService (adskilte filer)
import { getProvider } from "../../services/requestsService";
import { listenOpenServiceRequests } from "../../services/serviceRequestsService";
import { getBoat } from "../../services/boatsService";

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
    Math.sin(dLat / 2) ** 2 +
    Math.cos(lat1) * Math.cos(lat2) * Math.sin(dLng / 2) ** 2;
  return Math.round(R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x)));
}

// Robust konvertering af Firestore Timestamp til millis
function toMillis(ts) {
  if (!ts) return 0;
  if (ts instanceof Timestamp) return ts.toMillis();
  if (typeof ts?.toDate === "function") return ts.toDate().getTime();
  if (typeof ts === "number") return ts;
  return 0;
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
    let alive = true;
    if (!user?.uid) return;
    getProvider(user.uid)
      .then((p) => alive && setProvider(p))
      .catch((e) => alive && setError(e?.message || String(e)));
    return () => {
      alive = false;
    };
  }, [user?.uid]);

  // Live-lyt på åbne service_requests
  useEffect(() => {
    let alive = true;

    const unsub = listenOpenServiceRequests(
      async (reqs) => {
        try {
          // Hent bådnavne (og evt. flere boat-felter) for hver request
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
          if (alive) {
            setRequests(enriched);
            setLoading(false);
          }
        } catch (e) {
          if (alive) {
            setError(e?.message || String(e));
            setLoading(false);
          }
        }
      },
      (e) => {
        if (alive) {
          setError(e?.message || String(e));
          setLoading(false);
        }
      }
    );

    return () => {
      alive = false;
      unsub && unsub();
    };
  }, []);

  const providerGeo =
    provider?.geo?.lat != null && provider?.geo?.lng != null
      ? { lat: provider.geo.lat, lng: provider.geo.lng }
      : null;

  // Berig med afstand + sortér
  const displayRequests = useMemo(() => {
    const enriched = requests.map((r) => {
      const reqGeo =
        r?.geo?.lat != null && r?.geo?.lng != null
          ? { lat: r.geo.lat, lng: r.geo.lng }
          : null;
      const distanceKm =
        providerGeo && reqGeo ? haversineKm(providerGeo, reqGeo) : null;
      return { ...r, distanceKm };
    });

    enriched.sort((a, b) => {
      // 1) sorter efter afstand når muligt
      if (a.distanceKm != null && b.distanceKm != null)
        return a.distanceKm - b.distanceKm;
      if (a.distanceKm != null) return -1;
      if (b.distanceKm != null) return 1;
      // 2) ellers efter oprettelsestid (nyeste først)
      return toMillis(b.created_at) - toMillis(a.created_at);
    });

    return enriched;
  }, [requests, providerGeo]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    // Vi lytter live — et “dummy” refresh for UX
    setTimeout(() => setRefreshing(false), 400);
  }, []);

  const renderItem = ({ item }) => {
    // Deadline tekst
    let deadlineText = null;
    if (item.deadline === "flexible") {
      deadlineText = "Fleksibel";
    } else if (item.deadline instanceof Timestamp || item.deadline?.toDate) {
      const d =
        item.deadline instanceof Timestamp
          ? item.deadline.toDate()
          : item.deadline.toDate();
      deadlineText = d.toLocaleDateString("da-DK");
    }

    return (
      <View style={styles.card}>
        {/* Evt. thumbnail hvis ejer har uploadet billede */}
        {item.image ? (
          <Image
            source={{ uri: item.image }}
            style={{ width: "100%", height: 160, borderRadius: 12, marginBottom: 10 }}
            resizeMode="cover"
          />
        ) : null}

        {/* Titel */}
        <Text style={styles.cardTitle}>
          {item.service_type || "Serviceforespørgsel"}
        </Text>

        {/* Budget */}
        {typeof item.budget === "number" ? (
          <Text style={styles.cardBudget}>{DKK(item.budget)}</Text>
        ) : null}

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
          <Text style={styles.emptySubtitle}>
            Der er ingen åbne forespørgsler lige nu.
          </Text>
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