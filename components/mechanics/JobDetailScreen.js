import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
} from "react-native";
import { useRoute } from "@react-navigation/native";
import { auth } from "../../firebase";
import {
  getServiceRequest,
  addBid,
  getBids,
} from "../../services/requestsService";
import { getBoat } from "../../services/boatsService";
import styles from "../../styles/mechanics/jobDetailStyles";

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
  const [boat, setBoat] = useState(null);
  const [bids, setBids] = useState([]);
  const [saving, setSaving] = useState(false);

  // Form state til bud
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");

  // Hent service request + båd + bud
  async function reload() {
    try {
      const data = await getServiceRequest(jobId);
      setJob(data);

      if (data?.boat_id && data?.owner_id) {
        try {
          const b = await getBoat(data.owner_id, data.boat_id);
          setBoat(b);
        } catch (e) {
          console.log("Kunne ikke hente båd:", e);
        }
      }

      try {
        const bidList = await getBids(jobId);
        setBids(bidList);
      } catch (e) {
        console.log("Kunne ikke hente bud:", e);
        setBids([]);
      }
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

  const rawStatus = String(job?.status || "").toLowerCase();
  const isOpen = rawStatus === "open";
  const isCompleted = rawStatus === "completed";

  const iAmOwner = user?.uid && job?.owner_id === user.uid;

  // Afgiv bud
  async function onBid() {
    if (!user?.uid) return Alert.alert("Ikke logget ind", "Log ind for at byde.");
    if (!price) return Alert.alert("Fejl", "Angiv en pris for dit bud.");

    setSaving(true);
    try {
      await addBid(job.id, user.uid, price, message);
      Alert.alert("Bud sendt", "Dit bud er blevet sendt.");
      setPrice("");
      setMessage("");
      await reload();
    } catch (e) {
      Alert.alert("Fejl", "Kunne ikke afgive bud. " + (e?.message || ""));
    } finally {
      setSaving(false);
    }
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
        <Text style={styles.loaderText}>Henter service request…</Text>
      </View>
    );
  }

  if (!job) {
    return (
      <View style={styles.notFound}>
        <Text style={styles.notFoundTitle}>Ikke fundet</Text>
        <Text style={styles.notFoundText}>Prøv at gå tilbage til oversigten.</Text>
      </View>
    );
  }

  const statusBadge = (() => {
    const s = rawStatus || "ukendt";
    if (isCompleted) return <Text style={styles.badgeCompleted}>{s}</Text>;
    if (isOpen) return <Text style={styles.badgeDefault}>{s}</Text>;
    return <Text style={styles.badgeClaimed}>{s}</Text>;
  })();

  // Filtrer bids så owner ser alle, men provider ser sine egne
  const visibleBids = iAmOwner
    ? bids
    : bids.filter((b) => b.provider_id === user?.uid);

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

        {boat ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Båd</Text>
            <Text style={styles.sectionText}>{boat.name}</Text>
          </View>
        ) : null}

        {job.budget ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Budget</Text>
            <Text style={styles.sectionText}>{DKK(job.budget)}</Text>
          </View>
        ) : null}
      </View>

      <View style={styles.spacer} />

      {/* Bud-form til providers */}
      {isOpen && !isCompleted && !iAmOwner && (
        <View style={styles.bidBox}>
          <Text style={styles.sectionTitle}>Afgiv dit bud</Text>

          <TextInput
            style={styles.input}
            placeholder="Pris (DKK)"
            keyboardType="numeric"
            value={price}
            onChangeText={setPrice}
          />

          <TextInput
            style={[styles.input, { height: 80 }]}
            placeholder="Besked til ejeren"
            multiline
            value={message}
            onChangeText={setMessage}
          />

          <TouchableOpacity
            disabled={saving}
            onPress={onBid}
            style={styles.btnPrimary}
          >
            <Text style={styles.btnPrimaryText}>
              {saving ? "Sender…" : "Byd på opgaven"}
            </Text>
          </TouchableOpacity>
        </View>
      )}

      {/* Budliste */}
      {visibleBids.length > 0 && (
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>
            {iAmOwner ? "Modtagne bud" : "Mine bud"}
          </Text>
          {visibleBids.map((b) => (
            <View key={b.id} style={styles.bidItem}>
              <Text style={styles.bidPrice}>{DKK(b.price)}</Text>
              {b.message ? <Text style={styles.bidMessage}>{b.message}</Text> : null}
            </View>
          ))}
        </View>
      )}

      {isCompleted && (
        <View style={styles.completedBox}>
          <Text style={styles.completedText}>Opgaven er afsluttet</Text>
        </View>
      )}
    </ScrollView>
  );
}
