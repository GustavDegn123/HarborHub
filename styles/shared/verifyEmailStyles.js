// styles/shared/verifyEmailStyles.js
import { StyleSheet } from "react-native";

const COLORS = {
  bg: "#FFFFFF",
  text: "#0F172A",         
  subtext: "#475569",      
  primary: "#0B6EEF",
  primaryText: "#FFFFFF",
  border: "#E2E8F0",      
  danger: "#E11D48",
  muted: "#94A3B8",        
  card: "#F8FAFC",        
};

export default StyleSheet.create({
  safe: {
    flex: 1,
    backgroundColor: COLORS.bg,
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 24,
    justifyContent: "space-between",
  },

  /* Top/Hero */
  hero: {
    marginTop: 24,
    alignItems: "center",
  },
  badge: {
    width: 84,
    height: 84,
    borderRadius: 20,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    marginBottom: 16,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  badgeEmoji: {
    fontSize: 38,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    color: COLORS.text,
    textAlign: "center",
    marginBottom: 8,
  },
  subtitle: {
    fontSize: 16,
    color: COLORS.subtext,
    textAlign: "center",
  },
  subtitleBold: {
    fontWeight: "600",
    color: COLORS.text,
  },
  helper: {
    marginTop: 6,
    fontSize: 14,
    color: COLORS.muted,
    textAlign: "center",
  },

  actions: {
    gap: 12,
    marginBottom: 28,
  },
  buttonPrimary: {
    backgroundColor: COLORS.primary,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    shadowColor: "#000",
    shadowOpacity: 0.06,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 2 },
    elevation: 2,
  },
  buttonPrimaryText: {
    color: COLORS.primaryText,
    fontSize: 16,
    fontWeight: "600",
  },
  buttonSecondary: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    paddingVertical: 14,
    paddingHorizontal: 16,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  buttonSecondaryText: {
    color: COLORS.text,
    fontSize: 16,
    fontWeight: "600",
  },
  buttonGhostDanger: {
    backgroundColor: "transparent",
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
  },
  buttonGhostDangerText: {
    color: COLORS.danger,
    fontSize: 15,
    fontWeight: "600",
  },
  buttonDisabled: {
    opacity: 0.6,
  },

  loadingOverlay: {
    ...StyleSheet.absoluteFillObject,
    backgroundColor: "rgba(255,255,255,0.6)",
    alignItems: "center",
    justifyContent: "center",
  },
});
