// /styles/boatowners/profileHubStyles.js
import { StyleSheet } from "react-native";

export const colors = {
  primary: "#0B5FA5",
  bg: "#F6F8FB",
  text: "#0f172a",
  textMuted: "#64748b",
  hint: "#94a3b8",
  iconMuted: "#9AA6B2",
  cardBg: "#ffffff",
  chipBg: "#EAF3FF",
  badgeBg: "#F2F7FF",
  badgeBorder: "#D6E6FF",
  borderLight: "#E6EEF5",
  danger: "#ef4444",
};

export default StyleSheet.create({
  container: { flex: 1, backgroundColor: colors.bg },

  // Bruges som contentContainerStyle på ScrollView
  body: { paddingHorizontal: 16, paddingTop: 12 },

  /* Hero */
  hero: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 16 },

  avatar: {
    width: 64,
    height: 64,
    borderRadius: 32,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.chipBg,
    position: "relative",
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  avatarPressed: { opacity: 0.9, transform: [{ scale: 0.996 }] },
  avatarImg: { width: "100%", height: "100%" },
  avatarInitials: { fontWeight: "800", fontSize: 20, color: colors.primary },

  // badge i hjørnet
  avatarEditBadge: { position: "absolute", right: -2, bottom: -2, padding: 2 },
  avatarEditCircle: {
    width: 22,
    height: 22,
    borderRadius: 11,
    backgroundColor: colors.badgeBg,
    borderWidth: 1,
    borderColor: colors.badgeBorder,
    alignItems: "center",
    justifyContent: "center",
  },

  heroTextWrap: { flex: 1 },
  heroTitle: { fontSize: 22, fontWeight: "800", color: colors.text, marginBottom: 2 },
  heroSub: { fontSize: 13, color: colors.textMuted },
  heroHint: { marginTop: 4, fontSize: 11, color: colors.hint },

  /* Cards & rows */
  card: {
    backgroundColor: colors.cardBg,
    borderRadius: 18,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: colors.borderLight,
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 10,
    shadowOffset: { width: 0, height: 6 },
    elevation: 2,
  },
  cardSpacer: { marginTop: 16 },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: colors.cardBg,
  },
  itemRowPressed: { backgroundColor: "#F3F6FA" },
  itemIconWrap: {
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.chipBg,
    marginRight: 12,
    borderWidth: 1,
    borderColor: colors.badgeBorder,
  },
  itemLabel: { fontSize: 16, fontWeight: "600", color: colors.text },
  itemChevron: { marginLeft: "auto" },
  separator: {
    height: StyleSheet.hairlineWidth,
    backgroundColor: colors.borderLight,
    marginLeft: 16 + 32 + 12,
  },

  /* Hjælp & juridisk */
  helpTitle: {
    fontWeight: "800",
    marginBottom: 10,
    color: colors.text,
    padding: 16,
    paddingBottom: 0,
  },
  supportRow: { flexDirection: "row", gap: 10, padding: 16, paddingTop: 12 },
  supportBtn: {
    flex: 1,
    backgroundColor: "#E9F2FF",
    borderColor: colors.badgeBorder,
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
  },
  supportBtnText: { color: colors.primary, fontWeight: "800" },
  supportEmailLink: { marginTop: -4, paddingHorizontal: 16, paddingBottom: 16, alignItems: "center" },
  supportEmailText: { color: colors.primary, fontWeight: "600" },

  /* Log ud – kort lige over faresonen */
  logoutCard: { marginTop: 16, backgroundColor: colors.cardBg, borderRadius: 14, borderWidth: 1, borderColor: colors.borderLight, padding: 10 },
  logoutGhost: {
    width: "100%",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 6,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: colors.borderLight,
  },
  logoutGhostPressed: { opacity: 0.75, transform: [{ scale: 0.997 }] },
  logoutGhostText: { color: colors.danger, fontWeight: "700", fontSize: 14 },

  /* Delete section – nederst */
  deleteSection: { marginTop: 16 },
});
