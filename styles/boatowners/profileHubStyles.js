import { StyleSheet } from "react-native";

export default StyleSheet.create({
  /* Ensartet lys baggrund hele vejen ned */
  container: {
    flex: 1,
    backgroundColor: "#F6F8FB",
  },

  /* Scroll/indholdsområde */
  body: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 8,
  },

  /* --- Hero --- */
  hero: {
    flexDirection: "row",
    alignItems: "center",
    gap: 12,
    marginBottom: 14,
  },
  avatar: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6F0FB",
  },
  heroTextWrap: { flex: 1 },
  heroTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 2,
    textAlign: "left",
  },
  heroSub: {
    fontSize: 13,
    color: "#64748b",
  },

  /* --- Kort med menupunkter --- */
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    // iOS
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    // Android
    elevation: 2,
  },
  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 14,
    paddingHorizontal: 14,
    backgroundColor: "#fff",
  },
  itemRowPressed: { backgroundColor: "#F1F5F9" },
  itemIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6F0FB",
    marginRight: 10,
  },
  itemLabel: { fontSize: 16, color: "#0f172a" },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: "#E5E7EB",
    marginLeft: 14 + 28 + 10,
  },

  /* --- Footer absolut placeret over tab-baren --- */
  footerAbs: {
    position: "absolute",
    left: 16,
    right: 16,
  },
  logoutBtn: {
    width: "100%",
    backgroundColor: "#E25C56",
    paddingVertical: 14,
    borderRadius: 16,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    // skygge
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  logoutText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
});