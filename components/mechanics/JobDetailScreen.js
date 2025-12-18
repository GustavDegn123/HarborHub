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
import { useRoute, useNavigation } from "@react-navigation/native";
import { Timestamp, doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import {
  getServiceRequest,
  addBid,
  getBids,
  startAssignedJob,
  completeAssignedJob,
  cancelAssignedJob,
  getProvider,
} from "../../services/requestsService";
import { getBoat } from "../../services/boatsService";
import styles from "../../styles/mechanics/jobDetailStyles";
import { computeViewerRole, derivePermissions } from "../../utils/jobPermissions";

function DKK(n) {
  return Number.isFinite(Number(n))
    ? new Intl.NumberFormat("da-DK", {
        style: "currency",
        currency: "DKK",
        maximumFractionDigits: 0,
      }).format(Number(n))
    : "—";
}

/** Flatten service catalog -> [{id,name}] */
function flattenLeaves(nodes, acc = []) {
  if (!Array.isArray(nodes)) return acc;
  for (const n of nodes) {
    if (!n) continue;
    if (Array.isArray(n.children) && n.children.length) {
      flattenLeaves(n.children, acc);
    } else if (n?.id && n?.name) {
      acc.push({ id: String(n.id), name: String(n.name) });
    }
  }
  return acc;
}

export default function JobDetailScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const user = auth.currentUser;
  const jobId = route?.params?.jobId;
  const navViewAs = route?.params?.viewAs;

  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [job, setJob] = useState(null);
  const [boat, setBoat] = useState(null);
  const [bids, setBids] = useState([]);
  const [price, setPrice] = useState("");
  const [message, setMessage] = useState("");
  const [acceptedProviderName, setAcceptedProviderName] = useState("");

  // service id -> name map
  const [serviceNameById, setServiceNameById] = useState({});

  // Hent service-katalog (til visning af navn i stedet for ID)
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const snap = await getDoc(doc(db, "meta", "service_catalog"));
        const catalog = snap.exists() ? snap.data()?.catalog : null;

        const leaves = flattenLeaves(Array.isArray(catalog) ? catalog : []);
        const map = {};
        for (const l of leaves) map[l.id] = l.name;

        if (alive) setServiceNameById(map);
      } catch {
        if (alive) setServiceNameById({});
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const displayServiceTitle = useMemo(() => {
    return (
      job?.service_name ||
      serviceNameById[job?.service_type] ||
      job?.service_type ||
      "Serviceforespørgsel"
    );
  }, [job, serviceNameById]);

  async function reload() {
    try {
      const data = await getServiceRequest(jobId);
      setJob(data);

      if (data?.boat_id && data?.owner_id) {
        getBoat(data.owner_id, data.boat_id).then(setBoat).catch(() => {});
      } else {
        setBoat(null);
      }

      getBids(jobId).then(setBids).catch(() => setBids([]));

      if (data?.acceptedProviderId) {
        getProvider(data.acceptedProviderId)
          .then((p) => {
            const name =
              p?.companyName || p?.displayName || p?.email || "Mekaniker";
            setAcceptedProviderName(name);
          })
          .catch(() => {});
      } else {
        setAcceptedProviderName("");
      }
    } catch {
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
    try {
      const d = ts instanceof Timestamp ? ts.toDate() : ts?.toDate?.() || ts;
      return d
        ? new Intl.DateTimeFormat("da-DK", {
            dateStyle: "medium",
            timeStyle: "short",
          }).format(d)
        : "";
    } catch {
      return "";
    }
  }, [job]);

  // --- Rolle/permissions
  const inferredRole = computeViewerRole(job, user?.uid);
  const role =
    navViewAs || (inferredRole === "otherProvider" ? "provider" : inferredRole);
  const P = derivePermissions(job, role);

  // --- Bud
  const acceptedBid =
    bids.find((b) => b.id === job?.acceptedBidId) || bids.find((b) => b.accepted);

  async function onBid() {
    if (!user?.uid)
      return Alert.alert("Ikke logget ind", "Log ind for at byde.");
    if (!price) return Alert.alert("Fejl", "Angiv en pris for dit bud.");
    setSaving(true);
    try {
      await addBid(job.id, user.uid, price, message);
      setPrice("");
      setMessage("");
      Alert.alert("Bud sendt", "Dit bud er blevet sendt.");
      await reload();
    } catch (e) {
      Alert.alert("Fejl", "Kunne ikke afgive bud. " + (e?.message || ""));
    } finally {
      setSaving(false);
    }
  }

  // --- Mekaniker handlinger
  const onStart = async () => {
    setSaving(true);
    try {
      await startAssignedJob(jobId, user.uid);
      await reload();
    } catch (e) {
      Alert.alert("Fejl", e?.message || "Kunne ikke starte jobbet.");
    } finally {
      setSaving(false);
    }
  };

  const onComplete = async () => {
    setSaving(true);
    try {
      await completeAssignedJob(jobId, user.uid);
      await reload();
    } catch (e) {
      Alert.alert("Fejl", e?.message || "Kunne ikke afslutte jobbet.");
    } finally {
      setSaving(false);
    }
  };

  const onCancel = () => {
    Alert.alert(
      "Annullér jobbet?",
      "Det vil frigive opgaven igen til andre mekanikere.",
      [
        { text: "Fortryd", style: "cancel" },
        {
          text: "Annullér",
          style: "destructive",
          onPress: async () => {
            setSaving(true);
            try {
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
  };

  const openChat = () => {
    if (!job?.owner_id || !job?.acceptedProviderId)
      return Alert.alert(
        "Chat ikke tilgængelig",
        "Chatten er først tilgængelig, når opgaven er tildelt."
      );

    const otherName = role === "owner" ? "Mekaniker" : "Bådejer";
    navigation.navigate("Chat", {
      jobId: job.id,
      ownerId: job.owner_id,
      providerId: job.acceptedProviderId,
      otherName,
    });
  };

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

  // Skjul chat-knappen helt for ejeren – den findes i OwnerAssignedScreen
  const showChatButton = P.canOpenChat && role !== "owner";

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <View style={styles.card}>
        {/* Header */}
        <View style={styles.cardHeader}>
          <Text style={styles.title}>{displayServiceTitle}</Text>
        </View>

        {!!created && <Text style={styles.created}>Oprettet: {created}</Text>}

        {/* Billede */}
        {!!job.image && (
          <Image
            source={{ uri: job.image }}
            style={{
              width: "100%",
              height: 220,
              borderRadius: 12,
              marginTop: 12,
            }}
            resizeMode="cover"
          />
        )}

        {/* Beskrivelse */}
        {!!job.description && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Beskrivelse</Text>
            <Text style={styles.sectionText}>{job.description}</Text>
          </View>
        )}

        {/* Detaljer */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Detaljer</Text>

          {!!boat?.name && (
            <Text style={styles.sectionText}>Båd: {boat.name}</Text>
          )}

          {Number.isFinite(Number(job.budget)) && (
            <Text style={styles.sectionText}>Budget: {DKK(job.budget)}</Text>
          )}

          {!!job.deadline && (
            <Text style={styles.sectionText}>
              Deadline:{" "}
              {job.deadline === "flexible"
                ? "Fleksibel"
                : job.deadline instanceof Timestamp
                ? job.deadline.toDate().toLocaleDateString("da-DK")
                : job.deadline?.toDate?.()?.toLocaleDateString?.("da-DK")}
            </Text>
          )}

          {!!job.address && (
            <Text style={styles.sectionText}>Adresse: {job.address}</Text>
          )}

          {!!job.distanceText && (
            <Text style={styles.sectionText}>Afstand: {job.distanceText}</Text>
          )}
        </View>

        {/* Accepteret bud → kun ejer efter accept */}
        {P.showAcceptedBidToOwner && (acceptedBid || job?.acceptedPrice) && (
          <View style={[styles.section, { paddingTop: 0 }]}>
            <Text style={styles.sectionTitle}>Accepteret bud</Text>
            <View
              style={{
                marginTop: 6,
                padding: 12,
                borderRadius: 10,
                borderWidth: 1,
                borderColor: "#E5E7EB",
                backgroundColor: "#F9FAFB",
              }}
            >
              <Text style={{ fontWeight: "700" }}>
                {DKK(
                  Number.isFinite(Number(job?.acceptedPrice))
                    ? job.acceptedPrice
                    : acceptedBid?.price
                )}
              </Text>

              {!!acceptedProviderName && (
                <Text style={{ color: "#6B7280", marginTop: 2 }}>
                  {acceptedProviderName}
                </Text>
              )}
            </View>
          </View>
        )}
      </View>

      <View style={styles.spacer} />

      {/* Chat (kun når relevant) */}
      {showChatButton && (
        <TouchableOpacity
          style={styles.btnPrimary}
          onPress={openChat}
          disabled={saving}
        >
          <Text style={styles.btnPrimaryText}>Åbn chat</Text>
        </TouchableOpacity>
      )}

      {/* Mekaniker-knapper (start/afslut/annullér) */}
      {(P.canStart || P.canComplete || P.canCancelAsProvider) && (
        <View style={[styles.section, { gap: 10 }]}>
          {P.canStart && (
            <TouchableOpacity
              disabled={saving}
              onPress={onStart}
              style={styles.btnPrimary}
            >
              <Text style={styles.btnPrimaryText}>
                {saving ? "Starter…" : "Start job"}
              </Text>
            </TouchableOpacity>
          )}

          {P.canComplete && (
            <TouchableOpacity
              disabled={saving}
              onPress={onComplete}
              style={styles.btnSuccess}
            >
              <Text style={styles.btnSuccessText}>
                {saving ? "Afslutter…" : "Afslut job"}
              </Text>
            </TouchableOpacity>
          )}

          {P.canCancelAsProvider && (
            <TouchableOpacity
              disabled={saving}
              onPress={onCancel}
              style={styles.btnDanger}
            >
              <Text style={styles.btnDangerText}>
                {saving ? "Annullerer…" : "Annullér job"}
              </Text>
            </TouchableOpacity>
          )}
        </View>
      )}

      {/* Bud-form → andre mekanikere på åbent job */}
      {P.canBid && (
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

      {/* Budliste:
          - Ejer: kun når job er åbent
          - Provider: vis kun egne bud */}
      {((role === "owner" && P.status === "open") || role === "provider") &&
        bids?.length > 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>
              {role === "owner" ? "Modtagne bud" : "Mine bud"}
            </Text>

            {bids
              .filter((b) => (role === "owner" ? true : b.provider_id === user?.uid))
              .map((b) => (
                <View key={b.id} style={styles.bidItem}>
                  <Text style={styles.bidPrice}>{DKK(b.price)}</Text>
                  {!!b.message && (
                    <Text style={styles.bidMessage}>{b.message}</Text>
                  )}
                </View>
              ))}
          </View>
        )}
    </ScrollView>
  );
}
