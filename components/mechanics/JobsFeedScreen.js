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
import { getProvider, listenOpenServiceRequests } from "../../services/serviceRequestsService";

// --- Helper: beregn afstand (km) ---
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
      (reqs) => {
        setRequests(reqs);
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
      const ta = a.createdAt instanceof Timestamp ? a.createdAt.toMillis() : 0;
      const tb = b.createdAt instanceof Timestamp ? b.createdAt.toMillis() : 0;
      return tb - ta;
    });

    return enriched;
  }, [requests, providerGeo]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  const renderItem = ({ item }) => {
    const when =
      item.createdAt instanceof Timestamp
        ? new Date(item.createdAt.toMillis()).toLocaleDateString("da-DK", {
            day: "2-digit",
            month: "short",
          })
        : "";

    return (
      <TouchableOpacity
        style={styles.jobCard}
        onPress={() => navigation.navigate("JobDetail", { jobId: item.id })}
      >
        <Text style={styles.jobTitle}>{item.service_type || "Serviceforespørgsel"}</Text>

        {item.description ? (
          <Text style={styles.jobDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        <View style={styles.tagWrap}>
          <View style={styles.tag}>
            <Text style={styles.tagText}>{item.service_type}</Text>
          </View>
        </View>

        <View style={styles.jobMetaRow}>
          <Text style={styles.jobDistance}>{when}</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {item.distanceKm != null ? (
              <Text style={styles.jobDistance}>{item.distanceKm} km</Text>
            ) : (
              <Text style={styles.jobDistance}>Ukendt afstand</Text>
            )}
          </View>
        </View>
      </TouchableOpacity>
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
