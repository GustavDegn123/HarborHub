import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, FlatList, ActivityIndicator, TouchableOpacity } from "react-native";
import { getAuth } from "firebase/auth";
import { db } from "../../firebase";
import { collection, onSnapshot, query, orderBy, doc, getDoc } from "firebase/firestore";
import styles from "../../styles/mechanics/assignedJobsStyles";

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

export default function AssignedJobsScreen({ navigation }) {
  const uid = getAuth().currentUser?.uid;

  const [loading, setLoading] = useState(true);
  const [rows, setRows] = useState([]);
  const [jobsMap, setJobsMap] = useState({});

  // service id -> name map
  const [serviceNameById, setServiceNameById] = useState({});

  // 1) Hent service-katalog (til visning)
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
      "Opgave",
    [serviceNameById]
  );

  // 2) Lyt på providers/{uid}/assigned_jobs
  useEffect(() => {
    if (!uid) {
      setLoading(false);
      setRows([]);
      return;
    }

    const qRef = query(
      collection(db, "providers", uid, "assigned_jobs"),
      orderBy("assigned_at", "desc")
    );

    const off = onSnapshot(
      qRef,
      (snap) => {
        const list = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
        setRows(list);
        setLoading(false);
      },
      (err) => {
        console.warn("assigned_jobs listener error:", err);
        setLoading(false);
      }
    );

    return off;
  }, [uid]);

  // 3) Hent de tilhørende service_requests docs (for titel/desc osv.)
  useEffect(() => {
    let alive = true;

    (async () => {
      const missing = rows
        .map((r) => r.job_id || r.id)
        .filter((jobId) => jobId && !jobsMap[jobId]);

      if (missing.length === 0) return;

      const entries = {};
      for (const jobId of missing) {
        try {
          const snap = await getDoc(doc(db, "service_requests", jobId));
          if (snap.exists()) entries[jobId] = { id: snap.id, ...snap.data() };
        } catch (e) {
          console.warn("fetch service_request failed:", jobId, e?.message || e);
        }
      }

      if (alive && Object.keys(entries).length) {
        setJobsMap((prev) => ({ ...prev, ...entries }));
      }
    })();

    return () => {
      alive = false;
    };
  }, [rows]); // eslint-disable-line react-hooks/exhaustive-deps

  const items = useMemo(() => {
    const enriched = rows.map((r) => {
      const jobId = r.job_id || r.id;
      const job = jobsMap[jobId] || null;

      const status = String(r.status || job?.status || "").toLowerCase();
      const inProgress = status === "in_progress";
      const assigned = status === "assigned";

      const price =
        Number.isFinite(Number(r.price))
          ? Number(r.price)
          : Number.isFinite(Number(job?.acceptedPrice))
          ? Number(job.acceptedPrice)
          : Number.isFinite(Number(job?.budget))
          ? Number(job.budget)
          : null;

      return {
        key: jobId,
        status,
        inProgress,
        assigned,
        title: serviceTitle(job),
        description: job?.description || "",
        owner_id: job?.owner_id,
        acceptedPrice: price,
        job,
      };
    });

    const visible = enriched.filter((x) => x.assigned || x.inProgress);

    visible.sort((a, b) => {
      const ra = rows.find((r) => (r.job_id || r.id) === a.key);
      const rb = rows.find((r) => (r.job_id || r.id) === b.key);
      const ta = ra?.assigned_at?.toMillis?.() || a.job?.updated_at?.toMillis?.() || 0;
      const tb = rb?.assigned_at?.toMillis?.() || b.job?.updated_at?.toMillis?.() || 0;
      return tb - ta;
    });

    return visible;
  }, [rows, jobsMap, serviceTitle]);

  const openDetails = (jobId) => navigation.navigate("JobDetail", { jobId });

  const openChat = (job) =>
    navigation.navigate("Chat", {
      jobId: job.id,
      ownerId: job.owner_id,
      providerId: uid,
      otherName: "Bådejer",
    });

  if (loading) {
    return (
      <View style={styles.loader}>
        <ActivityIndicator />
        <Text style={styles.loaderText}>Henter mine opgaver…</Text>
      </View>
    );
  }

  if (items.length === 0) {
    return (
      <View style={styles.screen}>
        <View style={styles.emptyWrap}>
          <Text style={styles.emptyTitle}>Ingen opgaver</Text>
          <Text style={styles.emptySubtitle}>
            Når du bliver tildelt en opgave, vises den her indtil den er afsluttet.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.screen}>
      <FlatList
        data={items}
        keyExtractor={(it) => it.key}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => (
          <View style={styles.card}>
            <Text style={styles.cardTitle}>
              {item.title} {item.inProgress ? "⏳ (I gang)" : ""}
            </Text>

            {Number.isFinite(Number(item.acceptedPrice)) && (
              <Text style={styles.cardBudget}>{DKK(item.acceptedPrice)}</Text>
            )}

            {!!item.description && (
              <Text style={styles.cardDesc} numberOfLines={2}>
                {item.description}
              </Text>
            )}

            <View style={styles.rowButtons}>
              <TouchableOpacity style={styles.btnDark} onPress={() => openDetails(item.key)}>
                <Text style={styles.btnDarkText}>Detaljer</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.btnPrimary}
                onPress={() => (item.job ? openChat(item.job) : null)}
                disabled={!item.job}
              >
                <Text style={styles.btnPrimaryText}>
                  {item.job ? "Åbn chat" : "Henter…"}
                </Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      />
    </View>
  );
}
