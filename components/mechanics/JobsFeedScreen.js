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
import { getProvider } from "../../services/requestsService"; // henter provider-profil
import { listenOpenServiceRequests } from "../../services/serviceRequestsService"; // lytter åbne jobs
import { getBoat } from "../../services/boatsService";

/* ----------------- Helpers ----------------- */
function DKK(n) {
  return typeof n === "number"
    ? new Intl.NumberFormat("da-DK", {
        style: "currency",
        currency: "DKK",
        maximumFractionDigits: 0,
      }).format(n)
    : "—";
}

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
  return R * 2 * Math.atan2(Math.sqrt(x), Math.sqrt(1 - x));
}

function formatDistanceKm(km) {
  if (km == null) return "Ukendt afstand";
  if (km < 1) return "< 1 km";
  return `~${Math.round(km)} km`;
}

function toMillis(ts) {
  if (!ts) return 0;
  if (ts instanceof Timestamp) return ts.toMillis();
  if (typeof ts?.toDate === "function") return ts.toDate().getTime();
  if (typeof ts === "number") return ts;
  return 0;
}

/** Robust geo-udtræk: accepterer {geo|location|workLocation} + {lat,lng|latitude,longitude} */
function pickGeo(obj) {
  const g = obj?.geo || obj?.location || obj?.workLocation || null;
  if (!g) return null;
  const lat =
    Number.isFinite(g.lat) ? g.lat : Number.isFinite(g.latitude) ? g.latitude : null;
  const lng =
    Number.isFinite(g.lng) ? g.lng : Number.isFinite(g.longitude) ? g.longitude : null;
  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

/* ----------------- Screen ----------------- */
export default function JobsFeedScreen({ navigation }) {
  const auth = getAuth();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState([]);
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState(null);

  // Hent provider-profil (for geo/services/radius)
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

  // Lyt live på åbne service_requests
  useEffect(() => {
    let alive = true;
    const unsub = listenOpenServiceRequests(
      async (reqs) => {
        try {
          const enriched = await Promise.all(
            reqs.map(async (r) => {
              let boat = null;
              if (r.boat_id && r.owner_id) {
                try {
                  boat = await getBoat(r.owner_id, r.boat_id);
                } catch {}
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

  // Provider-geo + radius + services
  const providerGeo = pickGeo(provider);

  const maxKm = useMemo(() => {
    const cand = [
      provider?.willingToTravelKm,
      provider?.maxDistanceKm,
      provider?.maxTravelKm,
    ]
      .map((v) => (typeof v === "number" ? v : Number(v)))
      .find((v) => Number.isFinite(v));
    return cand ?? null; // null = intet afstandsfilter
  }, [provider]);

  const allowedServices = useMemo(() => {
    const arr = Array.isArray(provider?.services) ? provider.services : [];
    return arr.map((s) => String(s).toLowerCase());
  }, [provider?.services]);

  // Filtrér + berig + sortér + tæl skjulte pga. radius
  const { items: displayRequests, hiddenByRadius } = useMemo(() => {
    const notOwn = requests.filter((r) => r.owner_id !== user?.uid);

    const withDist = notOwn.map((r) => {
      const reqGeo = pickGeo(r);
      const distanceKm =
        providerGeo && reqGeo ? haversineKm(providerGeo, reqGeo) : null;
      return { ...r, distanceKm };
    });

    const skillFiltered = withDist.filter((r) => {
      if (!allowedServices || allowedServices.length === 0) return true;
      const st = String(r.service_type || "").toLowerCase();
      return allowedServices.includes(st);
    });

    let hidden = 0;
    const distanceFiltered = skillFiltered.filter((r) => {
      if (!providerGeo || !Number.isFinite(maxKm)) return true;
      if (r.distanceKm == null) return true; // ukendt → vis
      const keep = r.distanceKm <= maxKm;
      if (!keep) hidden += 1;
      return keep;
    });

    distanceFiltered.sort((a, b) => {
      if (a.distanceKm != null && b.distanceKm != null)
        return a.distanceKm - b.distanceKm;
      if (a.distanceKm != null) return -1;
      if (b.distanceKm != null) return 1;
      return toMillis(b.created_at) - toMillis(a.created_at);
    });

    return { items: distanceFiltered, hiddenByRadius: hidden };
  }, [requests, user?.uid, providerGeo, allowedServices, maxKm]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 400);
  }, []);

  const renderItem = ({ item }) => {
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
        {(item.imageUrl || item.image) && (
          <Image
            source={{ uri: item.imageUrl || item.image }}
            style={{ width: "100%", height: 160, borderRadius: 12, marginBottom: 10 }}
            resizeMode="cover"
          />
        )}

        <Text style={styles.cardTitle}>
          {item.service_type || "Serviceforespørgsel"}
        </Text>

        {typeof item.budget === "number" && (
          <Text style={styles.cardBudget}>{DKK(item.budget)}</Text>
        )}

        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {item.boat?.name ? (
          <Text style={styles.cardMeta}>Båd: {item.boat.name}</Text>
        ) : null}

        {deadlineText && (
          <Text style={styles.cardMeta}>Deadline: {deadlineText}</Text>
        )}

        <Text style={styles.cardMeta}>{formatDistanceKm(item.distanceKm)} væk</Text>

        <TouchableOpacity
          onPress={() => navigation.navigate("JobDetail", { jobId: item.id, viewAs: "provider" })}
          style={styles.btnPrimary}
        >
          <Text style={styles.btnPrimaryText}>Detaljer</Text>
        </TouchableOpacity>
      </View>
    );
  };

  const needsProfile =
    !provider ||
    !Array.isArray(provider.services) ||
    provider.services.length === 0 ||
    !providerGeo;

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
      {needsProfile && (
        <View style={styles.notice}>
          <Text style={styles.noticeText}>
            Få bedre matches: Vælg dine ydelser og baseadresse under “Bliv udbyder”.
          </Text>
        </View>
      )}

      {Number(hiddenByRadius) > 0 && (
        <View style={styles.radiusNotice}>
          <Text style={styles.radiusNoticeText}>
            {hiddenByRadius} opgave{hiddenByRadius > 1 ? "r" : ""} skjult pga. din radius.
          </Text>
        </View>
      )}

      {empty ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Ingen passende opgaver</Text>
          <Text style={styles.emptySubtitle}>
            Prøv at justere dine ydelser eller din radius.
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
