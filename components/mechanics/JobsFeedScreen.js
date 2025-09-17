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
import styles from "../../styles/mechanics/jobsFeedStyles";
import { getJobsForProvider } from "../../services/jobsService";

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
      const allJobs = await getJobsForProvider(user.uid);
      setJobs(allJobs);
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
