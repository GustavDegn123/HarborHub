import { StyleSheet, Platform } from "react-native";

/** “Airbnb warm” → blå variant */
export const COLORS = {
  bg: "#F6FAFF",
  card: "#FFFFFF",
  ink: "#111827",
  sub: "#4B5563",
  muted: "#6B7280",
  border: "#E5EAF5",
  accent: "#0A84FF",
  good: "#34A853",
  danger: "#B91C1C",
  dangerBg: "#FFE4E6",
  dangerBorder: "#FCA5A5",
  badgeGoodBg: "#D1FAE5",
  badgeGoodText: "#065F46",
  badgeBadBg: "#FEE2E2",
  badgeBadText: "#991B1B",
  star: "#F59E0B",
};

const FONT_FAMILY = Platform.select({
  ios: "System",
  android: "Roboto",
  default: "System",
});

const RADIUS = 16;

const ELEV = {
  shadowColor: "#000",
  shadowOpacity: 0.08,
  shadowRadius: 8,
  shadowOffset: { width: 0, height: 3 },
  elevation: 3,
};

export default StyleSheet.create({
  /* ---------- Generelt ---------- */
  screen: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  content: {
    padding: 16,
  },
  loader: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loaderText: {
    marginTop: 8,
    color: COLORS.muted,
    fontFamily: FONT_FAMILY,
    fontSize: 15,
  },

  /* ---------- Header ---------- */
  headerCard: {
    marginTop: 6,
    marginBottom: 14,
  },
  welcome: {
    fontSize: 18,
    fontWeight: "800",
    color: COLORS.ink,
    fontFamily: FONT_FAMILY,
  },
  tagline: {
    fontSize: 14,
    color: COLORS.sub,
    marginTop: 4,
    fontFamily: FONT_FAMILY,
  },

  /* ---------- MitID ---------- */
  identityCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS,
    padding: 16,
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
    ...ELEV,
  },
  identityRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  identityTitle: {
    fontSize: 17,
    fontWeight: "700",
    color: COLORS.ink,
    fontFamily: FONT_FAMILY,
  },
  identityDesc: {
    marginTop: 8,
    fontSize: 14,
    color: COLORS.sub,
    lineHeight: 20,
    fontFamily: FONT_FAMILY,
  },
  identityBtn: {
    backgroundColor: COLORS.accent,
    marginTop: 14,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  disabled: { opacity: 0.6 },
  identityBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontFamily: FONT_FAMILY,
    fontSize: 15,
  },
  identityHelp: {
    marginTop: 10,
    color: COLORS.muted,
    fontSize: 12,
    lineHeight: 18,
    fontFamily: FONT_FAMILY,
  },
  identityError: {
    marginTop: 8,
    color: "#DC2626",
    fontFamily: FONT_FAMILY,
  },

  badgeGood: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.badgeGoodBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeGoodText: {
    color: COLORS.badgeGoodText,
    fontWeight: "700",
    fontFamily: FONT_FAMILY,
    fontSize: 12,
  },
  badgeBad: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
    backgroundColor: COLORS.badgeBadBg,
    paddingHorizontal: 10,
    paddingVertical: 4,
    borderRadius: 999,
  },
  badgeBadText: {
    color: COLORS.badgeBadText,
    fontWeight: "700",
    fontFamily: FONT_FAMILY,
    fontSize: 12,
  },

  /* ---------- KPI ---------- */
  kpiGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
    marginBottom: 20,
  },
  kpiCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: COLORS.border,
    alignItems: "center",
    justifyContent: "center",
    paddingVertical: 16,
    flexBasis: "48%",
    ...ELEV,
  },
  kpiValue: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.ink,
    marginTop: 6,
    fontFamily: FONT_FAMILY,
  },
  kpiLabel: {
    color: COLORS.muted,
    fontSize: 13,
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },

  /* ---------- Cards / generelt ---------- */
  card: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 12,
    ...ELEV,
  },
  cardSpacer: { marginTop: 16 },
  rowBetween: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  cardTitle: {
    fontWeight: "700",
    color: COLORS.ink,
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },
  cardMeta: {
    color: COLORS.muted,
    marginTop: 6,
    fontFamily: FONT_FAMILY,
    fontSize: 13,
  },

  starText14: {
    color: COLORS.star,
    fontWeight: "700",
    fontSize: 14,
    fontFamily: FONT_FAMILY,
  },
  starText16: {
    color: COLORS.star,
    fontWeight: "700",
    fontSize: 16,
    fontFamily: FONT_FAMILY,
  },

  quickRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 16,
  },
  quickButton: {
    flex: 1,
    backgroundColor: "#FFF",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingVertical: 12,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
    ...ELEV,
  },
  quickButtonDanger: {
    backgroundColor: COLORS.dangerBg,
    borderColor: COLORS.dangerBorder,
  },
  quickText: {
    fontFamily: FONT_FAMILY,
    color: COLORS.ink,
    fontWeight: "700",
  },
  quickTextDanger: {
    color: COLORS.danger,
  },

  sectionTitle: {
    fontSize: 18,
    fontWeight: "700",
    color: COLORS.ink,
    marginTop: 8,
    marginBottom: 10,
    fontFamily: FONT_FAMILY,
  },
  expandCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    marginBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    ...ELEV,
  },

  /* ---------- Jobkort ---------- */
  jobCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 16,
    ...ELEV,
  },
  jobTitle: {
    fontWeight: "700",
    color: COLORS.ink,
    fontFamily: FONT_FAMILY,
    fontSize: 16,
  },
  jobPrice: {
    fontWeight: "700",
    color: COLORS.ink,
    fontFamily: FONT_FAMILY,
    fontSize: 15,
  },

  /* ---------- Empty states ---------- */
  emptyBox: {
    backgroundColor: COLORS.card,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: RADIUS,
    padding: 18,
    alignItems: "center",
    marginBottom: 10,
    ...ELEV,
  },
  emptyTitle: {
    fontWeight: "700",
    color: COLORS.ink,
    fontFamily: FONT_FAMILY,
    fontSize: 16,
  },
  emptyText: {
    color: COLORS.muted,
    marginTop: 6,
    textAlign: "center",
    fontFamily: FONT_FAMILY,
    fontSize: 14,
    lineHeight: 20,
  },

  /* ---------- Udbetalinger ---------- */
  payoutList: { gap: 12 },
  payoutCard: {
    backgroundColor: COLORS.card,
    borderRadius: RADIUS,
    borderWidth: 1,
    borderColor: COLORS.border,
    padding: 14,
    ...ELEV,
  },
  payoutRow: {
    flexDirection: "row",
    alignItems: "center",
  },
  payoutIconWrap: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#E6F0FF",
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  payoutAmount: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.ink,
    fontFamily: FONT_FAMILY,
  },
  payoutDate: {
    fontSize: 13,
    color: COLORS.muted,
    marginTop: 2,
    fontFamily: FONT_FAMILY,
  },

  /* ---------- Hjælp & juridisk ---------- */
  helpRow: { flexDirection: "row", gap: 10, marginTop: 10 },
  helpBtn: {
    flex: 1,
    backgroundColor: "#E6F0FB",
    borderColor: "#D6E6FF",
    borderWidth: 1,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  helpBtnText: { color: COLORS.accent, fontWeight: "700", fontFamily: FONT_FAMILY },
  helpEmailLink: { marginTop: 10, alignItems: "center" },
  helpEmailText: { color: COLORS.accent, fontWeight: "600", fontFamily: FONT_FAMILY },

  /* ---------- Utilities ---------- */
  listSeparator: { height: 10 },
  flex1: { flex: 1 },

  /* ---------- Delete/spacing ---------- */
  deleteSectionSpacing: { marginTop: 16, marginBottom: 12 },
bigActionBtn: {
  backgroundColor: COLORS.card,
  borderRadius: 16,
  borderWidth: 1,
  borderColor: COLORS.border,
  paddingVertical: 14,
  paddingHorizontal: 16,
  flexDirection: "row",
  alignItems: "center",
  justifyContent: "space-between",
  marginBottom: 12,
  ...ELEV,
},
bigActionLeft: { flexDirection: "row", alignItems: "center", gap: 10 },
bigActionText: { color: COLORS.ink, fontWeight: "800", fontSize: 16, fontFamily: FONT_FAMILY },

logoutCard: {
  marginTop: 16,
  backgroundColor: COLORS.card,
  borderRadius: 14,
  borderWidth: 1,
  borderColor: COLORS.border,
  padding: 10,
  ...ELEV,
},
logoutGhost: {
  width: "100%",
  paddingVertical: 14,
  borderRadius: 12,
  alignItems: "center",
  flexDirection: "row",
  justifyContent: "center",
  gap: 8,
  backgroundColor: COLORS.dangerBg,
  borderWidth: 1,
  borderColor: COLORS.dangerBorder,
},
logoutGhostText: { color: COLORS.danger, fontWeight: "800", fontSize: 15, fontFamily: FONT_FAMILY },
});
