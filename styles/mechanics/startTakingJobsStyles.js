import { StyleSheet, Platform } from "react-native";

const colors = {
  primary: "#1f5c7d",
  primaryBg: "#e8f0f4",
  primaryMaxTrack: "#c8d6df",
  bg: "#fff",
  text: "#0f172a",
  textMuted: "#475569",
  label: "#4b5563",
  border: "#d1d5db",
  introCardBg: "#F8FAFC",
  introBadgeBg: "#E6F0FB",
  gray600: "#6b7280",
};

/* Bruges til Slider-props så farver også bor i “styles” */
export const sliderColors = {
  minimumTrack: colors.primary,
  maximumTrack: colors.primaryMaxTrack,
  thumb: colors.primary,
};

export default StyleSheet.create({
  /* ---------- Intro ---------- */
  introScreen: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 20,
    paddingTop: 24,
    justifyContent: "center",
  },
  introCard: {
    backgroundColor: colors.introCardBg,
    borderRadius: 20,
    padding: 20,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 20,
        shadowOffset: { width: 0, height: 12 },
      },
      android: { elevation: 3 },
      default: {},
    }),
  },
  introBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: colors.introBadgeBg,
    marginBottom: 14,
  },
  introBadgeText: { fontSize: 26 },
  introTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    color: colors.text,
    marginBottom: 6,
  },
  introSub: {
    fontSize: 14,
    textAlign: "center",
    color: colors.textMuted,
    marginBottom: 16,
  },
  ctaBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  ctaBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  altLinkBtn: { alignItems: "center", marginTop: 12 },
  altLinkText: { color: colors.primary, fontWeight: "600" },

  screen: { flex: 1, backgroundColor: colors.bg },
  container: { flex: 1, paddingHorizontal: 20, paddingTop: 16 },

  stepLabel: {
    textAlign: "center",
    fontSize: 16,
    color: "#194b63",
    fontWeight: "600",
    marginBottom: 8,
  },
  header: { fontSize: 20, fontWeight: "700", marginTop: 8, marginBottom: 12 },
  subheader: { fontSize: 16, marginBottom: 16 },

  label: { color: colors.label, marginTop: 16, marginBottom: 8 },

  inputWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
    backgroundColor: colors.bg,
  },
  input: { fontSize: 16 },

  mapBtn: {
    backgroundColor: colors.primaryBg,
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    marginTop: 10,
  },
  mapBtnText: { fontWeight: "700", color: colors.primary },

  pickedLabel: { color: colors.gray600, marginTop: 6 },

  geoRow: { flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 },
  geoText: { color: colors.gray600 },

  nextBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 24,
    marginBottom: 10,
  },
  nextBtnText: { color: "#fff", fontWeight: "700", fontSize: 16 },

  skipBtn: { alignItems: "center", marginBottom: 16 },
  skipBtnText: { color: colors.primary },
});
