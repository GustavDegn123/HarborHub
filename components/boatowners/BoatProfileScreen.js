import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, ScrollView } from "react-native";
import styles from "../../styles/boatowners/boatProfileStyles";
import { getCurrentUser, getUserData } from "../../services/authService";

export default function BoatProfileScreen() {
  const [userData, setUserData] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    (async () => {
      try {
        const user = getCurrentUser();
        if (!user) return setLoading(false);

        let data = { email: user.email, uid: user.uid, displayName: user.displayName, phoneNumber: user.phoneNumber };
        const extra = await getUserData(user.uid);
        if (extra) data = { ...data, ...extra };

        setUserData(data);
      } catch (err) {
        console.error("Fejl ved hentning af brugerdata:", err);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color="#0B5FA5" />
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

  // Udtræk kun de felter vi vil vise
  const email = userData.email || "-";
  const phone = userData.phone || userData.phoneNumber || "-";
  const name =
    userData.name ||
    userData.fullName ||
    userData.displayName ||
    "-";

  // By kan komme i flere formater: string, objekt med city, eller nested
  const city =
    typeof userData.location === "string"
      ? userData.location
      : userData.location?.city ||
        userData.location?.by ||
        userData.location?.town ||
        userData.location?.name ||
        "-";

  const rows = [
    { label: "Navn", value: name },
    { label: "Email", value: email },
    { label: "Telefon", value: phone },
    { label: "By", value: city },
  ].filter(r => r.value && r.value !== "-");

  return (
    <ScrollView style={styles.container}>
      <Text style={styles.header}>Personlige detaljer</Text>

      <View style={styles.card}>
        {rows.map((r, idx) => (
          <View key={r.label} style={[styles.row, idx === rows.length - 1 && styles.rowLast]}>
            <Text style={styles.label}>{r.label}</Text>
            <Text style={styles.value}>{r.value}</Text>
          </View>
        ))}
      </View>
    </ScrollView>
  );
}
