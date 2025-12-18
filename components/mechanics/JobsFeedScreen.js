// /components/mechanics/JobsFeedScreen.js
import React, { useCallback, useEffect, useMemo, useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Image,
} from "react-native";
import MapView, { Marker, Callout } from "react-native-maps";
import { getAuth } from "firebase/auth";
import { Timestamp, doc, getDoc } from "firebase/firestore";

import styles from "../../styles/mechanics/jobsFeedStyles";
import { db } from "../../firebase";

import { getProvider } from "../../services/requestsService"; // henter provider-profil
import { listenOpenServiceRequests } from "../../services/serviceRequestsService"; // lytter åbne jobs
import { getBoat } from "../../services/boatsService";

/* ---------- Helpers ---------- */
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

/** Robust geo-udtræk: accepterer {base?.geo | geo | location | workLocation} med {lat,lng|latitude,longitude} */
function pickGeo(obj) {
  const g = obj?.base?.geo || obj?.geo || obj?.location || obj?.workLocation || null;
  if (!g) return null;

  const lat =
    Number.isFinite(g.lat) ? g.lat : Number.isFinite(g.latitude) ? g.latitude : null;
  const lng =
    Number.isFinite(g.lng) ? g.lng : Number.isFinite(g.longitude) ? g.longitude : null;

  return Number.isFinite(lat) && Number.isFinite(lng) ? { lat, lng } : null;
}

/** Flatten service catalog -> [{id,name}] */
function flattenLeaves(nodes, acc = []) {
  if (!Array.isArray(nodes)) return acc;
  for (const n of nodes) {
    if (!n) continue;
    if (Array.isArray(n.children) && n.children.length) {
      flattenLeaves(n.children, acc);
    } else if (n?.id && n?.name) {
      acc.push({ id: String(n.id), name: String(n.name) });
    }
  }
  return acc;
}

