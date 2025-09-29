// components/boatowners/OwnerHomeScreen.js
import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import styles from "../../styles/boatowners/ownerHomeStyles";
import { logout } from "../../services/authService";

export default function OwnerHomeScreen({ navigation }) {
  const handleLogout = async () => {
    try {
      await logout();
      Alert.alert("Logget ud", "Du er nu logget ud.");
    } catch (err) {
      console.error("Fejl ved log ud:", err);
      Alert.alert("Fejl", "Kunne ikke logge ud, prøv igen.");
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Velkommen, Bådejer!</Text>
      <Text style={styles.subtitle}>
        Her kan du administrere dine både og oprette service requests.
      </Text>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("BoatForm")}>
        <Text style={styles.buttonText}>Tilføj en båd</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("Requests")}>
        <Text style={styles.buttonText}>Se mine service requests</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("NewRequest")}>
        <Text style={styles.buttonText}>Opret ny opgave</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("RequestsWithBids")}>
        <Text style={styles.buttonText}>Se bud på mine opgaver</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("OwnerAssigned")}>
        <Text style={styles.buttonText}>Se mine igangværende opgaver</Text>
      </TouchableOpacity>

      <TouchableOpacity style={styles.button} onPress={() => navigation.navigate("BoatProfile")}>
        <Text style={styles.buttonText}>Gå til personlige detaljer</Text>
      </TouchableOpacity>

      <TouchableOpacity style={[styles.button, styles.logoutButton]} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log ud</Text>
      </TouchableOpacity>
    </View>
  );
}