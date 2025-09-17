import React from "react";
import { View, Text, TouchableOpacity } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase";
import styles from "../../styles/mechanics/providerHomeStyles";

export default function ProviderHomeScreen({ navigation }) {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigation.replace("Login");
    } catch (e) {
      console.warn("Logout error:", e?.message || e);
    }
  };

  return (
    <View style={styles.screen}>
      {/* HERO / BRAND */}
      <View style={styles.hero}>
        <View style={styles.brandRow}>
          <View style={styles.badge}>
            <Text style={styles.badgeText}>HarborHub</Text>
          </View>
          <Text style={styles.tagline}>Services til både – samlet ét sted</Text>
        </View>

        {/* Minimal illustration (emoji + cirkel) */}
        <View style={styles.illustrationWrap}>
          <View style={styles.illustrationCircle}>
            <Text style={styles.boatEmoji}>🛥️</Text>
          </View>
        </View>
      </View>

      {/* CARD */}
      <View style={styles.card}>
        <Text style={styles.title}>
          Velkommen til HarborHub <Text style={{ opacity: 0.9 }}>🛥️</Text>
        </Text>
        <Text style={styles.subtitle}>
          Vælg hvad du vil gøre – vi klarer resten.
        </Text>

        <View style={{ height: 12 }} />

        {/* CTA-KNAPPER */}
        <TouchableOpacity
          style={styles.ctaPrimary}
          onPress={() => navigation.navigate("StartTakingJobs")}
        >
          <Text style={styles.ctaPrimaryText}>Bliv udbyder (onboarding)</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ctaPrimary}
          onPress={() => navigation.navigate("JobsFeed")}
        >
          <Text style={styles.ctaPrimaryText}>Se tilgængelige jobs</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.ctaSecondary}
          onPress={() => navigation.navigate("ProviderProfile")}
        >
          <Text style={styles.ctaSecondaryText}>Min profil</Text>
        </TouchableOpacity>

        <View style={{ height: 10 }} />

        <TouchableOpacity style={styles.ctaGhost} onPress={handleLogout}>
          <Text style={styles.ctaGhostText}>Log ud</Text>
        </TouchableOpacity>
      </View>

      {/* FOOTER INFO */}
      <View style={styles.footer}>
        <Text style={styles.footerText}>Bygget med ❤️ til sejlere</Text>
      </View>
    </View>
  );
}
