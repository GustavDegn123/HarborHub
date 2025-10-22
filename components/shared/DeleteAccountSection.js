// /components/shared/DeleteAccountSection.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  Pressable,
  Alert,
  ActivityIndicator,
} from "react-native";
import {
  requestServerDeleteUserData,
  deleteAuthAccount,
} from "../../services/accountService";
import { logout } from "../../services/authService";

export default function DeleteAccountSection({ onDeleted, style }) {
  const [confirm, setConfirm] = useState("");
  const [loading, setLoading] = useState(false);

  const handleDelete = async () => {
    if (loading) return;

    if (confirm.trim().toUpperCase() !== "SLET") {
      Alert.alert("Bekræftelse", "Skriv SLET i feltet for at bekræfte.");
      return;
    }

    Alert.alert(
      "Slet konto",
      "Dette kan ikke fortrydes. Alle dine data (profil, opgaver, bud og billeder) slettes permanent.",
      [
        { text: "Annuller", style: "cancel" },
        {
          text: "Slet permanent",
          style: "destructive",
          onPress: async () => {
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
          },
        },
      ]
    );
  };

  return (
    <View
      style={[
        {
          marginTop: 24,
          padding: 16,
          borderRadius: 12,
          borderWidth: 1,
          borderColor: "#FCA5A5",
          backgroundColor: "#FEF2F2",
        },
        style,
      ]}
      accessibilityLabel="Faresone – slet konto"
    >
      <Text style={{ fontWeight: "800", color: "#991B1B", marginBottom: 6 }}>
        Faresone
      </Text>
      <Text style={{ color: "#7F1D1D", marginBottom: 12 }}>
        Sletning er permanent og kan ikke fortrydes. Alle dine data fjernes.
      </Text>

      <Text style={{ marginBottom: 6 }}>
        Skriv <Text style={{ fontWeight: "800" }}>SLET</Text> for at bekræfte:
      </Text>
      <TextInput
        value={confirm}
        onChangeText={setConfirm}
        autoCapitalize="characters"
        placeholder="SLET"
        enterKeyHint="done"
        returnKeyType="done"
        accessibilityLabel="Bekræft sletning tekstfelt"
        testID="delete-confirm-input"
        style={{
          borderWidth: 1,
          borderColor: "#E5E7EB",
          borderRadius: 8,
          padding: 10,
          marginBottom: 12,
          backgroundColor: "#fff",
        }}
      />

      <Pressable
        onPress={handleDelete}
        disabled={loading}
        accessibilityRole="button"
        accessibilityLabel="Slet konto permanent"
        testID="delete-account-button"
        style={{
          backgroundColor: loading ? "#f87171" : "#dc2626",
          paddingVertical: 12,
          borderRadius: 10,
          alignItems: "center",
          opacity: loading ? 0.9 : 1,
        }}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <Text style={{ color: "#fff", fontWeight: "800" }}>
            Slet konto permanent
          </Text>
        )}
      </Pressable>
    </View>
  );
}
