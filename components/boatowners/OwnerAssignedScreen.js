// /components/boatowners/OwnerAssignedScreen.js
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
import { auth } from "../../firebase";
import { listenOwnerRequestsSafe } from "../../services/requestsService"; // safe-lytter uden index-krav

function DKK(n) {
  return typeof n === "number"
    ? new Intl.NumberFormat("da-DK", {
        style: "currency",
        currency: "DKK",
        maximumFractionDigits: 0,
      }).format(n)
    : "—";
}

export default function OwnerAssignedScreen() {
  const navigation = useNavigation();
  const uid = auth.currentUser?.uid;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [items, setItems] = useState([]);
  const [err, setErr] = useState("");

  // Live-lyt alle ejerens requests (uden ekstra where/orderBy → undgår index-krav)
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

  const onRefresh = useCallback(async () => {
    // Vi bruger live-lyt – refresher kosmetisk
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 500);
  }, []);

  // Split på aktive/afsluttede (exclude "open")
  const { active, completed } = useMemo(() => {
    const act = [];
    const done = [];
    for (const r of items) {
      const s = String(r.status || "").toLowerCase();
      if (s === "completed" || s === "done" || s === "closed" || s === "paid") {
        // "paid" regner vi som afsluttet i UI-listen
        done.push(r);
      } else if (s !== "open") {
        act.push(r); // assigned / in_progress / andet
      }
    }
    // sortér nyeste opdaterede først (fallback created_at)
    const getMs = (x) =>
      x?.updated_at?.toMillis?.() ??
      x?.acceptedAt?.toMillis?.() ??
      x?.created_at?.toMillis?.() ??
      0;
    act.sort((a, b) => getMs(b) - getMs(a));
    done.sort((a, b) => getMs(b) - getMs(a));
    return { active: act, completed: done };
  }, [items]);

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

  function openDetail(job) {
    navigation.navigate("JobDetail", { jobId: job.id });
  }

  function goToPayment(job) {
    try {
      const providerId = job?.acceptedProviderId;
      const amount = typeof job?.acceptedPrice === "number" ? job.acceptedPrice : Number(job?.acceptedPrice || 0);
      if (!providerId || !Number.isFinite(amount) || amount <= 0) {
        return Alert.alert("Manglende info", "Betaling kan ikke åbnes – mangler pris eller mekaniker.");
      }
      navigation.navigate("OwnerCheckout", {
        jobId: job.id,
        providerId,
        amount, // DKK (hele kroner)
      });
    } catch (e) {
      Alert.alert("Fejl", e?.message || "Kunne ikke åbne betaling.");
    }
  }

  function openReview(job) {
    const isPaid = String(job.status || "").toLowerCase() === "paid" ||
                   !!job?.payment?.succeededAt ||
                   !!job?.payment?.clientMarkedPaid;
    const canReview =
      String(job.status || "").toLowerCase() === "completed" && // opgaven er markeret afsluttet
      isPaid &&                                                 // og der er betalt
      !!job.acceptedProviderId &&
      !job.reviewGiven;

    if (!canReview) {
      return Alert.alert("Ikke klar", "Denne opgave kan ikke anmeldes endnu.");
    }
    navigation.navigate("LeaveReview", {
      jobId: job.id,
      providerId: job.acceptedProviderId,
      ownerId: job.owner_id,
    });
  }

  const StatusPill = ({ status }) => {
    const s = String(status || "").toLowerCase();
    const color =
      s === "paid"
        ? "#0EA5E9"
        : s === "completed" || s === "done"
        ? "#10B981"
        : s === "in_progress"
        ? "#F59E0B"
        : s === "assigned"
        ? "#0A84FF"
        : "#6B7280";
    return (
      <Text
        style={{
          paddingVertical: 2,
          paddingHorizontal: 8,
          backgroundColor: "#F3F4F6",
          borderRadius: 8,
          color,
          fontWeight: "600",
          textTransform: "capitalize",
        }}
      >
        {s || "ukendt"}
      </Text>
    );
  };

  const JobCard = ({ job, showReviewButton = false }) => {
    const img = job.image || job.imageUrl || job.imageURL || job.photoURL || null;

    // Betalt?
    const isPaid =
      String(job.status || "").toLowerCase() === "paid" ||
      !!job?.payment?.succeededAt ||
      !!job?.payment?.clientMarkedPaid;

    // Kan vi betale nu? (tildelt/afsluttet, men ikke betalt, og pris/mekaniker findes)
    const statusStr = String(job.status || "").toLowerCase();
    const canPay =
      (statusStr === "assigned" || statusStr === "completed") &&
      !isPaid &&
      !!job?.acceptedProviderId &&
      Number.isFinite(Number(job?.acceptedPrice)) &&
      Number(job?.acceptedPrice) > 0;

    // Kan vi anmelde? (afsluttet + betalt + ikke anmeldt)
    const canReview =
      showReviewButton &&
      statusStr === "completed" &&
      isPaid &&
      !!job.acceptedProviderId &&
      !job.reviewGiven;

    return (
      <View
        style={{
          borderWidth: 1,
          borderColor: "#E5E7EB",
          borderRadius: 12,
          padding: 12,
          backgroundColor: "white",
        }}
      >
        <View
          style={{
            flexDirection: "row",
            justifyContent: "space-between",
            alignItems: "center",
            marginBottom: 6,
          }}
        >
          <Text style={{ fontWeight: "700", fontSize: 16 }}>
            {job.service_type || "Serviceopgave"}
          </Text>
          <StatusPill status={job.status} />
        </View>

        {job.description ? (
          <Text style={{ color: "#6B7280" }} numberOfLines={2}>
            {job.description}
          </Text>
        ) : null}

        <View style={{ flexDirection: "row", gap: 12, marginTop: 8, alignItems: "center" }}>
          {typeof job.acceptedPrice === "number" && (
            <Text style={{ fontWeight: "600" }}>{DKK(job.acceptedPrice)}</Text>
          )}
          {job.location && (
            <Text style={{ color: "#444" }} numberOfLines={1}>
              {typeof job.location === "string" ? job.location : "Se detaljer"}
            </Text>
          )}
        </View>

        {img ? (
          <View style={{ marginTop: 10, borderRadius: 10, overflow: "hidden" }}>
            <Image source={{ uri: img }} style={{ width: "100%", height: 120 }} resizeMode="cover" />
          </View>
        ) : null}

        <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
          <TouchableOpacity
            onPress={() => openDetail(job)}
            style={{
              flex: 1,
              backgroundColor: "#111827",
              paddingVertical: 10,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>Detaljer</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={() => openChat(job)}
            style={{
              flex: 1,
              backgroundColor: "#0A84FF",
              paddingVertical: 10,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>Åbn chat</Text>
          </TouchableOpacity>
        </View>

        {/* BETAL NU – vises kun når muligt */}
        {canPay && (
          <TouchableOpacity
            onPress={() => goToPayment(job)}
            style={{
              marginTop: 10,
              backgroundColor: "#0A84FF",
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>
              Betal nu ({DKK(Number(job.acceptedPrice))})
            </Text>
          </TouchableOpacity>
        )}

        {/* ANMELD – kun når afsluttet og betalt */}
        {canReview && (
          <TouchableOpacity
            onPress={() => openReview(job)}
            style={{
              marginTop: 10,
              backgroundColor: "#10B981",
              paddingVertical: 12,
              borderRadius: 10,
              alignItems: "center",
            }}
          >
            <Text style={{ color: "white", fontWeight: "700" }}>Anmeld mekaniker</Text>
          </TouchableOpacity>
        )}
      </View>
    );
  };

  if (loading) {
    return (
      <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8 }}>Henter opgaver…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={{ flex: 1, backgroundColor: "white" }}
      contentContainerStyle={{ padding: 16, gap: 16 }}
      refreshControl={
        <RefreshControl refreshing={refreshing} onRefresh={onRefresh} />
      }
    >
      <Text style={{ fontSize: 22, fontWeight: "800" }}>Mine igangværende opgaver</Text>

      {/* Aktive */}
      <Text style={{ marginTop: 4, fontWeight: "700", fontSize: 16 }}>Aktive</Text>
      {active.length === 0 ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: "#E5E7EB",
            borderRadius: 12,
            padding: 16,
            backgroundColor: "#F9FAFB",
          }}
        >
          <Text style={{ color: "#6B7280" }}>
            Du har ingen aktive opgaver lige nu.
          </Text>
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

      {/* Afsluttede */}
      <Text style={{ marginTop: 16, fontWeight: "700", fontSize: 16 }}>Afsluttede</Text>
      {completed.length === 0 ? (
        <View
          style={{
            borderWidth: 1,
            borderColor: "#E5E7EB",
            borderRadius: 12,
            padding: 16,
            backgroundColor: "#F9FAFB",
          }}
        >
          <Text style={{ color: "#6B7280" }}>
            Du har ingen afsluttede opgaver endnu.
          </Text>
        </View>
      ) : (
        <FlatList
          data={completed}
          keyExtractor={(it) => it.id}
          renderItem={({ item }) => <JobCard job={item} showReviewButton />}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
          scrollEnabled={false}
        />
      )}

      {!!err && (
        <Text style={{ color: "red", marginTop: 8 }}>
          Fejl: {err}
        </Text>
      )}
    </ScrollView>
  );
}