// /components/boatowners/RequestsScreen.js
import React, { useCallback, useState } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { auth } from "../../firebase";
import { getRequestsByOwner } from "../../services/requestsService";
import styles from "../../styles/boatowners/requestsStyles";

export default function RequestsScreen() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);
  const navigation = useNavigation();

  const load = useCallback(async () => {
    try {
      setLoading(true);
      const ownerId = auth.currentUser?.uid;
      if (!ownerId) {
        console.log("RequestsScreen: ingen ownerId (ikke logget ind?)");
        setRequests([]);
        return;
      }
      const data = await getRequestsByOwner(ownerId);

      // normaliser og filtrér så id ALTID er en non-empty string
      const usable = (data || [])
        .map((d) => ({ ...d, id: d.id })) // sikrer at feltet findes
        .filter((d) => typeof d.id === "string" && d.id.length > 0);

      if (usable.length !== (data || []).length) {
        console.log("RequestsScreen: filtrerede requests uden id fra", {
          total: (data || []).length,
          usable: usable.length,
        });
      }

      setRequests(usable);
    } catch (err) {
      console.error("Fejl ved hentning af requests:", err);
      setRequests([]);
    } finally {
      setLoading(false);
    }
  }, []);

  // load ved fokus (når man kommer tilbage fra andre skærme)
  useFocusEffect(
    useCallback(() => {
      load();
    }, [load])
  );

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (!requests.length) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Ingen service requests endnu.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mine service requests</Text>

      <FlatList
        data={requests}
        keyExtractor={(item) => item.id}
        renderItem={({ item }) => (
          <TouchableOpacity
            style={styles.card}
            onPress={() => {
              if (!item?.id) {
                console.log("RequestsScreen: mangler id på item", item);
                return;
              }
              console.log("Navigerer til RequestBids med jobId:", item.id);
              navigation.navigate("RequestBids", { jobId: item.id });
            }}
          >
            <Text style={styles.cardTitle}>{item.service_type || "Service request"}</Text>
            {!!item.description && <Text style={styles.description}>{item.description}</Text>}
            <Text style={styles.status}>Status: {item.status || "ukendt"}</Text>
            <Text style={styles.link}>Se bud</Text>
          </TouchableOpacity>
        )}
      />
    </View>
  );
}