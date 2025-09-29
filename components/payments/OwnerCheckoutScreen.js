// components/payments/OwnerCheckoutScreen.js
import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { initPaymentSheet, presentPaymentSheet } from "@stripe/stripe-react-native";
import { createPaymentIntentForJob } from "../../services/paymentsService";
import { markRequestPaid } from "../../services/requestsService";

const DKK = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("da-DK", { style: "currency", currency: "DKK", maximumFractionDigits: 0 }).format(n)
    : "—";

export default function OwnerCheckoutScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { jobId, providerId, amount } = route.params || {};

  console.log("[OwnerCheckout] route.params:", route.params);
  console.log("[OwnerCheckout] jobId:", jobId, "providerId:", providerId, "amount(DKK):", amount);

  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState(null);
  const [paying, setPaying] = useState(false);
  const [lastError, setLastError] = useState("");

  const setupPaymentSheet = useCallback(async () => {
    setLoading(true);
    setLastError("");
    try {
      if (!jobId || !providerId || amount == null) {
        throw new Error("Mangler jobId, providerId eller beløb.");
      }

      const amountInMinor = Math.round(Number(amount) * 100);

      const payload = { amount: amountInMinor, currency: "dkk", jobId, providerId };
      console.log("[OwnerCheckout] Pay payload ->", payload);

      const res = await createPaymentIntentForJob(payload);
      console.log("[OwnerCheckout] createPaymentIntentForJob result ->", res);

      if (!res?.clientSecret) throw new Error("Manglende clientSecret fra serveren.");

      setClientSecret(res.clientSecret);

      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: res.clientSecret,
        merchantDisplayName: "HarborHub (TEST)",
        allowsDelayedPaymentMethods: false,
      });
      if (error) throw new Error(error.message || "Kunne ikke initialisere betaling.");
    } catch (e) {
      const msg = e?.message || "Kunne ikke initialisere betaling.";
      setLastError(msg);
      console.log("[OwnerCheckout] setupPaymentSheet error:", e);
    } finally {
      setLoading(false);
    }
  }, [jobId, providerId, amount]);

  useEffect(() => {
    setupPaymentSheet();
  }, [setupPaymentSheet]);

  async function onPay() {
    if (!clientSecret) return;
    try {
      setPaying(true);
      const { error } = await presentPaymentSheet();
      if (error) {
        console.log("[OwnerCheckout] presentPaymentSheet error:", error);
        Alert.alert("Betaling afbrudt", error.message || "Betaling blev ikke gennemført.");
        return;
      }

      // 🎯 Marker jobbet som betalt lokalt i Firestore
      await markRequestPaid(jobId);

      Alert.alert("Betaling gennemført", "Tak! Din betaling er modtaget.");
      navigation.goBack();
    } catch (e) {
      console.log("[OwnerCheckout] onPay error:", e);
      Alert.alert("Fejl", e?.message || "Noget gik galt under betalingen.");
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center", padding: 16 }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Forbereder betaling…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 16, backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>Betaling</Text>

      <View style={{ borderWidth: 1, borderColor: "#E5E7EB", borderRadius: 12, padding: 16 }}>
        <Text style={{ fontSize: 16, fontWeight: "700" }}>Job #{jobId || "—"}</Text>
        <Text style={{ color: "#6B7280", marginTop: 6 }}>
          Du betaler {DKK(Number(amount))} til mekanikeren.
        </Text>

        {/* Debug-info */}
        <View style={{ marginTop: 8, backgroundColor: "#F3F4F6", borderRadius: 6, padding: 8 }}>
          <Text style={{ color: "#374151", fontSize: 12 }}>
            providerId: <Text style={{ fontWeight: "700" }}>{String(providerId || "—")}</Text>
          </Text>
          <Text style={{ color: "#374151", fontSize: 12 }}>
            amount(øre): <Text style={{ fontWeight: "700" }}>{Math.round(Number(amount || 0) * 100)}</Text>
          </Text>
        </View>
      </View>

      {!!lastError && (
        <View style={{ backgroundColor: "#FEF2F2", borderWidth: 1, borderColor: "#FCA5A5", borderRadius: 8, padding: 12 }}>
          <Text style={{ color: "#991B1B", fontWeight: "700", marginBottom: 4 }}>Fejl</Text>
          <Text style={{ color: "#991B1B" }}>{lastError}</Text>
        </View>
      )}

      {clientSecret ? (
        <TouchableOpacity
          onPress={onPay}
          disabled={paying}
          style={{ backgroundColor: "#0A84FF", paddingVertical: 14, borderRadius: 10, alignItems: "center" }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>
            {paying ? "Behandler…" : "Betal nu"}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={setupPaymentSheet}
          style={{ backgroundColor: "#111827", paddingVertical: 12, borderRadius: 10, alignItems: "center" }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>Prøv igen</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{ backgroundColor: "#6B7280", paddingVertical: 12, borderRadius: 10, alignItems: "center" }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>Tilbage</Text>
      </TouchableOpacity>
    </View>
  );
}