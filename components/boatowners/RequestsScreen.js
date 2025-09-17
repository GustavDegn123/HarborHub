// /components/boatowners/RequestsScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { auth } from "../../firebase";
import { getRequestsByOwner } from "../../services/requestsService";

// styles
import styles from "../../styles/boatowners/requestsStyles";

export default function RequestsScreen() {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const loadRequests = async () => {
      try {
        const ownerId = auth.currentUser?.uid;
        if (!ownerId) return;

        const data = await getRequestsByOwner(ownerId);
        setRequests(data);
      } catch (err) {
        console.error("Fejl ved hentning af requests:", err);
      } finally {
        setLoading(false);
      }
    };

    loadRequests();
  }, []);

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
          <View style={styles.card}>
            <Text style={styles.cardTitle}>{item.service_type}</Text>
            <Text style={styles.description}>{item.description}</Text>
            <Text style={styles.status}>Status: {item.status}</Text>
          </View>
        )}
      />
    </View>
  );
}
