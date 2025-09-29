// /components/mechanics/JobDetailScreen.js
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  TouchableOpacity,
  Alert,
  ScrollView,
  TextInput,
  Image,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native"; // 👈 tilføjet navigation
import { auth } from "../../firebase";
import {
  getServiceRequest,
  addBid,
  getBids,
  startAssignedJob,
  completeAssignedJob,
  cancelAssignedJob,
  getProvider, // valgfrit hvis du vil vise provider-navn et sted
} from "../../services/requestsService";
import { getBoat } from "../../services/boatsService";
import styles from "../../styles/mechanics/jobDetailStyles";

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
  const navigation = useNavigation(); // 👈
  const user = auth.currentUser;
  const jobId = route?.params?.jobId;

  const [loading, setLoading] = useState(true);
  const [job, setJob] = useState(null);
  const [boat, setBoat] = useState(null);
  const [bids, setBids] = useState([]);
  const [saving, setSaving] = useState(false);

  // Bud-form (kun hvis mekaniker byder på åbent job)
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");

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
    if (jobId) reload();
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
  const isAssignedToMe =
    !!user?.uid && job?.acceptedProviderId && job.acceptedProviderId === user.uid;

  // Byde på job
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

  // Start / Afslut / Annullér (kun for tildelt mekaniker)
  async function handleStart() {
    try {
      setSaving(true);
      await startAssignedJob(jobId, user.uid);
      await reload();
    } catch (e) {
      Alert.alert("Fejl", e?.message || "Kunne ikke starte jobbet.");
    } finally {
      setSaving(false);
    }
  }

  async function handleComplete() {
    try {
      setSaving(true);
      await completeAssignedJob(jobId, user.uid);
      await reload();
    } catch (e) {
      Alert.alert("Fejl", e?.message || "Kunne ikke afslutte jobbet.");
    } finally {
      setSaving(false);
    }
  }

  async function handleCancel() {
    Alert.alert(
      "Annullér jobbet?",
      "Det vil frigive opgaven igen til andre mekanikere.",
      [
        { text: "Fortryd", style: "cancel" },
        {
          text: "Annullér",
          style: "destructive",
          onPress: async () => {
            try {
              setSaving(true);
              await cancelAssignedJob(jobId, user.uid);
              await reload();
            } catch (e) {
              Alert.alert("Fejl", e?.message || "Kunne ikke annullere jobbet.");
            } finally {
              setSaving(false);
            }
          },
        },
      ]
    );
  }

  // 👇 Åbn chat mellem ejer & tildelt mekaniker
  function handleOpenChat() {
    if (!job) return;

    const ownerId = job.owner_id;
    let providerId = null;

    // Hvis jeg er den tildelte mekaniker → chat med ejer
    if (isAssignedToMe) {
      providerId = user.uid;
    }
    // Hvis jeg er ejer → chat med den tildelte mekaniker
    if (iAmOwner && job.acceptedProviderId) {
      providerId = job.acceptedProviderId;
    }

    if (!ownerId || !providerId) {
      return Alert.alert(
        "Chat ikke tilgængelig",
        "Chatten er først tilgængelig, når opgaven er tildelt."
      );
    }

    const otherName = iAmOwner ? "Mekaniker" : "Bådejer";
    navigation.navigate("Chat", {
      jobId: job.id,
      ownerId,
      providerId,
      otherName,
    });
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

  // Owner ser alle bud; provider ser sine egne
  const visibleBids = iAmOwner ? bids : bids.filter((b) => b.provider_id === user?.uid);

  const showChatButton = (iAmOwner && !!job?.acceptedProviderId) || isAssignedToMe;

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

        {job.image ? (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Billede</Text>
            <Image
              source={{ uri: job.image }}
              style={{ width: "100%", height: 200, borderRadius: 8, marginTop: 8 }}
              resizeMode="cover"
            />
          </View>
        ) : null}

        {/* 👇 Chat-knap i kortet (vises kun når opgaven er tildelt) */}
        {showChatButton && (
          <TouchableOpacity
            style={[styles.btnPrimary, { marginTop: 10 }]}
            onPress={handleOpenChat}
          >
            <Text style={styles.btnPrimaryText}>Åbn chat</Text>
          </TouchableOpacity>
        )}
      </View>

      <View style={styles.spacer} />

      {/* Knapper for TILDELT mekaniker */}
      {isAssignedToMe && (
        <View style={[styles.section, { gap: 10 }]}>
          {rawStatus === "assigned" && (
            <>
              <TouchableOpacity
                disabled={saving}
                onPress={handleStart}
                style={styles.btnPrimary}
              >
                <Text style={styles.btnPrimaryText}>
                  {saving ? "Starter…" : "Start jobbet"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={saving}
                onPress={handleCancel}
                style={styles.btnDanger}
              >
                <Text style={styles.btnDangerText}>
                  {saving ? "Annullerer…" : "Annullér job"}
                </Text>
              </TouchableOpacity>

              {/* 👇 Ekstra chat-knap her også for nem adgang */}
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={handleOpenChat}
              >
                <Text style={styles.btnSecondaryText}>Åbn chat</Text>
              </TouchableOpacity>
            </>
          )}

          {rawStatus === "in_progress" && (
            <>
              <TouchableOpacity
                disabled={saving}
                onPress={handleComplete}
                style={styles.btnSuccess}
              >
                <Text style={styles.btnSuccessText}>
                  {saving ? "Afslutter…" : "Afslut job"}
                </Text>
              </TouchableOpacity>

              <TouchableOpacity
                disabled={saving}
                onPress={handleCancel}
                style={styles.btnDanger}
              >
                <Text style={styles.btnDangerText}>
                  {saving ? "Annullerer…" : "Annullér job"}
                </Text>
              </TouchableOpacity>

              {/* Chat-knap under igangværende */}
              <TouchableOpacity
                style={styles.btnSecondary}
                onPress={handleOpenChat}
              >
                <Text style={styles.btnSecondaryText}>Åbn chat</Text>
              </TouchableOpacity>
            </>
          )}
        </View>
      )}

      {/* Bud-form til providers (kun når job er åbent, ikke ejer, og IKKE tildelt) */}
      {isOpen && !iAmOwner && !isAssignedToMe && (
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

      {/* Budliste (owner ser alle, provider ser egne) */}
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