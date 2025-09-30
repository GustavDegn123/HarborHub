import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  TextInput,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { addProviderReview } from "../../services/providersService";
import { markJobReviewed, getServiceRequest } from "../../services/requestsService";

function Star({ filled, onPress, size = 28 }) {
  return (
    <TouchableOpacity onPress={onPress} style={{ padding: 4 }}>
      <Text style={{ fontSize: size, color: filled ? "#F59E0B" : "#D1D5DB" }}>
        ★
      </Text>
    </TouchableOpacity>
  );
}

export default function LeaveReviewScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { jobId, providerId, ownerId } = route.params || {};

  const [rating, setRating] = useState(5);
  const [comment, setComment] = useState("");
  const [saving, setSaving] = useState(false);

  const valid = useMemo(
    () => jobId && providerId && ownerId && rating >= 1 && rating <= 5,
    [jobId, providerId, ownerId, rating]
  );

  async function submit() {
    if (!valid) return;
    try {
      setSaving(true);

      // sanity-check: job er paid eller completed
      try {
        const job = await getServiceRequest(jobId);
        const s = String(job?.status || "").toLowerCase();
        const ok =
          job &&
          (s === "completed" || s === "paid") &&
          job.acceptedProviderId === providerId;
        if (!ok) {
          Alert.alert(
            "Ikke klar til anmeldelse",
            "Jobbet er ikke afsluttet/betalt, eller mekaniker matcher ikke."
          );
          setSaving(false);
          return;
        }
        if (job.reviewGiven) {
          Alert.alert(
            "Allerede anmeldt",
            "Du har allerede anmeldt denne opgave."
          );
          setSaving(false);
          return;
        }
      } catch {}

      await addProviderReview({ providerId, ownerId, jobId, rating, comment });
      await markJobReviewed(jobId);

      Alert.alert("Tak for din anmeldelse", "Din anmeldelse er gemt.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Fejl", e?.message || "Kunne ikke gemme anmeldelse");
    } finally {
      setSaving(false);
    }
  }

  return (
    <KeyboardAvoidingView
      style={{ flex: 1, backgroundColor: "white" }}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView contentContainerStyle={{ padding: 16, gap: 16 }}>
        <Text style={{ fontSize: 22, fontWeight: "800" }}>Giv anmeldelse</Text>
        <Text style={{ color: "#6B7280" }}>
          Vurder din oplevelse med mekanikeren.
        </Text>

        {/* Stjerner */}
        <View style={{ flexDirection: "row", alignItems: "center" }}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} filled={rating >= s} onPress={() => setRating(s)} />
          ))}
          <Text style={{ marginLeft: 8, fontWeight: "600" }}>{rating}/5</Text>
        </View>

        {/* Kommentar */}
        <Text style={{ fontWeight: "700" }}>Kommentar (valgfri)</Text>
        <TextInput
          style={{
            borderWidth: 1,
            borderColor: "#E5E7EB",
            borderRadius: 12,
            padding: 12,
            minHeight: 100,
            textAlignVertical: "top",
          }}
          multiline
          placeholder="Skriv en kort kommentar…"
          value={comment}
          onChangeText={setComment}
        />

        {/* Gem */}
        <TouchableOpacity
          disabled={!valid || saving}
          onPress={submit}
          style={{
            backgroundColor: valid ? "#0A84FF" : "#93C5FD",
            paddingVertical: 14,
            borderRadius: 12,
            alignItems: "center",
          }}
        >
          <Text style={{ color: "white", fontWeight: "800" }}>
            {saving ? "Gemmer…" : "Gem anmeldelse"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
