import React from "react";
import { View, Text, Pressable, Alert } from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";

import styles from "../../styles/boatowners/profileHubStyles";
import { logout } from "../../services/authService";
import { auth } from "../../firebase";

export default function ProfileHubScreen({ navigation }) {
  const user = auth.currentUser;
  const tabBarHeight = useBottomTabBarHeight(); // <- højde på bundbaren

  const go = (route) => navigation.navigate(route);

  const handleLogout = async () => {
    try {
      await logout();
      Alert.alert("Logget ud", "Du er nu logget ud.");
    } catch (err) {
      console.error("Fejl ved log ud:", err);
      Alert.alert("Fejl", "Kunne ikke logge ud, prøv igen.");
    }
  };

  // Højde til at holde plads i bunden, så indhold ikke gemmes bag knappen
  const bottomSpacer = tabBarHeight + 80; // 80 ≈ knaphøjde + luft

  return (
    <SafeAreaView style={styles.container}>
      {/* INDHOLD */}
      <View style={[styles.body, { paddingBottom: bottomSpacer }]}>
        {/* Hero */}
        <View style={styles.hero}>
          <View style={styles.avatar}>
            <Ionicons name="person" size={28} color="#0B5FA5" />
          </View>
          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>Min profil</Text>
            <Text style={styles.heroSub}>
              {user?.displayName || "Bådejer"}
              {user?.email ? ` • ${user.email}` : ""}
            </Text>
          </View>
        </View>

        {/* Menu-kort */}
        <View style={styles.card}>
          <MenuItem
            icon="person-circle-outline"
            label="Personlige detaljer"
            onPress={() => go("BoatProfile")}
          />
          <Separator />
          <MenuItem
            icon="boat-outline"
            label="Tilføj båd"
            onPress={() => go("BoatForm")}
          />
        </View>
      </View>

      {/* FOOTER-KNAP, ABSOLUT OVER TAB-BAREN */}
      <View style={[styles.footerAbs, { bottom: tabBarHeight + 8 }]}>
        <Pressable
          onPress={handleLogout}
          style={({ pressed }) => [
            styles.logoutBtn,
            pressed && { opacity: 0.95, transform: [{ scale: 0.995 }] },
          ]}
        >
          <Ionicons name="log-out-outline" size={20} color="#fff" />
          <Text style={styles.logoutText}>Log ud</Text>
        </Pressable>
      </View>
    </SafeAreaView>
  );
}

/* --- Underkomponenter --- */

function MenuItem({ icon, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "#e2e8f0" }}
      style={({ pressed }) => [styles.itemRow, pressed && styles.itemRowPressed]}
    >
      <View style={styles.itemIconWrap}>
        <Ionicons name={icon} size={18} color="#0B5FA5" />
      </View>
      <Text style={styles.itemLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color="#94a3b8" style={{ marginLeft: "auto" }} />
    </Pressable>
  );
}

function Separator() {
  return <View style={styles.separator} />;
}