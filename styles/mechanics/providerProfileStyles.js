import { StyleSheet } from "react-native";

export default StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: "#fff" },

  header: {
    backgroundColor: "#ffffff",
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 12,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
  },
  name: { fontSize: 22, fontWeight: "800", color: "#0f1f2a" },
  rating: { marginTop: 4, color: "#4b5563" },

  kpis: { flexDirection: "row", gap: 10, marginTop: 14 },
  kpi: {
    flex: 1,
    backgroundColor: "#f8fbff",
    borderWidth: 1,
    borderColor: "#e6eef4",
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
  },
  kpiLabel: { color: "#6b7280", marginBottom: 4, fontWeight: "600" },
  kpiValue: { color: "#0f1f2a", fontSize: 18, fontWeight: "900" },

  filters: { flexDirection: "row", gap: 8, marginTop: 12 },
  filterChip: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 999,
    backgroundColor: "#eef5fa",
    borderWidth: 1,
    borderColor: "#d8e6f0",
  },
  filterChipActive: { backgroundColor: "#1f5c7d", borderColor: "#1f5c7d" },
  filterChipText: { color: "#1f5c7d", fontWeight: "700" },
  filterChipTextActive: { color: "#fff" },

  sectionTitle: {
    marginTop: 16,
    marginBottom: 8,
    paddingHorizontal: 16,
    color: "#0f1f2a",
    fontWeight: "800",
    fontSize: 16,
  },

  card: {
    marginHorizontal: 16,
    marginVertical: 6,
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e6eef4",
    padding: 12,
  },
  rowBetween: { flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  cardTitle: { fontWeight: "800", color: "#0f1f2a" },
  cardPrice: { fontWeight: "800", color: "#0f1f2a" },
  cardSub: { color: "#4b5563", marginTop: 2 },
  cardMeta: { color: "#6b7280" },

  payoutRow: {
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderBottomColor: "#eef2f7",
    flexDirection: "row",
    justifyContent: "space-between",
  },

  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e6eef4",
    padding: 12,
    marginBottom: 10,
  },
});
