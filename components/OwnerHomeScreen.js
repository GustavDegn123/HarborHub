import React from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";

// styles
import styles from "../styles/boatowners/ownerHomeStyles";

export default function OwnerHomeScreen({ navigation }) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      Alert.alert("Logget ud", "Du er nu logget ud.");
      // onAuthStateChanged i App.js håndterer redirect til Login
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

      {/* Tilføj båd */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("BoatForm")}
      >
        <Text style={styles.buttonText}>Tilføj en båd</Text>
      </TouchableOpacity>

      {/* Service requests */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("Requests")}
      >
        <Text style={styles.buttonText}>Se mine service requests</Text>
      </TouchableOpacity>

      {/* Ny opgave */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("NewRequest")}
      >
        <Text style={styles.buttonText}>Opret ny opgave</Text>
      </TouchableOpacity>

      {/* Personlige detaljer (profil) */}
      <TouchableOpacity
        style={styles.button}
        onPress={() => navigation.navigate("BoatProfile")}
      >
        <Text style={styles.buttonText}>Gå til personlige detaljer</Text>
      </TouchableOpacity>

      {/* Log ud */}
      <TouchableOpacity
        style={[styles.button, styles.logoutButton]}
        onPress={handleLogout}
      >
        <Text style={styles.buttonText}>Log ud</Text>
      </TouchableOpacity>
    </View>
  );
}
