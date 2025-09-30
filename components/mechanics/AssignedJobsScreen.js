// /components/mechanics/AssignedJobsScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
} from "react-native";
import { getAuth } from "firebase/auth";
import { collection, onSnapshot, query, where } from "firebase/firestore";
import { db } from "../../firebase";
import styles from "../../styles/mechanics/jobsFeedStyles";
import {
  startAssignedJob,
  completeAssignedJob,
  cancelAssignedJob,
} from "../../services/requestsService";

const DKK = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("da-DK", {
        style: "currency",
        currency: "DKK",
        maximumFractionDigits: 0,
      }).format(n)
    : "—";

export default function AssignedJobsScreen({ navigation }) {
  const auth = getAuth();
  const uid = auth.currentUser?.uid;

  const [loading, setLoading] = useState(true);
  const [jobs, setJobs] = useState([]); // alle tildelte jobs
  const [busyId, setBusyId] = useState(null);

  useEffect(() => {
    if (!uid) return;
    const qRef = query(
      collection(db, "service_requests"),
      where("acceptedProviderId", "==", uid)
    );
    const unsub = onSnapshot(
      qRef,
      (snap) => {
        const arr = [];
        snap.forEach((d) => arr.push({ id: d.id, ...d.data() }));
        setJobs(arr);
        setLoading(false);
      },
      (err) => {
        console.warn("AssignedJobs live error:", err?.message || err);
        setLoading(false);
      }
    );
    return () => unsub();
  }, [uid]);

  // 👇 Vis både assigned + in_progress
  const visibleJobs = useMemo(
    () =>
      jobs.filter((j) => {
        const s = String(j.status || "").toLowerCase();
        return s === "assigned" || s === "in_progress";
      }),
    [jobs]
  );

  async function onStart(job) {
    try {
      setBusyId(job.id);
      await startAssignedJob(job.id, uid);
    } catch (e) {
      Alert.alert("Fejl", e?.message || "Kunne ikke starte opgaven.");
    } finally {
      setBusyId(null);
    }
  }

  async function onComplete(job) {
    try {
      setBusyId(job.id);
      await completeAssignedJob(job.id, uid);
    } catch (e) {
      Alert.alert("Fejl", e?.message || "Kunne ikke afslutte opgaven.");
    } finally {
      setBusyId(null);
    }
  }

  async function onCancel(job) {
    try {
      setBusyId(job.id);
      await cancelAssignedJob(job.id, uid);
    } catch (e) {
      Alert.alert("Fejl", e?.message || "Kunne ikke annullere opgaven.");
    } finally {
      setBusyId(null);
    }
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
        <Text style={styles.loaderText}>Henter mine opgaver…</Text>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      {visibleJobs.length === 0 ? (
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Ingen opgaver</Text>
          <Text style={styles.emptySubtitle}>
            Når du accepteres til en opgave, vises den her indtil den er afsluttet.
          </Text>
        </View>
      ) : (
        <FlatList
          data={visibleJobs}
          keyExtractor={(it) => it.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => {
            const s = String(item.status || "").toLowerCase();
            return (
              <View style={styles.card}>
                <Text style={styles.cardTitle}>
                  {item.service_type || "Opgave"}{" "}
                  {s === "in_progress" ? "⏳ (I gang)" : ""}
                </Text>
                {item.budget ? (
                  <Text style={styles.cardBudget}>{DKK(item.budget)}</Text>
                ) : null}
                {item.description ? (
                  <Text style={styles.cardDesc} numberOfLines={2}>
                    {item.description}
                  </Text>
                ) : null}

                <View style={{ height: 8 }} />

                {s === "assigned" && (
                  <TouchableOpacity
                    style={[
                      styles.btnPrimary,
                      busyId === item.id && { opacity: 0.6 },
                    ]}
                    disabled={busyId === item.id}
                    onPress={() => onStart(item)}
                  >
                    <Text style={styles.btnPrimaryText}>
                      {busyId === item.id ? "Starter…" : "Start opgave"}
                    </Text>
                  </TouchableOpacity>
                )}

                {s === "in_progress" && (
                  <TouchableOpacity
                    style={[
                      styles.btnSuccess,
                      busyId === item.id && { opacity: 0.6 },
                    ]}
                    disabled={busyId === item.id}
                    onPress={() => onComplete(item)}
                  >
                    <Text style={styles.btnText}>
                      {busyId === item.id ? "Afslutter…" : "Afslut opgave"}
                    </Text>
                  </TouchableOpacity>
                )}

                <View style={{ height: 8 }} />

                <TouchableOpacity
                  style={styles.btnSecondary}
                  onPress={() =>
                    navigation.navigate("JobDetail", { jobId: item.id })
                  }
                >
                  <Text style={styles.btnSecondaryText}>Se detaljer</Text>
                </TouchableOpacity>

                <View style={{ height: 8 }} />

                {s !== "completed" && (
                  <TouchableOpacity
                    style={styles.btnWarn}
                    onPress={() => onCancel(item)}
                    disabled={busyId === item.id}
                  >
                    <Text style={styles.btnText}>Annullér</Text>
                  </TouchableOpacity>
                )}
              </View>
            );
          }}
        />
      )}
    </View>
  );
}
