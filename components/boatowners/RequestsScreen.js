// components/boatowners/RequestsScreen.js
import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  ActivityIndicator,
  FlatList,
  TouchableOpacity,
  RefreshControl,
} from "react-native";
import { useNavigation } from "@react-navigation/native";
import { doc, getDoc } from "firebase/firestore";
import { auth, db } from "../../firebase";
import styles from "../../styles/boatowners/requestsStyles";
import {
  listenOwnerRequestsSafe,
  listenBidsCount,
} from "../../services/requestsService";
import { watchBidsForJobs } from "../../services/bidNotificationWatcher";

/* ---------- Helpers ---------- */
const ts = (v) => {
  if (!v) return 0;
  try {
    if (typeof v.toMillis === "function") return v.toMillis();
    const d = typeof v.toDate === "function" ? v.toDate() : v;
    const date = d instanceof Date ? d : new Date(d);
    const t = date.getTime();
    return Number.isFinite(t) ? t : 0;
  } catch {
    return 0;
  }
};

const DKK = (n) =>
  typeof n === "number"
    ? new Intl.NumberFormat("da-DK", {
        style: "currency",
        currency: "DKK",
        maximumFractionDigits: 0,
      }).format(n)
    : "—";

/* Deadlines -> dansk label */
const deadlineLabel = (req) => {
  const t = req?.deadlineType;
  if (!t || t === "Fleksibel") return "Fleksibel";
  try {
    const d = req?.deadline?.toDate ? req.deadline.toDate() : new Date(req.deadline);
    if (!(d instanceof Date) || isNaN(d)) return t;
    const dateStr = d.toLocaleDateString("da-DK");
    return t === "Før Dato" ? `Senest ${dateStr}` : `${dateStr}`;
  } catch {
    return t;
  }
};

/* ---------- Status: normalisering + danske labels ---------- */
function normalizeStatus(raw) {
  const s = String(raw || "").trim().toLowerCase();
  // engelske varianter
  if (["open"].includes(s)) return "open";
  if (["assigned"].includes(s)) return "assigned";
  if (["in_progress", "in-progress"].includes(s)) return "in_progress";
  if (["completed"].includes(s)) return "completed";
  if (["paid"].includes(s)) return "paid";
  if (["reviewed"].includes(s)) return "reviewed";
  // danske varianter
  if (["åben", "aben", "aaben"].includes(s)) return "open";
  if (["tildelt"].includes(s)) return "assigned";
  if (["i_gang", "i-gang", "igang"].includes(s)) return "in_progress";
  if (["afsluttet"].includes(s)) return "completed";
  if (["betalt"].includes(s)) return "paid";
  if (["anmeldt"].includes(s)) return "reviewed";
  return "open";
}

function statusDisplay(raw) {
  const slug = normalizeStatus(raw);
  switch (slug) {
    case "open":
      return { label: "Åben", styleKey: "open" };
    case "assigned":
      return { label: "Tildelt", styleKey: "assigned" };
    case "in_progress":
      return { label: "I gang", styleKey: "in_progress" };
    case "completed":
      return { label: "Afsluttet (afventer betaling)", styleKey: "completed" };
    case "paid":
      return { label: "Betalt (afventer anmeldelse)", styleKey: "paid" };
    case "reviewed":
      return { label: "Afsluttet & anmeldt", styleKey: "reviewed" };
    default:
      return { label: "Ukendt", styleKey: "unknown" };
  }
}

/** Bud er accepteret/tildelt -> vis “tildelt”-tekster */
const isAwardedStatus = (status) => {
  const slug = normalizeStatus(status);
  return ["assigned", "in_progress", "completed", "paid"].includes(slug);
};

/* ---------- Service katalog helpers ---------- */
function flattenLeaves(nodes, acc = []) {
  if (!Array.isArray(nodes)) return acc;
  for (const n of nodes) {
    if (Array.isArray(n?.children) && n.children.length) {
      flattenLeaves(n.children, acc);
    } else if (n?.id && n?.name) {
      acc.push({ id: String(n.id), name: String(n.name) });
    }
  }
  return acc;
}

