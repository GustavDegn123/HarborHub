// /styles/mechanics/providerProfileStyles.js
import { StyleSheet, Platform } from "react-native";
 
/** “Airbnb warm” → blå variant */
export const COLORS = {
  bg: "#F6FAFF",            // blød off-white med blå tone
  card: "#FFFFFF",
  ink: "#111827",           // primær tekst (næsten sort)
  sub: "#4B5563",           // sekundær
  muted: "#6B7280",         // meta
  border: "#E5EAF5",
  accent: "#0A84FF",        // blå accent (HarborHub/Criipto vibe)
  good: "#34A853",
  badgeGoodBg: "#D1FAE5",
  badgeGoodText: "#065F46",
  badgeBadBg: "#FEE2E2",
  badgeBadText: "#991B1B",
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
    fontSize: 22,
    fontWeight: "700",
    color: COLORS.ink,
    fontFamily: FONT_FAMILY,
  },
  tagline: {
    fontSize: 15,
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
 
  /* ---------- Quick actions ---------- */
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
  quickText: {
    fontFamily: FONT_FAMILY,
    color: COLORS.ink,
    fontWeight: "700",
  },
 
  /* ---------- Expand list ---------- */
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
    backgroundColor: "#E6F0FF", // blød blå “chip”
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
});