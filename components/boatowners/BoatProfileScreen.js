// components/ProfileScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, ScrollView } from "react-native";
import styles from "../../styles/boatowners/boatProfileStyles";
import { getCurrentUser, getUserData } from "../../services/authService";

export default function ProfileScreen() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchUserData = async () => {
      try {
        const user = getCurrentUser();
        if (user) {
          let data = { email: user.email, uid: user.uid };

          const extra = await getUserData(user.uid);
          if (extra) {
            data = { ...data, ...extra };
          }

          setUserData(data);
        }
      } catch (err) {
        console.error("Fejl ved hentning af brugerdata:", err);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#1f5c7d" />
      </View>
    );
  }

  if (!userData) {
    return (
      <View style={styles.center}>
        <Text>Ingen brugerdata fundet.</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Personlige detaljer</Text>
      <View style={styles.card}>
        {Object.entries(userData).map(([key, value]) => (
          <View key={key} style={styles.row}>
            <Text style={styles.label}>{key}</Text>
            <Text style={styles.value}>{String(value)}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
