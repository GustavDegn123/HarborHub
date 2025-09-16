import React from "react";
import { View, Text, TouchableOpacity, StyleSheet } from "react-native";

export default function OwnerHomeScreen({ navigation }) {
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Velkommen, Bådejer!</Text>
      <Text style={styles.subtitle}>
        Her kan du administrere dine både og oprette service requests.
      </Text>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("MapPicker")}
      >
        <Text style={styles.buttonText}>Tilføj en båd</Text>
      </TouchableOpacity>

      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Requests")}
      >
        <Text style={styles.buttonText}>Se mine service requests</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", alignItems: "center", padding: 20 },
  title: { fontSize: 24, fontWeight: "700", marginBottom: 10 },
  subtitle: { fontSize: 16, color: "#555", textAlign: "center", marginBottom: 20 },
  button: { backgroundColor: "#1f5c7d", padding: 14, borderRadius: 10, marginTop: 10, width: "80%" },
  buttonText: { color: "white", textAlign: "center", fontWeight: "600" },
});
