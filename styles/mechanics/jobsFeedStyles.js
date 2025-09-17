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
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  jobTitle: {
    fontSize: 16,
    fontWeight: "700",
    marginBottom: 4,
    color: "#0f1f2a",
  },
  jobDescription: {
    color: "#4b5563",
    marginBottom: 6,
  },
  jobMetaRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    alignItems: "center",
    marginTop: 8,
  },
  jobPrice: {
    color: "#1f2937",
    fontWeight: "700",
  },
  jobDistance: {
    color: "#6b7280",
    fontWeight: "600",
  },

  // --- Tags (chips) ---
  tagWrap: {
    flexDirection: "row",
    flexWrap: "wrap",
    marginTop: 8,
  },
  tag: {
    paddingHorizontal: 10,
    paddingVertical: 6,
    borderRadius: 999,
    backgroundColor: "#f2f8fc",
    borderWidth: 1,
    borderColor: "#cfe1ec",
    marginRight: 6,
    marginBottom: 6,
  },
  tagText: {
    color: "#1f5c7d",
    fontWeight: "700",
    fontSize: 12,
  },
});
