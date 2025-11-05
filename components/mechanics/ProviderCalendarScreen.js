import React, { useCallback, useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  ScrollView,
  RefreshControl,
  TouchableOpacity,
  ActivityIndicator,
  Image,
} from "react-native";
import { useNavigation, useFocusEffect } from "@react-navigation/native";
import { Calendar, LocaleConfig } from "react-native-calendars";
import { auth } from "../../firebase";
import { getAssignedJobsForProvider } from "../../services/requestsService";
import styles, { calendarTheme, STATUS_COLORS } from "../../styles/mechanics/providerCalendarStyles";

/* ---------- Dansk lokalisering til kalender ---------- */
LocaleConfig.locales["da"] = {
  monthNames: [
    "januar","februar","marts","april","maj","juni",
    "juli","august","september","oktober","november","december",
  ],
  monthNamesShort: ["jan.","feb.","mar.","apr.","maj","jun.","jul.","aug.","sep.","okt.","nov.","dec."],
  dayNames: ["søndag","mandag","tirsdag","onsdag","torsdag","fredag","lørdag"],
  dayNamesShort: ["søn","man","tir","ons","tor","fre","lør"],
  today: "I dag",
};
LocaleConfig.defaultLocale = "da";

/* ---------- Dato-helpers (robuste) ---------- */
function isValidDate(d) {
  return d instanceof Date && !isNaN(d.getTime());
}
function toDateMaybe(v) {
  if (!v) return null;
  if (typeof v?.toDate === "function") {
    const d = v.toDate();
    return isValidDate(d) ? d : null;
  }
  if (typeof v === "object" && typeof v.seconds === "number") {
    const ms = v.seconds * 1000 + Math.floor((v.nanoseconds || 0) / 1e6);
    const d = new Date(ms);
    return isValidDate(d) ? d : null;
  }
  if (typeof v === "number") {
    const ms = v < 1e12 ? v * 1000 : v;
    const d = new Date(ms);
    return isValidDate(d) ? d : null;
  }
  if (typeof v === "string") {
    const d = new Date(v);
    return isValidDate(d) ? d : null;
  }
  if (v instanceof Date) return isValidDate(v) ? v : null;
  return null;
}
// Vælg “event-dato” for et job: specificTime → deadline → acceptedAt → created_at
function pickEventDate(job) {
  return (
    toDateMaybe(job?.specificTime) ||
    toDateMaybe(job?.deadline) ||
    toDateMaybe(job?.acceptedAt) ||
    toDateMaybe(job?.created_at)
  );
}
function ymd(d) {
  if (!isValidDate(d)) return null;
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

export default function ProviderCalendarScreen() {
  const navigation = useNavigation();
  const uid = auth.currentUser?.uid;

  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [jobs, setJobs] = useState([]);
  const [selectedDate, setSelectedDate] = useState(ymd(new Date()));

  async function load() {
    if (!uid) return;
    setLoading(true);
    try {
      const list = await getAssignedJobsForProvider(uid, 500);
      setJobs(list || []);
    } catch (e) {
      console.log("Kunne ikke hente tildelte jobs:", e);
      setJobs([]);
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    load();
  }, [uid]);

  useFocusEffect(
    useCallback(() => {
      load();
    }, [])
  );

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
    setRefreshing(false);
  }, []);

  // Gruppér jobs pr. dato
  const jobsByDate = useMemo(() => {
    const map = {};
    for (const job of jobs) {
      const d = pickEventDate(job);
      const k = ymd(d) || "__uden_dato";
      if (!map[k]) map[k] = [];
      map[k].push(job);
    }
    Object.keys(map).forEach((k) => {
      map[k].sort((a, b) => {
        const ta = pickEventDate(a)?.getTime?.() || 0;
        const tb = pickEventDate(b)?.getTime?.() || 0;
        return ta - tb;
      });
    });
    return map;
  }, [jobs]);

  // Markeringer i kalenderen (multi-dot pr. dag afhængig af status)
  const markedDates = useMemo(() => {
    const marked = {};
    for (const [dateStr, list] of Object.entries(jobsByDate)) {
      if (dateStr === "__uden_dato") continue;
      const statusSet = new Set(list.map((j) => String(j.status || "").toLowerCase()));

      const dots = [];
      for (const s of statusSet) {
        const color = STATUS_COLORS[s] || "#6B7280";
        dots.push({ key: s, color });
      }
      marked[dateStr] = { dots };
    }

    if (selectedDate) {
      marked[selectedDate] = {
        ...(marked[selectedDate] || {}),
        selected: true,
        selectedColor: "#111827",
      };
    }
    return marked;
  }, [jobsByDate, selectedDate]);

  const listForSelectedDay = useMemo(
    () => jobsByDate[selectedDate] || [],
    [jobsByDate, selectedDate]
  );

  if (loading) {
    return (
      <View style={styles.centered}>
        <ActivityIndicator />
        <Text style={styles.centeredText}>Henter kalender…</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.screen}
      contentContainerStyle={[styles.container, { paddingBottom: 24 }]}
      refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
    >
      <Text style={styles.title}>Min kalender</Text>

      {/* LEGEND */}
      <View style={styles.legendWrap}>
        <LegendDot color={STATUS_COLORS.assigned} label="Tildelt" />
        <LegendDot color={STATUS_COLORS.in_progress} label="I gang" />
        <LegendDot color={STATUS_COLORS.completed} label="Færdig" />
      </View>

      {/* KALENDER */}
      <View style={styles.calendarWrap}>
        <Calendar
          markingType="multi-dot"
          markedDates={markedDates}
          onDayPress={(day) => setSelectedDate(day.dateString)}
          firstDay={1}
          enableSwipeMonths
          theme={calendarTheme}
        />
      </View>

      {/* DAGSLISTE */}
      <View style={styles.dayListWrap}>
        <Text style={styles.dateHeading}>
          {selectedDate ? selectedDate : "Uden dato"}
        </Text>

        {listForSelectedDay.length === 0 ? (
          <Text style={styles.emptyDayText}>Ingen opgaver denne dag.</Text>
        ) : (
          <View style={styles.dayItems}>
            {listForSelectedDay.map((job) => {
              const d = pickEventDate(job);
              const timeLabel = d
                ? `${String(d.getHours()).padStart(2, "0")}:${String(
                    d.getMinutes()
                  ).padStart(2, "0")}`
                : "—";
              const imageUri =
                job.imageUrl || job.imageURL || job.photoURL || job.image || null;
              const status = String(job.status || "").toLowerCase();

              return (
                <TouchableOpacity
                  key={job.id}
                  onPress={() => navigation.navigate("JobDetail", { jobId: job.id })}
                  style={styles.dayItem}
                >
                  <View style={styles.dayItemHeader}>
                    <Text style={styles.dayItemTitle}>
                      {job.service_type || "Serviceopgave"}
                    </Text>
                    <Text style={styles.dayItemTime}>{timeLabel}</Text>
                  </View>

                  <Text style={styles.dayItemDesc} numberOfLines={2}>
                    {job.description || "—"}
                  </Text>

                  <View style={styles.dayItemMetaRow}>
                    <StatusPill status={status} />
                    {job.location && (
                      <Text style={styles.dayItemLocation} numberOfLines={1}>
                        {typeof job.location === "string" ? job.location : "Se detaljer"}
                      </Text>
                    )}
                  </View>

                  {imageUri ? (
                    <View style={styles.dayItemImageWrap}>
                      <Image
                        source={{ uri: imageUri }}
                        style={styles.dayItemImage}
                        resizeMode="cover"
                      />
                    </View>
                  ) : null}
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>
    </ScrollView>
  );
}

/* ---------- Små UI-komponenter ---------- */
function LegendDot({ color, label }) {
  return (
    <View style={styles.legendItem}>
      <View style={[styles.legendDot, { backgroundColor: color }]} />
      <Text style={styles.legendLabel}>{label}</Text>
    </View>
  );
}

function StatusPill({ status }) {
  const color = STATUS_COLORS[status] || "#6B7280";
  return (
    <Text style={[styles.statusPill, { color }]}>
      {status || "ukendt"}
    </Text>
  );
}
