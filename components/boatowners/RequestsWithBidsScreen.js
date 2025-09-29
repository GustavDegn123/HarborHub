// components/boatowners/RequestsWithBidsScreen.js
import React, { useEffect, useMemo, useState } from "react";
import { View, Text, ActivityIndicator, FlatList, TouchableOpacity, RefreshControl } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth } from "../../firebase";
import styles from "../../styles/boatowners/requestsStyles";

// Live-lyttere fra services
import {
  listenOwnerRequestsSafe, // kræver ikke composite index
} from "../../services/requestsService";

export default function RequestsWithBidsScreen() {
  const navigation = useNavigation();
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [rows, setRows] = useState([]); // rå data fra Firestore

  // Start live-lyt når der er en logget-ind bruger
  useEffect(() => {
    const ownerId = auth.currentUser?.uid;
    if (!ownerId) {
      setRows([]);
      setLoading(false);
      return;
    }

    setLoading(true);
    const unsub = listenOwnerRequestsSafe(
      ownerId,
      (list) => {
        setRows(list || []);
        setLoading(false);
      },
      () => setLoading(false)
    );

    return () => unsub?.();
  }, []);

  // Kun åbne opgaver, med flest bud øverst (hvis bidsCount findes)
  const items = useMemo(() => {
    const open = rows.filter((r) => (r?.status || "open") === "open");
    // sortér efter bidsCount (højeste først), fallback = 0
    open.sort((a, b) => (b?.bidsCount || 0) - (a?.bidsCount || 0));
    return open;
  }, [rows]);

  const onRefresh = async () => {
    // Da vi kører live-lyt, er “refresh” kun kosmetisk
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!items.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Ingen åbne opgaver med bud lige nu.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Bud på mine opgaver</Text>

      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
        }
        renderItem={({ item }) => {
          const bidsCount =
            typeof item.bidsCount === "number" ? item.bidsCount : undefined;

          return (
            <TouchableOpacity
              style={styles.card}
              onPress={() => navigation.navigate("RequestBids", { jobId: item.id })}
            >
              <Text style={styles.cardTitle}>
                {item.service_type || "Service request"}
              </Text>

              {!!item.description && (
                <Text style={styles.description}>{item.description}</Text>
              )}

              <Text style={styles.status}>Status: {item.status || "ukendt"}</Text>

              <Text style={styles.link}>
                {typeof bidsCount === "number"
                  ? bidsCount === 1
                    ? "1 bud – tryk for at se"
                    : `${bidsCount} bud – tryk for at se`
                  : "Se bud"}
              </Text>
            </TouchableOpacity>
          );
        }}
      />
    </View>
  );
}