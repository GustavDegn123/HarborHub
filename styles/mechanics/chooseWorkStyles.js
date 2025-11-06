import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F3F4F6", paddingHorizontal: 16, paddingTop: 12 },
  subtitle: { color: "#0B5FA5", fontWeight: "700", marginBottom: 4 },
  title: { fontSize: 22, fontWeight: "800", marginBottom: 10, color: "#0F172A" },

  search: {
    backgroundColor: "white",
    borderRadius: 12,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderWidth: 1,
    borderColor: "#E5E7EB",
    marginBottom: 10,
  },

  quickRow: { flexDirection: "row", gap: 10, marginBottom: 10 },
  quickBtn: { backgroundColor: "#E6F1F8", paddingVertical: 8, paddingHorizontal: 12, borderRadius: 10 },
  quickBtnGhost: { backgroundColor: "#F3F4F6", borderWidth: 1, borderColor: "#D1D5DB" },
  quickBtnText: { color: "#0B5FA5", fontWeight: "700" },
  quickBtnGhostText: { color: "#374151" },

  listContent: { paddingBottom: 24 },

  categoryCard: {
    backgroundColor: "white",
    borderRadius: 14,
    padding: 12,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  categoryHeader: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  categoryTitle: { fontSize: 16, fontWeight: "800", color: "#111827" },
  categoryRight: { flexDirection: "row", alignItems: "center", gap: 8 },
  categoryCount: { color: "#6B7280", fontWeight: "700" },
  chevron: { color: "#6B7280", fontSize: 16 },

  categoryActions: { marginTop: 8, marginBottom: 6, flexDirection: "row" },
  smallBtn: { paddingVertical: 6, paddingHorizontal: 10, borderRadius: 8, backgroundColor: "#EEF6FB" },
  smallBtnText: { color: "#0B5FA5", fontWeight: "700" },

  subCategoryBlock: { marginTop: 6, paddingTop: 6, borderTopWidth: 1, borderTopColor: "#F3F4F6" },
  subHeaderRow: { flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 6 },
  subHeader: { fontWeight: "800", color: "#0F172A" },
  subSmallBtn: { paddingHorizontal: 10, paddingVertical: 4, borderRadius: 6, backgroundColor: "#F3F4F6" },
  subSmallBtnText: { color: "#374151", fontWeight: "700" },

  leafRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 10,
    paddingHorizontal: 8,
    borderRadius: 10,
    marginBottom: 6,
    borderWidth: 1,
  },
  leafRowOn: { backgroundColor: "#F0F9FF", borderColor: "#BAE6FD" },
  leafRowOff: { backgroundColor: "#FFFFFF", borderColor: "#E5E7EB" },
  leafText: { color: "#111827", fontWeight: "600" },
  tick: { fontWeight: "900" },
  tickOn: { color: "#0B5FA5" },
  tickOff: { color: "#9CA3AF" },

  selectedInfo: { textAlign: "center", color: "#6B7280", marginTop: 6 },

  spacer: { height: 8 },

  doneButton: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 10,
  },
  doneButtonEnabled: { backgroundColor: "#184E6E" },
  doneButtonDisabled: { backgroundColor: "#9CA3AF" },
  doneButtonText: { color: "white", fontWeight: "800" },

  cancelButton: { alignItems: "center", paddingVertical: 10, marginBottom: 10 },
  cancelButtonText: { color: "#374151", fontWeight: "600" },

  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { color: "#6B7280", marginTop: 6 },
});
