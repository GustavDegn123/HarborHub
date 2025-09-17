import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
} from "react-native";
import { getAuth } from "firebase/auth";
import { db } from "../../firebase";
import {
  collection,
  doc,
  getDoc,
  getDocs,
  query,
  where,
  limit,
} from "firebase/firestore";
import { distanceBetween } from "geofire-common";
import styles from "../../styles/mechanics/jobsFeedStyles";

const CHUNK_SIZE = 10;

export default function JobsFeedScreen() {
  const auth = getAuth();
  const user = auth.currentUser;
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState([]);

  const load = useCallback(async () => {
    if (!user) return;
    setLoading(true);
    try {
      const provSnap = await getDoc(doc(db, "providers", user.uid));
      const prov = provSnap.exists() ? provSnap.data() : {};
      const services = Array.isArray(prov?.services) ? prov.services : [];

      if (services.length === 0) {
        setJobs([]);
        setLoading(false);
        return;
      }

      const chunks = [];
      for (let i = 0; i < services.length; i += CHUNK_SIZE) {
        chunks.push(services.slice(i, i + CHUNK_SIZE));
      }

      let all = [];
      for (const c of chunks) {
        const qRef = query(
          collection(db, "jobs"),
          where("status", "==", "open"),
          where("serviceId", "in", c),
          limit(50)
        );
        const snap = await getDocs(qRef);
        snap.forEach((d) => all.push({ id: d.id, ...d.data() }));
      }

      // sortér med distance først, ellers senest oprettet
      if (prov?.geo?.lat && prov?.geo?.lng) {
        const base = [prov.geo.lat, prov.geo.lng];
        all = all.map((j) => {
          let km = null;
          if (j?.geo?.lat && j?.geo?.lng)
            km = distanceBetween(base, [j.geo.lat, j.geo.lng]);
          return { ...j, distanceKm: km };
        });
        all.sort((a, b) => {
          if (a.distanceKm != null && b.distanceKm != null)
            return a.distanceKm - b.distanceKm;
          const ta = a?.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tb = b?.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tb - ta;
        });
      } else {
        all.sort((a, b) => {
          const ta = a?.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tb = b?.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tb - ta;
        });
      }

      setJobs(all);
    } catch (e) {
      console.warn("Jobs load error:", e?.message || e);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }, [user]);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const renderItem = ({ item }) => {
    const price = item?.price != null ? `${item.price} kr` : "—";
    const distance =
      item?.distanceKm != null ? `${item.distanceKm.toFixed(1)} km` : "";
    return (
      <TouchableOpacity style={styles.jobCard} onPress={() => {}}>
        <Text style={styles.jobTitle}>{item?.title || "Opgave"}</Text>
        <Text style={styles.jobDescription} numberOfLines={2}>
          {item?.description || "Ingen beskrivelse"}
        </Text>
        <View style={styles.jobMetaRow}>
          <Text style={styles.jobPrice}>{price}</Text>
          <Text style={styles.jobDistance}>{distance}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
        <Text style={styles.loaderText}>Henter opgaver…</Text>
      </View>
    );
  }

  const empty = !jobs || jobs.length === 0;

  return (
    <View style={styles.screen}>
      {empty ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Ingen opgaver endnu</Text>
          <Text style={styles.emptySubtitle}>
            Prøv at vælge flere ydelser eller tjek igen senere.
          </Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
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
