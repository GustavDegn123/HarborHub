import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 16,
  },

  /* Loading */
  loadingContainer: { flex: 1, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 8, color: "#4b5563" },

  /* Header */
  subtitle: {
    textAlign: "center",
    fontSize: 16,
    color: "#194b63",
    fontWeight: "600",
    marginBottom: 8,
  },
  title: { fontSize: 20, fontWeight: "700", marginTop: 8, marginBottom: 12 },

  /* Quick actions */
  quickRow: { flexDirection: "row", gap: 10, marginBottom: 8 },
  quickBtn: {
    backgroundColor: "#e8f0f4",
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
  },
  quickBtnText: { fontWeight: "700", color: "#1f5c7d" },
  quickBtnGhost: { backgroundColor: "#F3F4F6" },
  quickBtnGhostText: { color: "#334155" },

  /* List */
  listContent: { paddingVertical: 6, paddingBottom: 8 },
  serviceItem: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  serviceItemSelected: { borderColor: "#1f5c7d", backgroundColor: "#eff6fb" },
  serviceItemUnselected: { borderColor: "#d1d5db", backgroundColor: "#fff" },
  serviceItemText: { fontSize: 16 },
  serviceTick: { fontSize: 18, fontWeight: "800" },
  serviceTickOn: { color: "#1f5c7d" },
  serviceTickOff: { color: "#9CA3AF" },

  /* Footer */
  selectedInfo: { textAlign: "center", color: "#6b7280", marginTop: 6 },
  spacer: { flex: 1 },

  doneButton: {
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 24,
    marginBottom: 10,
  },
  doneButtonEnabled: { backgroundColor: "#1f5c7d" },
  doneButtonDisabled: { backgroundColor: "#93c5fd" },
  doneButtonText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  cancelButton: { alignItems: "center", marginBottom: 16 },
  cancelButtonText: { color: "#1f5c7d", fontWeight: "600" },
});
