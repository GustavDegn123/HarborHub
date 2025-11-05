import React, { useEffect, useState, useCallback } from "react";
import { View, Text, ActivityIndicator, Alert, TouchableOpacity } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { initPaymentSheet, presentPaymentSheet } from "@stripe/stripe-react-native";
import { createPaymentIntentForJob } from "../../services/paymentsService";
import styles from "../../styles/boatowners/ownerCheckoutStyles";

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

      // 1) Opret PaymentIntent
      const res = await createPaymentIntentForJob({
        amount: amountInMinor,
        jobId,
        providerId,
        ownerId,
      });

      if (!res?.clientSecret) throw new Error("Manglende clientSecret fra serveren.");
      setClientSecret(res.clientSecret);

      // 2) Initier PaymentSheet
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
        Alert.alert("Betaling afbrudt", error.message || "Betaling blev ikke gennemført.");
        return;
      }

      Alert.alert("Betaling gennemført", "Tak! Din betaling er modtaget.");
      navigation.replace("LeaveReview", { jobId, providerId, ownerId });
    } catch (e) {
      console.error("[OwnerCheckout] onPay error:", e);
      Alert.alert("Fejl", e?.message || "Noget gik galt under betalingen.");
    } finally {
      setPaying(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.centerText}>Forbereder betaling…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <Text style={styles.title}>Betaling</Text>

      <View style={styles.card}>
        <Text style={styles.cardTitle}>Job #{jobId || "—"}</Text>
        <Text style={styles.cardSubtitle}>Du betaler {DKK(Number(amount))} til mekanikeren.</Text>
      </View>

      {!!lastError && (
        <View style={styles.errorBox}>
          <Text style={styles.errorTitle}>Fejl</Text>
          <Text style={styles.errorText}>{lastError}</Text>
        </View>
      )}

      {clientSecret ? (
        <TouchableOpacity onPress={onPay} disabled={paying} style={[styles.payBtn, paying && styles.btnDisabled]}>
          {paying ? <ActivityIndicator color="#fff" /> : <Text style={styles.payBtnText}>Betal nu</Text>}
        </TouchableOpacity>
      ) : (
        <TouchableOpacity onPress={setupPaymentSheet} style={styles.retryBtn}>
          <Text style={styles.retryBtnText}>Prøv igen</Text>
        </TouchableOpacity>
      )}

      <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backBtn}>
        <Text style={styles.backBtnText}>Tilbage</Text>
      </TouchableOpacity>
    </View>
  );
}
