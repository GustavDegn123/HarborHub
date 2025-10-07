import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { auth } from "../../firebase";
import { listenOwnerRequestsSafe } from "../../services/requestsService";
import styles from "../../styles/boatowners/ownerHistoryStyles";
 
/* ------- Helpers ------- */
const DKK = (n) =>
  Number.isFinite(Number(n))
    ? new Intl.NumberFormat("da-DK", {
        style: "currency",
        currency: "DKK",
        maximumFractionDigits: 0,
      }).format(Number(n))
    : "—";
 
/* Normaliser status (accepter både engelsk og dansk) */
function normalizeStatus(raw) {
  const s = String(raw || "").trim().toLowerCase();
  if (["open", "åben", "aaben", "aben"].includes(s)) return "open";
  if (["assigned", "tildelt"].includes(s)) return "assigned";
  if (["in_progress", "in-progress", "i_gang", "i-gang", "igang"].includes(s))
    return "in_progress";
  if (["completed", "done", "closed", "afsluttet"].includes(s)) return "completed";
  if (["paid", "betalt"].includes(s)) return "paid";
  if (["reviewed", "anmeldt"].includes(s)) return "reviewed";
  return "open";
}
 
/* Dansk label + farver til pillen */
function statusDisplay(raw) {
  const slug = normalizeStatus(raw);
  switch (slug) {
    case "completed":
      return { label: "Afsluttet", bg: "#EAF3FF", fg: "#0B5FA5" };
    case "paid":
      return { label: "Betalt", bg: "#E6F0FF", fg: "#0A63F6" };
    case "reviewed":
      return { label: "Anmeldt", bg: "#EEF2F7", fg: "#64748B" };
    default:
      return { label: "Ukendt", bg: "#F1F5F9", fg: "#475569" };
  }
}
 
export default function OwnerHistoryScreen() {
  const navigation = useNavigation();
  const uid = auth.currentUser?.uid;
 
  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [refreshing, setRefreshing] = useState(false);
 
  useEffect(() => {
    if (!uid) return;
    const unsub = listenOwnerRequestsSafe(
      uid,
      (list) => {
        setRows(list || []);
        setLoading(false);
      },
      () => setLoading(false)
    );
    return () => unsub?.();
  }, [uid]);
 
  /* Kun historik: afsluttet/betalt/anmeldt */
  const items = useMemo(() => {
    const arr = (rows || []).filter((r) => {
      const slug = normalizeStatus(r.status);
      return ["completed", "paid", "reviewed"].includes(slug);
    });
    const ms = (x) =>
      x?.updated_at?.toMillis?.() ??
      x?.completedAt?.toMillis?.() ??
      x?.payment?.succeededAt?.toMillis?.() ??
      x?.created_at?.toMillis?.() ??
      0;
    return arr.sort((a, b) => ms(b) - ms(a));
  }, [rows]);
 
  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 400);
  }, []);
 
  const goToPayment = useCallback(
    (job) => {
      try {
        const providerId = job?.acceptedProviderId;
        const amount = Number(job?.acceptedPrice || 0);
        if (!providerId || !Number.isFinite(amount) || amount <= 0) {
          return Alert.alert(
            "Manglende info",
            "Betaling kan ikke åbnes – mangler pris eller mekaniker."
          );
        }
        navigation.navigate("OwnerCheckout", {
          jobId: job.id,
          providerId,
          amount,
          ownerId: job.owner_id,
        });
      } catch (e) {
        Alert.alert("Fejl", e?.message || "Kunne ikke åbne betaling.");
      }
    },
    [navigation]
  );
 
  const goToReview = useCallback(
    (job) => {
      navigation.navigate("LeaveReview", {
        jobId: job.id,
        providerId: job.acceptedProviderId,
        ownerId: job.owner_id,
      });
    },
    [navigation]
  );
 
  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
      </View>
    );
  }
 
  if (items.length === 0) {
    return (
      <View style={styles.container}>
        <Text style={styles.title}>Afsluttede opgaver</Text>
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Ingen afsluttede opgaver endnu.</Text>
        </View>
      </View>
    );
  }
 
  const StatusPill = ({ status }) => {
    const { label, bg, fg } = statusDisplay(status);
    return (
      <View style={[styles.pillWrap, { backgroundColor: bg }]}>
        <Text style={[styles.pillText, { color: fg }]}>{label}</Text>
      </View>
    );
  };
 
  const Card = ({ job }) => {
    const slug = normalizeStatus(job.status);
    const isPaid = slug === "paid" || !!job?.payment?.succeededAt;
    const isReviewed = !!job?.reviewGiven;
 
    const canPay =
      slug === "completed" &&
      !isPaid &&
      !!job?.acceptedProviderId &&
      Number.isFinite(Number(job?.acceptedPrice)) &&
      Number(job?.acceptedPrice) > 0;
 
    const canReview =
      !isReviewed &&
      (slug === "completed" || isPaid) &&
      !!job?.acceptedProviderId;
 
    return (
      <View style={styles.card}>
        {/* Titel + status-pill */}
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{job.service_type || "Serviceopgave"}</Text>
          <StatusPill status={job.status} />
        </View>
 
        {/* Pris-linje (ingen "Anmeldt" her – undgår dublet) */}
        <View style={styles.metaRowTop}>
          {Number.isFinite(Number(job.acceptedPrice)) && (
            <Text style={styles.price}>{DKK(job.acceptedPrice)}</Text>
          )}
        </View>
 
        {/* Under status: "Betaling registreret" hvis betalt */}
        {isPaid && (
          <View style={styles.metaBelowStatus}>
            <Text style={styles.badgePaid}>Betaling registreret</Text>
          </View>
        )}
 
        {/* Knapper */}
        <View style={styles.actionsRow}>
          <TouchableOpacity
            onPress={() => navigation.navigate("JobDetail", { jobId: job.id })}
            style={styles.btnSecondary}
          >
            <Text style={styles.btnSecondaryText}>Detaljer</Text>
          </TouchableOpacity>
 
          {canPay && (
            <TouchableOpacity onPress={() => goToPayment(job)} style={styles.btnPrimary}>
              <Text style={styles.btnPrimaryText}>
                Betal nu ({DKK(Number(job.acceptedPrice))})
              </Text>
            </TouchableOpacity>
          )}
 
          {!canPay && canReview && (
            <TouchableOpacity onPress={() => goToReview(job)} style={styles.btnOutline}>
              <Text style={styles.btnOutlineText}>Anmeld mekaniker</Text>
            </TouchableOpacity>
          )}
        </View>
      </View>
    );
  };
 
  return (
    <View style={styles.container}>
      <Text style={styles.title}>Afsluttede opgaver</Text>
      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={({ item }) => <Card job={item} />}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
      />
    </View>
  );
}