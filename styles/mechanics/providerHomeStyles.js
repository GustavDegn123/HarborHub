// /styles/mechanics/providerHomeStyles.js
import { StyleSheet } from "react-native";

const BLUE = "#1f5c7d";
const BLUE_DARK = "#184a63";
const BG = "#f3f7fb";

export default StyleSheet.create({
  screen: { flex: 1, backgroundColor: BG },

  hero: {
    paddingTop: 28,
    paddingHorizontal: 20,
  },
  brandRow: { gap: 8 },
  badge: {
    alignSelf: "flex-start",
    backgroundColor: "#ffffff",
    borderColor: "#e6eef4",
    borderWidth: 1,
    paddingVertical: 6,
    paddingHorizontal: 12,
    borderRadius: 999,
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 2,
  },
  badgeText: { fontWeight: "800", color: BLUE, letterSpacing: 0.3 },
  tagline: { color: "#5a6b78", fontWeight: "600" },

  illustrationWrap: { alignItems: "center", marginTop: 18 },
  illustrationCircle: {
    width: 96,
    height: 96,
    borderRadius: 64,
    backgroundColor: "#e9f2f9",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: "#d7e6f3",
  },
  boatEmoji: { fontSize: 44 },

  card: {
    marginTop: 16,
    backgroundColor: "#ffffff",
    borderRadius: 16,
    marginHorizontal: 16,
    padding: 18,
    borderWidth: 1,
    borderColor: "#e6eef4",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 12,
    shadowOffset: { width: 0, height: 6 },
    elevation: 3,
  },
  title: { fontSize: 22, color: "#0f1f2a", fontWeight: "900" },
  subtitle: { marginTop: 6, color: "#4b5563" },

  ctaPrimary: {
    marginTop: 14,
    backgroundColor: BLUE,
    borderRadius: 14,
    paddingVertical: 14,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 4 },
    elevation: 3,
  },
  ctaPrimaryText: { color: "#fff", fontSize: 16, fontWeight: "800" },

  ctaSecondary: {
    marginTop: 10,
    backgroundColor: "#f2f8fc",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#cfe1ec",
    paddingVertical: 14,
    alignItems: "center",
  },
  ctaSecondaryText: { color: BLUE, fontSize: 16, fontWeight: "800" },

  ctaGhost: {
    backgroundColor: "#fff5f5",
    borderRadius: 14,
    borderWidth: 1,
    borderColor: "#ffd1d1",
    paddingVertical: 12,
    alignItems: "center",
  },
  ctaGhostText: { color: "#e54848", fontSize: 16, fontWeight: "800" },

  footer: { alignItems: "center", marginTop: 18 },
  footerText: { color: "#8aa0b0", fontSize: 12, fontWeight: "700" },
});
