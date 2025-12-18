// components/boatowners/OwnerAssignedScreen.js
import React, { useEffect, useMemo, useState, useCallback } from "react";
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  ActivityIndicator,
  RefreshControl,
  Alert,
  Image,
  ScrollView,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import { listenOwnerRequestsSafe } from "../../services/requestsService";
import styles from "../../styles/boatowners/ownerAssignedStyles";

/* ---------- Helpers ---------- */
function DKK(n) {
  return Number.isFinite(Number(n))
    ? new Intl.NumberFormat("da-DK", {
        style: "currency",
        currency: "DKK",
        maximumFractionDigits: 0,
      }).format(Number(n))
    : "—";
}

const ts = (v) =>
  (v && typeof v.toMillis === "function"
    ? v.toMillis()
    : new Date(v || 0).getTime()) || 0;

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

/* ---------- Status-normalisering & danske labels ---------- */
function normalizeStatus(raw) {
  const s = String(raw || "").trim().toLowerCase();
  // Engelsk
  if (s === "open") return "open";
  if (s === "assigned") return "assigned";
  if (s === "in_progress" || s === "in-progress") return "in_progress";
  if (s === "completed" || s === "done" || s === "closed") return "completed";
  if (s === "paid") return "paid";
  if (s === "reviewed") return "reviewed";
  // Dansk
  if (s === "åben" || s === "aaben" || s === "aben") return "open";
  if (s === "tildelt") return "assigned";
  if (s === "i_gang" || s === "igang" || s === "i-gang") return "in_progress";
  if (s === "afsluttet") return "completed";
  if (s === "betalt") return "paid";
  if (s === "anmeldt") return "reviewed";
  return "open";
}

function statusDisplay(raw) {
  const slug = normalizeStatus(raw);
  switch (slug) {
    case "open":
      return { label: "Åben", color: "#6B7280", slug };
    case "assigned":
      return { label: "Tildelt", color: "#0A84FF", slug };
    case "in_progress":
      return { label: "I gang", color: "#F59E0B", slug };
    case "completed":
      return { label: "Afsluttet", color: "#10B981", slug };
    case "paid":
      return { label: "Betalt", color: "#0EA5E9", slug };
    case "reviewed":
      return { label: "Afsluttet & anmeldt", color: "#0EA5E9", slug };
    default:
      return { label: "Ukendt", color: "#6B7280", slug: "unknown" };
  }
}

