import { StyleSheet } from "react-native";

/* Farver til status-dots og -labels (eksporteres så komponenten kan bruge dem) */
export const STATUS_COLORS = {
  assigned: "#0A84FF",     // blå
  in_progress: "#F59E0B",  // orange
  completed: "#10B981",    // grøn
  done: "#10B981",
  open: "#6B7280",         // grå fallback
};

/* Kalender-tema (eksporteres og gives direkte til <Calendar theme={...} />) */
export const calendarTheme = {
  todayTextColor: "#0A84FF",
  arrowColor: "#111827",
  textDayFontFamily: "System",
  textMonthFontFamily: "System",
  textDayHeaderFontFamily: "System",
};

const colors = {
  bg: "#F6F8FB",
  text: "#0f172a",
  muted: "#666",
  border: "#e5e7eb",
  cardBg: "#ffffff",
  subtle: "#F3F4F6",
};

export default StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: { paddingHorizontal: 16 },

  centered: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.bg,
  },
  centeredText: { marginTop: 8, color: colors.muted },

  title: {
    fontSize: 20,
    fontWeight: "800",
    color: colors.text,
    marginTop: 10,
  },

  /* Legend */
  legendWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginTop: 8,
  },
  legendItem: { flexDirection: "row", alignItems: "center", gap: 6 },
  legendDot: { width: 10, height: 10, borderRadius: 5 },
  legendLabel: { color: "#374151" },

  /* Calendar */
  calendarWrap: {
    marginTop: 10,
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: colors.cardBg,
  },

  /* Day list */
  dayListWrap: { marginTop: 16 },
  dateHeading: { fontWeight: "700", fontSize: 16, marginBottom: 6, color: colors.text },
  emptyDayText: { color: colors.muted },

  dayItems: { gap: 10 },

  dayItem: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    backgroundColor: colors.cardBg,
  },
  dayItemHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  dayItemTitle: { fontWeight: "600", color: colors.text },
  dayItemTime: { color: colors.muted },

  dayItemDesc: { color: colors.muted, marginTop: 4 },

  dayItemMetaRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 8,
    alignItems: "center",
  },
  statusPill: {
    paddingVertical: 2,
    paddingHorizontal: 8,
    backgroundColor: colors.subtle,
    borderRadius: 8,
    fontWeight: "600",
    textTransform: "capitalize",
  },
  dayItemLocation: { color: "#444" },

  dayItemImageWrap: { marginTop: 10, borderRadius: 10, overflow: "hidden" },
  dayItemImage: { width: "100%", height: 120 },
});
