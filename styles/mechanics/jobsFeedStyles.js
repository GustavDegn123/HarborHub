// /styles/mechanics/jobsFeedStyles.js
import { StyleSheet } from "react-native";

export default StyleSheet.create({
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

  emptyWrap: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  emptyTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 6,
  },
  emptySubtitle: {
    color: "#6b7280",
    textAlign: "center",
  },

  listContent: {
    paddingVertical: 8,
  },

  jobCard: {
    padding: 14,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
  },
  jobDescription: {
    color: "#4b5563",
    marginBottom: 6,
  },
  jobMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
  },
  jobPrice: {
    color: "#1f2937",
    fontWeight: "600",
  },
  jobDistance: {
    color: "#6b7280",
  },
});