export default function OwnerAssignedScreen() {
  const navigation = useNavigation();
  const uid = auth.currentUser?.uid;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

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

  const serviceTitle = useCallback(
    (job) =>
      job?.service_name ||
      serviceNameById[job?.service_type] ||
      job?.service_type ||
      "Serviceopgave",
    [serviceNameById]
  );

  useEffect(() => {
    if (!uid) return;
    setLoading(true);
    const unsub = listenOwnerRequestsSafe(
      uid,
      (rows) => {
        setItems(rows || []);
        setLoading(false);
      },
      (e) => {
        setErr(e?.message || String(e));
        setLoading(false);
      }
    );
    return () => unsub && unsub();
  }, [uid]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  // Kun aktive: alt der ikke er open/completed/paid/reviewed
  const { active } = useMemo(() => {
    const act = [];
    for (const r of items) {
      const slug = normalizeStatus(r.status);
      if (!["open", "completed", "paid", "reviewed"].includes(slug)) {
        act.push(r);
      }
    }
    const score = (x) =>
      Math.max(ts(x.updated_at), ts(x.acceptedAt), ts(x.created_at));
    act.sort((a, b) => score(b) - score(a));
    return { active: act };
  }, [items]);

  const StatusPill = ({ status }) => {
    const { label, color } = statusDisplay(status);
    return <Text style={[styles.statusPill, { color }]}>{label}</Text>;
  };

  function openChat(job) {
    try {
      const ownerId = job?.owner_id;
      const providerId = job?.acceptedProviderId;
      if (!ownerId || !providerId) {
        return Alert.alert(
          "Chat ikke tilgængelig",
          "Chatten er først tilgængelig, når opgaven er tildelt."
        );
      }
      navigation.navigate("Chat", {
        jobId: job.id,
        ownerId,
        providerId,
        otherName: "Mekaniker",
      });
    } catch (e) {
      setErr(e?.message || String(e));
    }
  }

  const openDetail = (job) =>
    navigation.navigate("JobDetail", { jobId: job.id, viewAs: "owner" });

  const goToPayment = (job) => {
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
  };

  const openReview = (job) => {
    const slug = normalizeStatus(job.status);
    const isPaid = slug === "paid" || !!job?.payment?.succeededAt;
    const canReview =
      slug === "completed" && isPaid && !!job.acceptedProviderId && !job.reviewGiven;

    if (!canReview) {
      return Alert.alert("Ikke klar", "Denne opgave kan ikke anmeldes endnu.");
    }
    navigation.navigate("LeaveReview", {
      jobId: job.id,
      providerId: job.acceptedProviderId,
      ownerId: job.owner_id,
    });
  };

  const NextStep = ({ job }) => {
    const slug = normalizeStatus(job.status);
    const isPaid = slug === "paid" || !!job?.payment?.succeededAt;

    if (slug === "completed" && !isPaid) {
      return (
        <View style={[styles.nextBox, styles.nextInfo]}>
          <Text style={styles.nextInfoTitle}>
            Jobbet er afsluttet – klar til betaling
          </Text>
          <TouchableOpacity onPress={() => goToPayment(job)} style={styles.btnPrimary}>
            <Text style={styles.btnPrimaryText}>
              Betal nu ({DKK(Number(job.acceptedPrice))})
            </Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (isPaid && !job.reviewGiven) {
      return (
        <View style={[styles.nextBox, styles.nextSuccess]}>
          <Text style={styles.nextSuccessTitle}>
            Betaling registreret – vil du anmelde mekanikeren?
          </Text>
          <TouchableOpacity onPress={() => openReview(job)} style={styles.btnSuccess}>
            <Text style={styles.btnSuccessText}>Giv anmeldelse</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <View style={[styles.nextBox, styles.nextNeutral]}>
        <Text style={styles.nextNeutralText}>
          {slug === "assigned"
            ? "Afventer at mekanikeren starter opgaven."
            : slug === "in_progress"
            ? "Opgaven er i gang."
            : isPaid
            ? "Betalt. Tak! 🙌"
            : "Status opdateres automatisk."}
        </Text>
      </View>
    );
  };

  const JobCard = ({ job, showReviewButton = false }) => {
    const img = job.image || job.imageUrl || job.imageURL || job.photoURL || null;
    const slug = normalizeStatus(job.status);
    const isPaid = slug === "paid" || !!job?.payment?.succeededAt;

    const canPay =
      slug === "completed" &&
      !isPaid &&
      !!job?.acceptedProviderId &&
      Number.isFinite(Number(job?.acceptedPrice)) &&
      Number(job?.acceptedPrice) > 0;

    const canReview =
      showReviewButton &&
      slug === "completed" &&
      isPaid &&
      !!job.acceptedProviderId &&
      !job.reviewGiven;

    return (
      <View style={styles.card}>
        <View style={styles.cardHeaderRow}>
          <Text style={styles.cardTitle}>{serviceTitle(job)}</Text>
          <StatusPill status={job.status} />
        </View>

        {job.description ? (
          <Text style={styles.cardDescription} numberOfLines={2}>
            {job.description}
          </Text>
        ) : null}

        <View style={styles.infoRow}>
          {Number.isFinite(Number(job.acceptedPrice)) && (
            <Text style={styles.price}>{DKK(Number(job.acceptedPrice))}</Text>
          )}
        </View>

        {img && (
          <View style={styles.imageWrap}>
            <Image source={{ uri: img }} style={styles.image} resizeMode="cover" />
          </View>
        )}

        <NextStep job={job} />

        <View style={styles.actionsRow}>
          <TouchableOpacity onPress={() => openDetail(job)} style={styles.btnDark}>
            <Text style={styles.btnDarkText}>Detaljer</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={() => openChat(job)} style={styles.btnPrimary}>
            <Text style={styles.btnPrimaryText}>Åbn chat</Text>
          </TouchableOpacity>
        </View>

        {canPay && (
          <TouchableOpacity onPress={() => goToPayment(job)} style={styles.btnPrimaryLarge}>
            <Text style={styles.btnPrimaryText}>
              Betal nu ({DKK(Number(job.acceptedPrice))})
            </Text>
          </TouchableOpacity>
        )}

        {canReview && (
          <TouchableOpacity onPress={() => openReview(job)} style={styles.btnSuccess}>
            <Text style={styles.btnSuccessText}>Anmeld mekaniker</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
        <Text style={styles.loaderText}>Henter opgaver…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      contentContainerStyle={styles.contentContainer}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Mine igangværende opgaver</Text>

      <Text style={styles.sectionTitle}>Aktive</Text>

      {active.length === 0 ? (
        <View style={styles.emptyCard}>
          <Text style={styles.emptyText}>Du har ingen aktive opgaver lige nu.</Text>
        </View>
      ) : (
        <FlatList
          data={active}
          keyExtractor={(it) => it.id}
          renderItem={({ item }) => <JobCard job={item} />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          scrollEnabled={false}
        />
      )}

      {!!err && <Text style={styles.errorText}>Fejl: {err}</Text>}
    </ScrollView>
  );
}
