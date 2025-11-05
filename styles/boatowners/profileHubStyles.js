import { StyleSheet } from "react-native";

export const colors = {
  primary: "#0B5FA5",
  bg: "#F6F8FB",
  text: "#0f172a",
  textMuted: "#64748b",
  hint: "#94a3b8",
  iconMuted: "#94a3b8",
  cardBg: "#ffffff",
  chipBg: "#E6F0FB",
  badgeBg: "#EAF3FF",
  badgeBorder: "#D6E6FF",
  borderLight: "#F1F5F9",
  danger: "#ef4444",
};

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },
  body: { flex: 1, paddingHorizontal: 16, paddingTop: 8 },

  /* Hero */
  hero: { flexDirection: "row", alignItems: "center", gap: 12, marginBottom: 14 },

  avatar: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.chipBg,
    position: "relative",
    overflow: "hidden",
  },
  avatarPressed: { opacity: 0.85, transform: [{ scale: 0.995 }] },
  avatarImg: { width: "100%", height: "100%" },
  avatarInitials: { fontWeight: "800", fontSize: 18, color: colors.primary },

  // lille badge i hjørnet
  avatarEditBadge: {
    position: "absolute",
    right: -2,
    bottom: -2,
    padding: 2,
  },
  avatarEditCircle: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.badgeBg,
    borderWidth: 1,
    borderColor: colors.badgeBorder,
    alignItems: "center",
    justifyContent: "center",
  },

  heroTextWrap: { flex: 1 },
  heroTitle: { fontSize: 20, fontWeight: "800", color: colors.text, marginBottom: 2, textAlign: "left" },
  heroSub: { fontSize: 13, color: colors.textMuted },
  heroHint: { marginTop: 4, fontSize: 11, color: colors.hint },

  /* Menu card */
  card: {
    backgroundColor: colors.cardBg,
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
    backgroundColor: colors.cardBg,
  },
  itemRowPressed: { backgroundColor: "#F1F5F9" },
  itemIconWrap: {
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.chipBg,
    marginRight: 10,
  },
  itemLabel: { fontSize: 16, color: colors.text },
  itemChevron: { marginLeft: "auto" },
  separator: { height: StyleSheet.hairlineWidth, backgroundColor: "#E5E7EB", marginLeft: 14 + 28 + 10 },

  /* Delete section spacing */
  deleteSection: { marginTop: 16 },

  /* Footer */
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
    borderColor: colors.borderLight,
  },
  logoutGhostPressed: { opacity: 0.7, transform: [{ scale: 0.997 }] },
  logoutGhostText: { color: colors.danger, fontWeight: "600", fontSize: 14 },
});
