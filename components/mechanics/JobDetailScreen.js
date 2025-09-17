import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { auth } from "../../firebase";
import { updateServiceRequest, getServiceRequest } from "../../services/requestsService";
import styles from "../../styles/mechanics/jobDetailStyles";
import { serverTimestamp } from "firebase/firestore";

// Formatér DKK
function DKK(n) {
  return typeof n === "number"
    ? new Intl.NumberFormat("da-DK", {
        style: "currency",
        currency: "DKK",
        maximumFractionDigits: 0,
      }).format(n)
    : "—";
}

export default function JobDetailScreen() {
  const route = useRoute();
  const user = auth.currentUser;
  const jobId = route?.params?.jobId;

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [saving, setSaving] = useState(false);

  // Hent service request
  async function reload() {
    try {
      const data = await getServiceRequest(jobId);
      setJob(data);
    } catch (e) {
      Alert.alert("Fejl", "Kunne ikke hente service request.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, [jobId]);

  const created = useMemo(() => {
    const ts = job?.created_at;
    if (ts?.toDate) {
      return new Intl.DateTimeFormat("da-DK", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(ts.toDate());
    }
    return "";
  }, [job]);

  // Status
  const rawStatus = String(job?.status || "").toLowerCase();
  const isOpen = rawStatus === "open";
  const isClaimed = rawStatus === "claimed";
  const inProgress =
    rawStatus === "in_progress" || rawStatus === "inprogress";
  const isCompleted = rawStatus === "completed";

  const iAmOwner = user?.uid && job?.owner_id === user.uid;
  const iAmProvider =
    user?.uid && (job?.acceptedBy === user.uid || job?.providerId === user.uid);

  // Actions
  async function onClaim() {
    if (!user?.uid)
      return Alert.alert("Ikke logget ind", "Log ind for at tage opgaven.");
    if (!job || !isOpen) return;
    setSaving(true);
    try {
      await updateServiceRequest(job.id, {
        status: "claimed",
        acceptedBy: user.uid,
        acceptedAt: serverTimestamp(),
      });
      await reload();
      Alert.alert("Job taget", "Service request er nu din.");
    } catch (e) {
      Alert.alert("Fejl", "Kunne ikke tage opgaven. " + (e?.message || ""));
    } finally {
      setSaving(false);
    }
  }

  async function onStart() {
    if (!(iAmProvider && (isClaimed || isOpen))) return;
    setSaving(true);
    try {
      await updateServiceRequest(job.id, {
        status: "in_progress",
        startedAt: serverTimestamp(),
        acceptedBy: job?.acceptedBy || user.uid,
        acceptedAt: job?.acceptedAt || serverTimestamp(),
      });
      await reload();
    } catch (e) {
      Alert.alert("Fejl", "Kunne ikke starte arbejdet. " + (e?.message || ""));
    } finally {
      setSaving(false);
    }
  }

  async function onComplete() {
    if (!(iAmProvider && (isClaimed || inProgress))) return;
    setSaving(true);
    try {
      await updateServiceRequest(job.id, {
        status: "completed",
        completedAt: serverTimestamp(),
        acceptedBy: job?.acceptedBy || user.uid,
        acceptedAt: job?.acceptedAt || serverTimestamp(),
      });
      await reload();
      Alert.alert("Afsluttet", "Opgaven er markeret som færdig.");
    } catch (e) {
      Alert.alert("Fejl", "Kunne ikke afslutte opgaven. " + (e?.message || ""));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
        <Text style={styles.loaderText}>
          Henter service request…
        </Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundTitle}>Ikke fundet</Text>
        <Text style={styles.notFoundText}>
          Prøv at gå tilbage til oversigten.
        </Text>
      </View>
    );
  }

  const statusBadge = (() => {
    const s = rawStatus || "ukendt";
    if (isCompleted)
      return <Text style={styles.badgeCompleted}>{s}</Text>;
    if (inProgress)
      return <Text style={styles.badgeInProgress}>{s}</Text>;
    if (isClaimed)
      return <Text style={styles.badgeClaimed}>{s}</Text>;
    return <Text style={styles.badgeDefault}>{s}</Text>;
  })();

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.card}>
        <View style={styles.cardHeader}>
          <Text style={styles.title}>
            {job.service_type || "Serviceforespørgsel"}
          </Text>
          {statusBadge}
        </View>

        {created ? <Text style={styles.created}>Oprettet: {created}</Text> : null}

        {job.description ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Beskrivelse</Text>
            <Text style={styles.sectionText}>{job.description}</Text>
          </View>
        ) : null}

        {job.boat_id ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Båd</Text>
            <Text style={styles.sectionText}>ID: {job.boat_id}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.spacer} />

      {isOpen && (
        <TouchableOpacity
          disabled={saving}
          onPress={onClaim}
          style={styles.btnPrimary}
        >
          <Text style={styles.btnPrimaryText}>
            {saving ? "Udfører…" : "Tag opgaven"}
          </Text>
        </TouchableOpacity>
      )}

      {iAmProvider && !isCompleted && (
        <View style={styles.actionGroup}>
          {(isClaimed || isOpen) && (
            <TouchableOpacity
              disabled={saving}
              onPress={onStart}
              style={styles.btnWarn}
            >
              <Text style={styles.btnText}>
                {saving ? "Starter…" : "Start arbejde"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            disabled={saving}
            onPress={onComplete}
            style={styles.btnSuccess}
          >
            <Text style={styles.btnText}>
              {saving ? "Afslutter…" : "Afslut opgave"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isCompleted && (
        <View style={styles.completedBox}>
          <Text style={styles.completedText}>
            Opgaven er afsluttet
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
