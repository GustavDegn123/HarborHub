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

  // Info-banner (profil mangler)
  notice: {
    marginHorizontal: 16,
    marginTop: 10,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#EFF6FF",
    borderColor: "#93C5FD",
    borderWidth: 1,
    borderRadius: 12,
  },
  noticeText: {
    color: "#1E40AF",
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
  },

  // Radius-banner
  radiusNotice: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 4,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: "#FEF3C7",
    borderColor: "#F59E0B",
    borderWidth: 1,
    borderRadius: 12,
  },
  radiusNoticeText: {
    color: "#92400E",
    textAlign: "center",
    fontSize: 13,
    fontWeight: "600",
  },

  // Kort
  card: {
    padding: 16,
    marginHorizontal: 16,
    marginVertical: 8,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    backgroundColor: "#fff",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "800",
    marginBottom: 6,
    color: "#0f1f2a",
  },
  cardBudget: {
    fontSize: 16,
    fontWeight: "700",
    color: "#1f5c7d",
    marginBottom: 6,
  },
  cardDesc: {
    color: "#374151",
    marginBottom: 6,
    fontSize: 14,
    lineHeight: 20,
  },
  cardMeta: {
    color: "#6b7280",
    fontSize: 13,
    marginBottom: 4,
  },

  // Action-knapper i række
  rowButtons: {
    flexDirection: "row",
    gap: 10,
    marginTop: 10,
  },

  // Blå knap: "Åbn chat"
  btnPrimary: {
    backgroundColor: "#1f5c7d",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    flex: 1,
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },

  // Sort knap: "Se detaljer"
  btnDark: {
    backgroundColor: "#0f1f2a",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
    flex: 1,
  },
  btnDarkText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 15,
  },
});