/* ---------- Screen ---------- */
export default function JobsFeedScreen({ navigation }) {
  const auth = getAuth();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [requests, setRequests] = useState([]);
  const [provider, setProvider] = useState(null);
  const [error, setError] = useState(null);
  const [viewMode, setViewMode] = useState("list"); // "list" | "map"

  // Service id -> name map (fra Firestore)
  const [serviceNameById, setServiceNameById] = useState({});

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
      "Serviceforespørgsel",
    [serviceNameById]
  );

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
            (reqs || []).map(async (r) => {
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
    const cand = [provider?.willingToTravelKm, provider?.maxDistanceKm, provider?.maxTravelKm]
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
    const notOwn = (requests || []).filter((r) => r.owner_id !== user?.uid);

    const withDist = notOwn.map((r) => {
      const reqGeo = pickGeo(r);
      const distanceKm = providerGeo && reqGeo ? haversineKm(providerGeo, reqGeo) : null;
      return { ...r, distanceKm, _geo: reqGeo };
    });

    // Match provider services mod request.services[] (nyt) eller request.service_type (gammelt)
    const skillFiltered = withDist.filter((r) => {
      if (!allowedServices || allowedServices.length === 0) return true;

      const reqIds = [];
      if (Array.isArray(r?.services)) {
        r.services.forEach((x) => typeof x === "string" && reqIds.push(x));
      }
      if (r?.service_type) reqIds.push(String(r.service_type));

      if (reqIds.length === 0) return true;
      return reqIds.some((id) => allowedServices.includes(String(id).toLowerCase()));
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
      if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
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

  /* ---------- Cards (liste) ---------- */
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

    const rating =
      Number.isFinite(item?.rating) ? item.rating : item?.boat?.rating ?? null;

    return (
      <View style={styles.card}>
        {(item.imageUrl || item.image) && (
          <Image
            source={{ uri: item.imageUrl || item.image }}
            style={styles.cardImage}
            resizeMode="cover"
          />
        )}

        <Text style={styles.cardTitle}>{serviceTitle(item)}</Text>

        <View style={styles.cardRow}>
          {typeof item.budget === "number" && (
            <Text style={styles.cardPrice}>{DKK(item.budget)}</Text>
          )}
          {rating != null && (
            <Text style={styles.cardRating}>★ {Number(rating).toFixed(1)}</Text>
          )}
        </View>

        {item.description ? (
          <Text style={styles.cardDesc} numberOfLines={2}>
            {item.description}
          </Text>
        ) : null}

        {item.boat?.name ? <Text style={styles.cardMeta}>Båd: {item.boat.name}</Text> : null}
        {deadlineText ? <Text style={styles.cardMeta}>Deadline: {deadlineText}</Text> : null}

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

  /* ---------- Kort ---------- */
  const initialRegion = useMemo(() => {
    const dk = {
      latitude: 56.2639,
      longitude: 9.5018,
      latitudeDelta: 5.5,
      longitudeDelta: 5.5,
    };
    if (!providerGeo) return dk;
    return {
      latitude: providerGeo.lat,
      longitude: providerGeo.lng,
      latitudeDelta: 0.6,
      longitudeDelta: 0.6,
    };
  }, [providerGeo]);

  /* ---------- Empty/Loading/Error ---------- */
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
      {/* Header / segmented toggle */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Find job</Text>
        <View style={styles.segment}>
          <TouchableOpacity
            onPress={() => setViewMode("list")}
            style={[styles.segmentBtn, viewMode === "list" && styles.segmentBtnActive]}
          >
            <Text style={[styles.segmentText, viewMode === "list" && styles.segmentTextActive]}>
              Liste
            </Text>
          </TouchableOpacity>
          <TouchableOpacity
            onPress={() => setViewMode("map")}
            style={[styles.segmentBtn, viewMode === "map" && styles.segmentBtnActive]}
          >
            <Text style={[styles.segmentText, viewMode === "map" && styles.segmentTextActive]}>
              Kort
            </Text>
          </TouchableOpacity>
        </View>
      </View>

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
          <Text style={styles.emptySubtitle}>Prøv at justere dine ydelser eller din radius.</Text>
        </View>
      ) : viewMode === "list" ? (
        <FlatList
          data={displayRequests}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={styles.listContent}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      ) : (
        <View style={styles.mapWrap}>
          <MapView initialRegion={initialRegion} style={styles.map}>
            {providerGeo && (
              <Marker
                coordinate={{ latitude: providerGeo.lat, longitude: providerGeo.lng }}
                title="Din base"
                description="Radius bruges til at filtrere opgaver"
                pinColor="#005079"
              />
            )}

            {displayRequests
              .filter((r) => r._geo)
              .map((r) => (
                <Marker
                  key={r.id}
                  coordinate={{ latitude: r._geo.lat, longitude: r._geo.lng }}
                  title={serviceTitle(r)}
                  description={`${DKK(r.budget)} • ${formatDistanceKm(r.distanceKm)}`}
                >
                  <Callout
                    onPress={() => navigation.navigate("JobDetail", { jobId: r.id, viewAs: "provider" })}
                  >
                    <View style={{ maxWidth: 240 }}>
                      <Text style={{ fontWeight: "700", marginBottom: 2 }}>{serviceTitle(r)}</Text>

                      {typeof r.budget === "number" && (
                        <Text style={{ marginBottom: 2 }}>{DKK(r.budget)}</Text>
                      )}

                      <Text style={{ color: "#6B7280", marginBottom: 6 }}>
                        {formatDistanceKm(r.distanceKm)} • {r.boat?.name ? `Båd: ${r.boat.name}` : ""}
                      </Text>

                      <TouchableOpacity
                        onPress={() =>
                          navigation.navigate("JobDetail", { jobId: r.id, viewAs: "provider" })
                        }
                        style={{
                          backgroundColor: "#184E6E",
                          paddingVertical: 8,
                          paddingHorizontal: 12,
                          borderRadius: 8,
                        }}
                      >
                        <Text style={{ color: "white", fontWeight: "600" }}>Se detaljer</Text>
                      </TouchableOpacity>
                    </View>
                  </Callout>
                </Marker>
              ))}
          </MapView>
        </View>
      )}
    </View>
  );
}
