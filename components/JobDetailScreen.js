import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { auth, db } from "../firebase";
import { doc, getDoc, updateDoc, serverTimestamp } from "firebase/firestore";

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
  const navigation = useNavigation();
  const user = auth.currentUser;
  const jobId = route?.params?.jobId;

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [saving, setSaving] = useState(false);

  async function reload() {
    try {
      const snap = await getDoc(doc(db, "service_requests", jobId));
      setJob(snap.exists() ? { id: snap.id, ...snap.data() } : null);
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
    if (ts?.toDate)
      return new Intl.DateTimeFormat("da-DK", {
        dateStyle: "medium",
        timeStyle: "short",
      }).format(ts.toDate());
    return "";
  }, [job]);

  const rawStatus = String(job?.status || "").toLowerCase();
  const isOpen = rawStatus === "open";
  const isClaimed = rawStatus === "claimed";
  const inProgress =
    rawStatus === "in_progress" || rawStatus === "inprogress";
  const isCompleted = rawStatus === "completed";

  const iAmOwner = user?.uid && job?.owner_id === user.uid;
  const iAmProvider =
    user?.uid && (job?.acceptedBy === user.uid || job?.providerId === user.uid);

  async function onClaim() {
    if (!user?.uid)
      return Alert.alert("Ikke logget ind", "Log ind for at tage opgaven.");
    if (!job || !isOpen) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "service_requests", job.id), {
        status: "claimed",
        acceptedBy: user.uid,
        acceptedAt: serverTimestamp(),
      });
      await reload();
      Alert.alert("Job taget", "Service request er nu din.");
    } catch (e) {
      Alert.alert(
        "Fejl",
        "Kunne ikke tage opgaven. " + (e?.message || "")
      );
    } finally {
      setSaving(false);
    }
  }

  async function onStart() {
    if (!(iAmProvider && (isClaimed || isOpen))) return;
    setSaving(true);
    try {
      await updateDoc(doc(db, "service_requests", job.id), {
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
      await updateDoc(doc(db, "service_requests", job.id), {
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
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: "#6b7280" }}>
          Henter service request…
        </Text>
      </View>
    );
  }
  if (!job) {
    return (
      <View
        style={{
          flex: 1,
          alignItems: "center",
          justifyContent: "center",
          padding: 24,
        }}
      >
        <Text
          style={{ fontWeight: "800", fontSize: 16, marginBottom: 6 }}
        >
          Ikke fundet
        </Text>
        <Text style={{ color: "#6b7280", textAlign: "center" }}>
          Prøv at gå tilbage til oversigten.
        </Text>
      </View>
    );
  }

  const statusBadge = (() => {
    const base = {
      textTransform: "capitalize",
      fontWeight: "800",
      paddingHorizontal: 10,
      paddingVertical: 4,
      borderRadius: 999,
    };
    const s = rawStatus || "ukendt";
    if (isCompleted)
      return (
        <Text
          style={{
            ...base,
            backgroundColor: "#e7f7ee",
            color: "#1c8b4a",
          }}
        >
          {s}
        </Text>
      );
    if (inProgress)
      return (
        <Text
          style={{
            ...base,
            backgroundColor: "#fff7ed",
            color: "#b45309",
          }}
        >
          {s}
        </Text>
      );
    if (isClaimed)
      return (
        <Text
          style={{
            ...base,
            backgroundColor: "#eef5fb",
            color: "#1f5c7d",
          }}
        >
          {s}
        </Text>
      );
    return (
      <Text
        style={{
          ...base,
          backgroundColor: "#e5e7eb",
          color: "#374151",
        }}
      >
        {s}
      </Text>
    );
  })();

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "#f6f9fc" }}
      contentContainerStyle={{ padding: 16 }}
    >
      <View
        style={{
          backgroundColor: "#fff",
          borderRadius: 16,
          borderWidth: 1,
          borderColor: "#e6eef4",
          padding: 16,
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
          }}
        >
          <Text
            style={{
              fontSize: 20,
              fontWeight: "900",
              color: "#0f1f2a",
            }}
          >
            {job.service_type || "Serviceforespørgsel"}
          </Text>
          {statusBadge}
        </View>

        {created ? (
          <Text style={{ marginTop: 4, color: "#6b7280" }}>
            Oprettet: {created}
          </Text>
        ) : null}

        {job.description ? (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontWeight: "800", color: "#0f1f2a" }}>
              Beskrivelse
            </Text>
            <Text style={{ marginTop: 6, color: "#374151" }}>
              {job.description}
            </Text>
          </View>
        ) : null}

        {job.boat_id ? (
          <View style={{ marginTop: 12 }}>
            <Text style={{ fontWeight: "800", color: "#0f1f2a" }}>Båd</Text>
            <Text style={{ marginTop: 6, color: "#374151" }}>
              ID: {job.boat_id}
            </Text>
          </View>
        ) : null}
      </View>

      <View style={{ height: 12 }} />

      {isOpen && (
        <TouchableOpacity
          disabled={saving}
          onPress={onClaim}
          style={{
            backgroundColor: "#1f5c7d",
            paddingVertical: 16,
            alignItems: "center",
            borderRadius: 14,
            marginBottom: 10,
          }}
        >
          <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
            {saving ? "Udfører…" : "Tag opgaven"}
          </Text>
        </TouchableOpacity>
      )}

      {iAmProvider && !isCompleted && (
        <View style={{ gap: 10 }}>
          {(isClaimed || isOpen) && (
            <TouchableOpacity
              disabled={saving}
              onPress={onStart}
              style={{
                backgroundColor: "#fb923c",
                paddingVertical: 16,
                alignItems: "center",
                borderRadius: 14,
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
                {saving ? "Starter…" : "Start arbejde"}
              </Text>
            </TouchableOpacity>
          )}

          <TouchableOpacity
            disabled={saving}
            onPress={onComplete}
            style={{
              backgroundColor: "#16a34a",
              paddingVertical: 16,
              alignItems: "center",
              borderRadius: 14,
            }}
          >
            <Text style={{ color: "#fff", fontWeight: "900", fontSize: 16 }}>
              {saving ? "Afslutter…" : "Afslut opgave"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {isCompleted && (
        <View
          style={{
            padding: 14,
            borderRadius: 12,
            backgroundColor: "#e7f7ee",
            borderWidth: 1,
            borderColor: "#b7ebc5",
            alignItems: "center",
            marginTop: 4,
          }}
        >
          <Text style={{ color: "#1c8b4a", fontWeight: "900" }}>
            Opgaven er afsluttet
          </Text>
        </View>
      )}
    </ScrollView>
  );
}
