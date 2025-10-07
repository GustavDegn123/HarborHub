import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F6F8FB" },

  body: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },

  /* Hero */
  hero: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6F0FB",
    position: "relative",
    overflow: "hidden",
  },
  avatarImg: { width: "100%", height: "100%" },
  avatarInitials: { fontWeight: "800", fontSize: 18, color: "#0B5FA5" },

  // small badge in the corner
  avatarEditBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    padding: 2,
  },
  // camera centered within a small circle
  avatarEditCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: "#EAF3FF",
    borderWidth: 1,
    borderColor: "#D6E6FF",
    alignItems: "center",
    justifyContent: "center",
  },

  heroTextWrap: { flex: 1 },
  heroTitle: { fontSize: 20, fontWeight: "800", color: "#0f172a", marginBottom: 2, textAlign: "left" },
  heroSub: { fontSize: 13, color: "#64748b" },
  heroHint: { marginTop: 4, fontSize: 11, color: "#94a3b8" },

  /* Menu card */
  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    overflow: "hidden",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
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
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: "#E5E7EB", marginLeft: 14 + 28 + 10 },

  /* Footer – diskret, lavt og ikke dominerende */
  footerAbs: { position: "absolute", left: 16, right: 16 },
  logoutGhost: {
    width: "100%",
    paddingVertical: 10,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: "#F1F5F9",
  },
  logoutGhostText: { color: "#ef4444", fontWeight: "600", fontSize: 14 },
});
