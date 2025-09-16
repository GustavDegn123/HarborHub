import React, { useCallback, useEffect, useState } from "react";
import { View, Text, FlatList, TouchableOpacity, ActivityIndicator, RefreshControl } from "react-native";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";
import { collection, doc, getDoc, getDocs, query, where, limit } from "firebase/firestore";
import { distanceBetween } from "geofire-common";

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
      for (let i = 0; i < services.length; i += CHUNK_SIZE) chunks.push(services.slice(i, i + CHUNK_SIZE));

      let all = [];
      for (const c of chunks) {
        const qRef = query(
          collection(db, "jobs"),
          where("status", "==", "open"),
          where("serviceId", "in", c),
          limit(50)
        );
        const snap = await getDocs(qRef);
        snap.forEach(d => all.push({ id: d.id, ...d.data() }));
      }

      if (prov?.geo?.lat && prov?.geo?.lng) {
        const base = [prov.geo.lat, prov.geo.lng];
        all = all.map(j => {
          let km = null;
          if (j?.geo?.lat && j?.geo?.lng) km = distanceBetween(base, [j.geo.lat, j.geo.lng]);
          return { ...j, distanceKm: km };
        });
        all.sort((a,b) => {
          if (a.distanceKm != null && b.distanceKm != null) return a.distanceKm - b.distanceKm;
          const ta = a?.createdAt?.toMillis ? a.createdAt.toMillis() : 0;
          const tb = b?.createdAt?.toMillis ? b.createdAt.toMillis() : 0;
          return tb - ta;
        });
      } else {
        all.sort((a,b) => {
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

  useEffect(() => { load(); }, [load]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, [load]);

  const renderItem = ({ item }) => {
    const price = item?.price != null ? `${item.price} kr` : "—";
    const distance = item?.distanceKm != null ? `${item.distanceKm.toFixed(1)} km` : "";
    return (
      <TouchableOpacity
        onPress={() => {}}
        style={{ padding:14, marginHorizontal:16, marginVertical:8, borderRadius:12, borderWidth:1, borderColor:"#e5e7eb", backgroundColor:"#fff" }}
      >
        <Text style={{ fontSize:16, fontWeight:"700", marginBottom:4 }}>{item?.title || "Opgave"}</Text>
        <Text style={{ color:"#4b5563", marginBottom:6 }} numberOfLines={2}>
          {item?.description || "Ingen beskrivelse"}
        </Text>
        <View style={{ flexDirection:"row", justifyContent:"space-between" }}>
          <Text style={{ color:"#1f2937", fontWeight:"600" }}>{price}</Text>
          <Text style={{ color:"#6b7280" }}>{distance}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (loading) {
    return (
      <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop:8, color:"#6b7280" }}>Henter opgaver…</Text>
      </View>
    );
  }

  const empty = (!jobs || jobs.length === 0);

  return (
    <View style={{ flex:1, backgroundColor:"#f9fafb" }}>
      {empty ? (
        <View style={{ flex:1, alignItems:"center", justifyContent:"center", padding:24 }}>
          <Text style={{ fontSize:16, fontWeight:"700", marginBottom:6 }}>Ingen opgaver endnu</Text>
          <Text style={{ color:"#6b7280", textAlign:"center" }}>
            Prøv at vælge flere ydelser eller tjek igen senere.
          </Text>
        </View>
      ) : (
        <FlatList
          data={jobs}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={{ paddingVertical:8 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        />
      )}
    </View>
  );
}
