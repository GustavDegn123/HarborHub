// /components/RequestsScreen.js
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  ActivityIndicator,
} from "react-native";
import { auth } from "../firebase";
import { getRequestsByOwner } from "../services/requestsService";

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

      <TouchableOpacity
        style={styles.newBtn}
        onPress={() => navigation.navigate("NewRequest")}
      >
        <Text style={styles.newBtnText}>+ Opret ny opgave</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },
  card: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  status: { marginTop: 6, color: "#555" },
  newBtn: {
    backgroundColor: "#1f5c7d",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  newBtnText: { color: "white", fontWeight: "700" },
});
