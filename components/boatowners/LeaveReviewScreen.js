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
import styles, { colors } from "../../styles/boatowners/leaveReviewStyles";

function Star({ filled, onPress, size = 28 }) {
  return (
    <TouchableOpacity onPress={onPress} style={styles.starTouch} hitSlop={{ top: 6, bottom: 6, left: 6, right: 6 }}>
      <Text
        style={[
          styles.starIcon,
          { fontSize: size, color: filled ? colors.starFilled : colors.starEmpty },
        ]}
      >
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

      // sanity-check: job er paid eller completed og korrekt provider
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
          Alert.alert("Allerede anmeldt", "Du har allerede anmeldt denne opgave.");
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
      style={styles.root}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
    >
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Giv anmeldelse</Text>
        <Text style={styles.subtitle}>Vurder din oplevelse med mekanikeren.</Text>

        {/* Stjerner */}
        <View style={styles.starsRow}>
          {[1, 2, 3, 4, 5].map((s) => (
            <Star key={s} filled={rating >= s} onPress={() => setRating(s)} />
          ))}
          <Text style={styles.ratingText}>{rating}/5</Text>
        </View>

        {/* Kommentar */}
        <Text style={styles.label}>Kommentar (valgfri)</Text>
        <TextInput
          style={styles.input}
          multiline
          placeholder="Skriv en kort kommentar…"
          placeholderTextColor={colors.muted}
          value={comment}
          onChangeText={setComment}
        />

        {/* Gem */}
        <TouchableOpacity
          disabled={!valid || saving}
          onPress={submit}
          style={[
            styles.button,
            { backgroundColor: valid ? colors.primary : colors.primaryDisabled },
          ]}
        >
          <Text style={styles.buttonText}>{saving ? "Gemmer…" : "Gem anmeldelse"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </KeyboardAvoidingView>
  );
}
