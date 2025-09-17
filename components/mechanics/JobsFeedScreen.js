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
import { getProvider, listenOpenJobs } from "../../services/jobsService";

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
  const [jobs, setJobs] = useState([]);
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState(null);

  // Hent provider-profil (for geo → afstand)
  useEffect(() => {
    if (!user?.uid) return;
    getProvider(user.uid)
      .then(setProvider)
      .catch((e) => setError(e?.message || String(e)));
  }, [user?.uid]);

  // Live-lyt jobs
  useEffect(() => {
    const unsub = listenOpenJobs(
      (jobs) => {
        setJobs(jobs);
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

  // Berig jobs med afstand + sortér
  const displayJobs = useMemo(() => {
    const enriched = jobs.map((j) => {
      const jobGeo =
        j?.geo?.lat && j?.geo?.lng ? { lat: j.geo.lat, lng: j.geo.lng } : null;
      const distanceKm =
        providerGeo && jobGeo ? haversineKm(providerGeo, jobGeo) : null;
      return { ...j, distanceKm };
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
  }, [jobs, providerGeo]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500); // visual refresh
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
        <Text style={styles.jobTitle}>{item.title || "Job uden titel"}</Text>

        {item.description ? (
          <Text style={styles.jobDescription} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {/* Tags */}
        <View style={styles.tagWrap}>
          {Array.isArray(item.requiredServices) && item.requiredServices.length > 0 ? (
            item.requiredServices.slice(0, 3).map((s) => (
              <View key={s} style={styles.tag}>
                <Text style={styles.tagText}>{s}</Text>
              </View>
            ))
          ) : (
            <View style={styles.tag}>
              <Text style={styles.tagText}>Åben opgave</Text>
            </View>
          )}
        </View>

        {/* Meta info */}
        <View style={styles.jobMetaRow}>
          <Text style={styles.jobDistance}>{when}</Text>
          <View style={{ flexDirection: "row", alignItems: "center" }}>
            {item.distanceKm != null ? (
              <Text style={styles.jobDistance}>{item.distanceKm} km</Text>
            ) : (
              <Text style={styles.jobDistance}>Ukendt afstand</Text>
            )}
            {typeof item.price === "number" ? (
              <Text style={styles.jobPrice}>
                {new Intl.NumberFormat("da-DK", {
                  style: "currency",
                  currency: "DKK",
                  maximumFractionDigits: 0,
                }).format(item.price)}
              </Text>
            ) : null}
          </View>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
        <Text style={styles.loaderText}>Henter åbne opgaver…</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.emptyWrap}>
        <Text style={styles.emptyTitle}>Kunne ikke hente opgaver</Text>
        <Text style={styles.emptySubtitle}>{error}</Text>
      </View>
    );
  }

  const empty = !displayJobs || displayJobs.length === 0;

  return (
    <View style={styles.screen}>
      {empty ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Ingen åbne opgaver</Text>
          <Text style={styles.emptySubtitle}>Der er ingen åbne opgaver lige nu.</Text>
        </View>
      ) : (
        <FlatList
          data={displayJobs}
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
