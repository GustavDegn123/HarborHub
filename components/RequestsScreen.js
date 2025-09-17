import React, { useEffect, useState } from "react";
import { View, Text, FlatList, ActivityIndicator } from "react-native";
import { auth } from "../firebase";
import { getRequestsByOwner } from "../services/requestsService";

// styles
import styles from "../styles/boatowners/requestsStyles";

export default function RequestsScreen({ navigation }) {
  const [loading, setLoading] = useState(true);
  const [requests, setRequests] = useState([]);

  useEffect(() => {
    const load = async () => {
      try {
        const ownerId = auth.currentUser.uid;
        const data = await getRequestsByOwner(ownerId);
        setRequests(data);
      } catch (err) {
        console.error("Fejl ved hentning af requests:", err);
      } finally {
        setLoading(false);
      }
    };
    load();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
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
            <Text>{item.description}</Text>
            <Text style={styles.status}>Status: {item.status}</Text>
          </View>
        )}
      />
    </View>
  );
}
