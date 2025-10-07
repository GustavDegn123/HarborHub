// /styles/boatowners/requestsStyles.js
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: { flex: 1, padding: 16, backgroundColor: "#f6f9fc" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: "#f6f9fc" },
  title: { fontSize: 22, fontWeight: "900", color: "#0f1f2a", marginBottom: 12 },
  emptyText: { fontSize: 16, color: "#6b7280", textAlign: "center" },

  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 5,
    elevation: 2,
  },

  cardHeader: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 6,
  },

  cardTitle: { flex: 1, fontSize: 14, fontWeight: "900", letterSpacing: 0.3, color: "#0b2740" },

  description: { color: "#374151", marginBottom: 8, lineHeight: 20 },

  metaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginTop: 2,
  },
  metaLabel: { color: "#6b7280", fontSize: 12 },
  metaValue: { color: "#111827", fontSize: 13, fontWeight: "600", maxWidth: "65%" },

  footerRow: {
    marginTop: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  bidsText: { color: "#1f2937", fontWeight: "700" },
  link: { color: "#1f5c7d", fontWeight: "800" },

  // Status badge
  statusChip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: 8,
  },
  statusChipText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },

  // Farver per status
  st_open: { borderColor: "#BFDBFE", backgroundColor: "#EFF6FF" },
  st_assigned: { borderColor: "#FDE68A", backgroundColor: "#FEF3C7" },
  st_in_progress: { borderColor: "#FCD34D", backgroundColor: "#FEF3C7" },
  st_completed: { borderColor: "#D1FAE5", backgroundColor: "#ECFDF5" },
  st_paid: { borderColor: "#A7F3D0", backgroundColor: "#ECFDF5" },
  st_reviewed: { borderColor: "#E9D5FF", backgroundColor: "#F5F3FF" },
  st_unknown: { borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" },
});
