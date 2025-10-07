import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  Alert,
  TouchableOpacity,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import {
  initPaymentSheet,
  presentPaymentSheet,
} from "@stripe/stripe-react-native";
import { createPaymentIntentForJob } from "../../services/paymentsService";

const DKK = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("da-DK", {
        style: "currency",
        currency: "DKK",
        maximumFractionDigits: 0,
      }).format(n)
    : "—";

export default function OwnerCheckoutScreen() {
  const navigation = useNavigation();
  const route = useRoute();
  const { jobId, providerId, ownerId, amount } = route.params || {};

  console.log("[OwnerCheckout] route.params:", route.params);

  const [loading, setLoading] = useState(true);
  const [clientSecret, setClientSecret] = useState(null);
  const [paying, setPaying] = useState(false);
  const [lastError, setLastError] = useState("");

  const setupPaymentSheet = useCallback(async () => {
    setLoading(true);
    setLastError("");

    try {
      if (!jobId || !providerId || !ownerId || amount == null) {
        throw new Error("Mangler jobId, providerId, ownerId eller beløb.");
      }

      const amountInMinor = Math.round(Number(amount) * 100);

      // 1️⃣ Opret PaymentIntent via service
      const res = await createPaymentIntentForJob({
        amount: amountInMinor,
        jobId,
        providerId,
        ownerId,
      });

      console.log("[OwnerCheckout] createPaymentIntentForJob ->", res);

      if (!res?.clientSecret)
        throw new Error("Manglende clientSecret fra serveren.");

      setClientSecret(res.clientSecret);

      // 2️⃣ Initier PaymentSheet
      const { error } = await initPaymentSheet({
        paymentIntentClientSecret: res.clientSecret,
        merchantDisplayName: "HarborHub (TEST)",
        allowsDelayedPaymentMethods: false,
      });
      if (error) throw new Error(error.message);
    } catch (e) {
      console.error("[OwnerCheckout] setupPaymentSheet error:", e);
      setLastError(e?.message || "Kunne ikke initialisere betaling.");
    } finally {
      setLoading(false);
    }
  }, [jobId, providerId, ownerId, amount]);

  useEffect(() => {
    setupPaymentSheet();
  }, [setupPaymentSheet]);

  async function onPay() {
    if (!clientSecret) return;
    try {
      setPaying(true);

      const { error } = await presentPaymentSheet();

      if (error) {
        console.error("[OwnerCheckout] presentPaymentSheet error:", error);
        Alert.alert(
          "Betaling afbrudt",
          error.message || "Betaling blev ikke gennemført."
        );
        return;
      }

      // ✅ Succes – webhook logger i Firestore og sætter status=paid
      Alert.alert("Betaling gennemført", "Tak! Din betaling er modtaget.");

      // Naviger direkte til LeaveReview
      navigation.replace("LeaveReview", {
        jobId,
        providerId,
        ownerId,
      });
    } catch (e) {
      console.error("[OwnerCheckout] onPay error:", e);
      Alert.alert("Fejl", e?.message || "Noget gik galt under betalingen.");
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 16,
        }}
      >
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Forbereder betaling…</Text>
      </View>
    );
  }

  return (
    <View style={{ flex: 1, padding: 16, gap: 16, backgroundColor: "#fff" }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>Betaling</Text>

      <View
        style={{
          borderWidth: 1,
          borderColor: "#E5E7EB",
          borderRadius: 12,
          padding: 16,
        }}
      >
        <Text style={{ fontSize: 16, fontWeight: "700" }}>
          Job #{jobId || "—"}
        </Text>
        <Text style={{ color: "#6B7280", marginTop: 6 }}>
          Du betaler {DKK(Number(amount))} til mekanikeren.
        </Text>
      </View>

      {!!lastError && (
        <View
          style={{
            backgroundColor: "#FEF2F2",
            borderWidth: 1,
            borderColor: "#FCA5A5",
            borderRadius: 8,
            padding: 12,
          }}
        >
          <Text
            style={{ color: "#991B1B", fontWeight: "700", marginBottom: 4 }}
          >
            Fejl
          </Text>
          <Text style={{ color: "#991B1B" }}>{lastError}</Text>
        </View>
      )}

      {clientSecret ? (
        <TouchableOpacity
          onPress={onPay}
          disabled={paying}
          style={{
            backgroundColor: "#0A84FF",
            paddingVertical: 14,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "700" }}>
            {paying ? "Behandler…" : "Betal nu"}
          </Text>
        </TouchableOpacity>
      ) : (
        <TouchableOpacity
          onPress={setupPaymentSheet}
          style={{
            backgroundColor: "#111827",
            paddingVertical: 12,
            borderRadius: 10,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "600" }}>Prøv igen</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity
        onPress={() => navigation.goBack()}
        style={{
          backgroundColor: "#6B7280",
          paddingVertical: 12,
          borderRadius: 10,
          alignItems: "center",
        }}
      >
        <Text style={{ color: "white", fontWeight: "600" }}>Tilbage</Text>
      </TouchableOpacity>
    </View>
  );
}
