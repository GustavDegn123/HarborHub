import React, { useState } from "react";
import { View, Text, Pressable, Alert, ActivityIndicator } from "react-native";
import {
  requestServerDeleteUserData,
  deleteAuthAccount,
} from "../../services/accountService";
import { logout } from "../../services/authService";
import styles from "../../styles/shared/deleteAccountSectionStyles";

export default function DeleteAccountSection({ onDeleted, style }) {
  const [loading, setLoading] = useState(false);

  const confirmAndDelete = () => {
    if (loading) return;
    Alert.alert(
      "Slet konto",
      "Dette kan ikke fortrydes. Alle dine data (profil, opgaver, bud og billeder) slettes permanent.",
      [
        { text: "Annuller", style: "cancel" },
        {
          text: "Slet permanent",
          style: "destructive",
          onPress: handleDelete,
        },
      ]
    );
  };

  const handleDelete = async () => {
    if (loading) return;
    setLoading(true);
    try {
      // 1) Bed backend om at slette alle data (Firestore + Storage)
      await requestServerDeleteUserData();

      // 2) Slet selve Auth-brugeren (kræver recent login)
      await deleteAuthAccount();

      Alert.alert("Konto slettet", "Din konto og alle data er slettet.");
      onDeleted && onDeleted();
    } catch (e) {
      if (e?.code === "auth/requires-recent-login") {
        Alert.alert(
          "Log ind igen",
          "Af sikkerhedshensyn skal du logge ind igen for at slette kontoen. Log ud, log ind, og prøv igen."
        );
        try {
          await logout();
        } catch {}
      } else {
        Alert.alert("Fejl", e?.message || "Noget gik galt. Prøv igen.");
      }
    } finally {
      setLoading(false);
    }
  };

  return (
    <View
      style={[styles.container, style]}
      accessibilityLabel="Faresone – slet konto"
    >
      <Text style={styles.title}>Faresone</Text>
      <Text style={styles.desc}>
        Sletning er permanent og kan ikke fortrydes. Alle dine data fjernes.
      </Text>

      <Pressable
        onPress={confirmAndDelete}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Slet konto permanent"
        testID="delete-account-button"
        style={[styles.deleteBtn, loading && styles.deleteBtnLoading]}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={styles.deleteBtnText}>Slet konto permanent</Text>
        )}
      </Pressable>
    </View>
  );
}
