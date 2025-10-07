import { StyleSheet } from "react-native";

export default StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f9fc",
  },
  container: {
    padding: 16,
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
  notFound: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  notFoundTitle: {
    fontWeight: "800",
    fontSize: 16,
    marginBottom: 6,
  },
  notFoundText: {
    color: "#6b7280",
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    borderWidth: 1,
    borderColor: "#e6eef4",
    padding: 16,
  },
  cardHeader: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
  },
  title: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0f1f2a",
  },
  created: {
    marginTop: 4,
    color: "#6b7280",
  },
  section: {
    marginTop: 12,
  },
  sectionTitle: {
    fontWeight: "800",
    color: "#0f1f2a",
  },
  sectionText: {
    marginTop: 6,
    color: "#374151",
  },
  spacer: {
    height: 12,
  },
  badgeCompleted: {
    textTransform: "capitalize",
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#e7f7ee",
    color: "#1c8b4a",
  },
  badgeInProgress: {
    textTransform: "capitalize",
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#fff7ed",
    color: "#b45309",
  },
  badgeClaimed: {
    textTransform: "capitalize",
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#eef5fb",
    color: "#1f5c7d",
  },
  badgeDefault: {
    textTransform: "capitalize",
    fontWeight: "800",
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
    backgroundColor: "#e5e7eb",
    color: "#374151",
  },
  btnPrimary: {
    backgroundColor: "#1f5c7d",
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 14,
    marginBottom: 10,
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  actionGroup: {
    gap: 10,
  },
  btnWarn: {
    backgroundColor: "#fb923c",
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 14,
  },
  btnSuccess: {
    backgroundColor: "#16a34a",
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 14,
  },
  btnText: {
    color: "#fff",
    fontWeight: "900",
    fontSize: 16,
  },
  completedBox: {
    padding: 14,
    borderRadius: 12,
    backgroundColor: "#e7f7ee",
    borderWidth: 1,
    borderColor: "#b7ebc5",
    alignItems: "center",
    marginTop: 4,
  },
  completedText: {
    color: "#1c8b4a",
    fontWeight: "900",
  },

  bidBox: {
  backgroundColor: "#fff",
  borderRadius: 16,
  borderWidth: 1,
  borderColor: "#e6eef4",
  padding: 16,
  marginTop: 16,
},

input: {
  borderWidth: 1,
  borderColor: "#d1d5db",
  borderRadius: 12,
  paddingHorizontal: 12,
  paddingVertical: 10,
  marginBottom: 12,
  backgroundColor: "#f9fafb",
},

bidItem: {
  backgroundColor: "#fff",
  borderRadius: 12,
  borderWidth: 1,
  borderColor: "#e6eef4",
  padding: 12,
  marginTop: 10,
},

bidPrice: {
  fontSize: 16,
  fontWeight: "900",
  color: "#1f5c7d",
},

bidMessage: {
  marginTop: 4,
  color: "#374151",
  fontStyle: "italic",
},

});
