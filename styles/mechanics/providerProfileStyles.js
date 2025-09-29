// styles/mechanics/providerProfileStyles.js
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  // ---- Generelt ----
  screen: {
    flex: 1,
    backgroundColor: "#f9fafb",
  },

  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: {
    marginTop: 8,
    color: "#6b7280",
  },

  // ---- Header & profil ----
  header: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f1f2a",
  },
  subheader: {
    color: "#4b5563",
    marginTop: 4,
    marginBottom: 12,
  },

  // ---- KPI’er ----
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 12,
    marginBottom: 12,
  },
  kpiCard: {
    flexBasis: "47%", // 2 pr. række
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e6eef4",
    borderRadius: 14,
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
    alignItems: "center",
  },
  kpiLabel: {
    color: "#6b7280",
    fontWeight: "700",
    fontSize: 13,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f1f2a",
    marginTop: 6,
  },
  kpiMuted: {
    color: "#6b7280",
    fontSize: 12,
    fontWeight: "700",
  },

  // ---- Normaliserings-knap ----
  fixBtn: {
    alignSelf: "stretch",
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    marginBottom: 16,
  },
  fixBtnText: {
    color: "#3730a3",
    fontWeight: "900",
  },

  // ---- Sektioner ----
  sectionTitle: {
    fontSize: 18,
    fontWeight: "900",
    color: "#0f1f2a",
    marginTop: 16,
    marginBottom: 8,
  },

  // ---- Empty states ----
  emptyBox: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#e6eef4",
    borderRadius: 14,
    padding: 16,
    alignItems: "center",
    marginBottom: 10,
  },
  emptyTitle: {
    fontWeight: "900",
    color: "#0f1f2a",
  },
  emptyText: {
    color: "#6b7280",
    marginTop: 6,
    textAlign: "center",
  },

  // ---- Cards ----
  card: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e6eef4",
    padding: 14,
    marginBottom: 10,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardRowTop: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  cardTitle: {
    fontWeight: "900",
    color: "#0f1f2a",
    fontSize: 16,
  },
  cardPrice: {
    fontWeight: "900",
    color: "#0f1f2a",
  },
  cardSub: {
    color: "#4b5563",
    marginTop: 4,
  },
  cardMeta: {
    color: "#6b7280",
    marginTop: 6,
  },

  // ---- Action buttons ----
  btnSuccess: {
    backgroundColor: "#16a34a",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  btnWarn: {
    backgroundColor: "#fb923c",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 10,
  },
  btnText: {
    color: "#fff",
    fontWeight: "900",
  },

  // ---- Collapsed stack ----
  stackWrap: {
    position: "relative",
    width: "100%",
    height: 120,
    marginBottom: 12,
  },
  stackCard: {
    position: "absolute",
    left: 0,
    right: 0,
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e6eef4",
    padding: 14,
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  stackToggle: {
    alignSelf: "center",
    marginTop: 10,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 999,
    backgroundColor: "#eef2ff",
    borderWidth: 1,
    borderColor: "#c7d2fe",
  },
  stackToggleText: {
    color: "#3730a3",
    fontWeight: "900",
  },

  // ---- Udbetalinger ----
  payoutRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    paddingVertical: 10,
    borderBottomWidth: 1,
    borderColor: "#e6eef4",
  },

  // ---- Reviews ----
  reviewCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e6eef4",
    padding: 16,
    marginHorizontal: 16,
    marginBottom: 12,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
});
