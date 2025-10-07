// styles/boatowners/requestBidsStyles.js
import { StyleSheet } from "react-native";

const styles = StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f9fc",
  },
  container: {
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 8,
    color: "#6b7280",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f1f2a",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 20,
  },
  bidCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  bidPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1f5c7d",
    marginBottom: 6,
  },
  bidMessage: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 12,
  },
  btnPrimary: {
    backgroundColor: "#1f5c7d",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
  providerBox: {
    marginTop: 8,
    padding: 8,
    backgroundColor: "#f0f4f8",
    borderRadius: 8,
  },
  providerName: {
    fontWeight: "700",
    color: "#0f1f2a",
  },
  providerEmail: {
    fontSize: 12,
    color: "#6b7280",
  },
});

const sx = StyleSheet.create({
  jobCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    marginBottom: 12,
  },
  jobHeaderRow: { flexDirection: "row", alignItems: "center", marginBottom: 6 },
  jobType: { flex: 1, fontSize: 14, fontWeight: "900", letterSpacing: 0.3, color: "#0b2740" },
  jobDesc: { color: "#374151", marginBottom: 8, lineHeight: 20 },
  metaRow: { flexDirection: "row", justifyContent: "space-between", marginTop: 2 },
  metaLabel: { color: "#6b7280", fontSize: 12 },
  metaValue: { color: "#111827", fontSize: 13, fontWeight: "600" },

  chip: {
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    borderWidth: 1,
    marginLeft: 8,
  },
  chipText: { fontSize: 11, fontWeight: "800", textTransform: "uppercase" },
  chip_open: { borderColor: "#BFDBFE", backgroundColor: "#EFF6FF" },
  chip_assigned: { borderColor: "#FDE68A", backgroundColor: "#FEF3C7" },
  chip_in_progress: { borderColor: "#FCD34D", backgroundColor: "#FEF3C7" },
  chip_completed: { borderColor: "#D1FAE5", backgroundColor: "#ECFDF5" },
  chip_paid: { borderColor: "#A7F3D0", backgroundColor: "#ECFDF5" },
  chip_reviewed: { borderColor: "#E9D5FF", backgroundColor: "#F5F3FF" },
  chip_unknown: { borderColor: "#E5E7EB", backgroundColor: "#F9FAFB" },

  aiBox: {
    borderWidth: 1,
    borderColor: "#BFDBFE",
    backgroundColor: "#EFF6FF",
    padding: 12,
    borderRadius: 12,
    marginBottom: 12,
  },
  aiTitle: { fontWeight: "800", marginBottom: 4 },
  aiText: { color: "#1F2937" },

  badgeRecommended: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#DCFCE7",
    color: "#065F46",
    fontWeight: "700",
    fontSize: 12,
  },
  badgeAccepted: {
    paddingHorizontal: 8,
    paddingVertical: 2,
    borderRadius: 999,
    backgroundColor: "#E5E7EB",
    color: "#111827",
    fontWeight: "700",
    fontSize: 12,
  },
});

export default styles;
export { sx };