export default function RequestsScreen() {
  const navigation = useNavigation();

  const [rows, setRows] = useState(null);
  const [refreshing, setRefreshing] = useState(false);

  const [serviceNameById, setServiceNameById] = useState({});

  const bidUnsubsRef = useRef(new Map());
  const stopBidsWatchRef = useRef(null); // stop-funktion til lokal-notifikations-watcher

  /* Hent service-katalog (id -> name) fra Firestore */
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
      } catch (e) {
        if (alive) setServiceNameById({});
      }
    })();

    return () => {
      alive = false;
    };
  }, []);

  const serviceTitle = useCallback(
    (item) =>
      item?.service_name ||
      serviceNameById[item?.service_type] ||
      item?.service_type ||
      "Serviceopgave",
    [serviceNameById]
  );

  /* Lyt til ejerens requests */
  useEffect(() => {
    const ownerId = auth.currentUser?.uid;
    if (!ownerId) {
      setRows([]);
      return;
    }

    const unsub = listenOwnerRequestsSafe(
      ownerId,
      (list) => setRows((list || []).map((r) => ({ ...r }))),
      () => setRows([])
    );

    return () => {
      unsub?.();
      bidUnsubsRef.current.forEach((u) => u?.());
      bidUnsubsRef.current.clear();

      stopBidsWatchRef.current?.();
      stopBidsWatchRef.current = null;
    };
  }, []);

  /* Lyt til antal bud pr. request (UI badge) */
  useEffect(() => {
    if (!Array.isArray(rows)) return;

    const next = new Map(bidUnsubsRef.current);

    rows.forEach((r) => {
      if (!r?.id) return;
      if (!next.has(r.id)) {
        const u = listenBidsCount(r.id, (n) => {
          setRows((prev) =>
            Array.isArray(prev)
              ? prev.map((it) => (it.id === r.id ? { ...it, bidsCount: n } : it))
              : prev
          );
        });
        next.set(r.id, u);
      }
    });

    // oprydning for fjernede jobs
    for (const [jobId, u] of next.entries()) {
      if (!rows.find((x) => x.id === jobId)) {
        u?.();
        next.delete(jobId);
      }
    }

    bidUnsubsRef.current = next;
  }, [rows?.length]);

  /* Start/Genstart lokal-notifikations-watcher for aktive jobs */
  useEffect(() => {
    if (!Array.isArray(rows)) return;

    const activeJobIds = rows
      .filter((r) => !["reviewed", "completed"].includes(normalizeStatus(r?.status)))
      .map((r) => r.id);

    stopBidsWatchRef.current?.();
    stopBidsWatchRef.current =
      activeJobIds.length > 0 ? watchBidsForJobs(activeJobIds) : null;
  }, [rows?.map?.((r) => `${r.id}|${r.status}`).join(",")]);

  /* Filtrér/Sorter (skjul “reviewed”/“anmeldt”) */
  const items = useMemo(() => {
    if (!Array.isArray(rows)) return null;

    const filtered = rows.filter((r) => normalizeStatus(r?.status) !== "reviewed");
    filtered.sort(
      (a, b) =>
        Math.max(ts(b.updated_at), ts(b.created_at)) -
        Math.max(ts(a.updated_at), ts(a.created_at))
    );
    return filtered;
  }, [rows]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    setTimeout(() => setRefreshing(false), 450);
  }, []);

  const renderStatusChip = (status) => {
    const { label, styleKey } = statusDisplay(status);
    const key = `st_${styleKey}`;
    return (
      <View style={[styles.statusChip, styles[key] || styles.st_unknown]}>
        <Text style={styles.statusChipText}>{label}</Text>
      </View>
    );
  };

  const renderItem = ({ item }) => {
    const bidsCount = Number(item?.bidsCount) || 0;
    const loc = item?.location?.label || "";
    const awarded = isAwardedStatus(item?.status);

    return (
      <TouchableOpacity
        style={styles.card}
        onPress={() => navigation.navigate("RequestBids", { jobId: item.id })}
      >
        <View style={styles.cardHeader}>
          <Text style={styles.cardTitle}>{serviceTitle(item)}</Text>
          {renderStatusChip(item?.status)}
        </View>

        {!!item?.description && (
          <Text style={styles.description} numberOfLines={3}>
            {item.description}
          </Text>
        )}

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Budget</Text>
          <Text style={styles.metaValue}>{DKK(Number(item?.budget))}</Text>
        </View>

        <View style={styles.metaRow}>
          <Text style={styles.metaLabel}>Deadline</Text>
          <Text style={styles.metaValue}>{deadlineLabel(item)}</Text>
        </View>

        {loc ? (
          <View style={styles.metaRow}>
            <Text style={styles.metaLabel}>Placering</Text>
            <Text style={styles.metaValue} numberOfLines={1}>
              {loc}
            </Text>
          </View>
        ) : null}

        <View style={styles.footerRow}>
          <Text style={styles.bidsText}>
            {awarded
              ? "Bud accepteret – tildelt"
              : bidsCount > 0
              ? bidsCount === 1
                ? "1 bud"
                : `${bidsCount} bud`
              : "Ingen bud endnu"}
          </Text>
          <Text style={styles.link}>{awarded ? "Se buddet ›" : "Se bud ›"}</Text>
        </View>
      </TouchableOpacity>
    );
  };

  if (items === null) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.center}>
        <Text style={styles.emptyText}>Du har ingen opgaver lige nu.</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Mine serviceopgaver</Text>
      <FlatList
        data={items}
        keyExtractor={(it) => it.id}
        renderItem={renderItem}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={{ paddingBottom: 16 }}
      />
    </View>
  );
}
