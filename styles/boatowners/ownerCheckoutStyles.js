import { StyleSheet } from "react-native";

const colors = {
  bg: "#ffffff",
  border: "#E5E7EB",
  text: "#0f172a",
  muted: "#6B7280",
  primary: "#0A84FF",
  dark: "#111827",
  errorBg: "#FEF2F2",
  errorBorder: "#FCA5A5",
  errorText: "#991B1B",
};

export default StyleSheet.create({
  screen: {
    flex: 1,
    padding: 16,
    gap: 16,
    backgroundColor: colors.bg,
  },

  center: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
    padding: 16,
    backgroundColor: colors.bg,
  },
  centerText: { marginTop: 8, color: colors.muted },

  title: { fontSize: 22, fontWeight: "800", color: colors.text },

  card: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 16,
    backgroundColor: colors.bg,
  },
  cardTitle: { fontSize: 16, fontWeight: "700", color: colors.text },
  cardSubtitle: { color: colors.muted, marginTop: 6 },

  errorBox: {
    backgroundColor: colors.errorBg,
    borderWidth: 1,
    borderColor: colors.errorBorder,
    borderRadius: 8,
    padding: 12,
  },
  errorTitle: { color: colors.errorText, fontWeight: "700", marginBottom: 4 },
  errorText: { color: colors.errorText },

  payBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 14,
    borderRadius: 10,
    alignItems: "center",
  },
  payBtnText: { color: "#fff", fontWeight: "700" },

  retryBtn: {
    backgroundColor: colors.dark,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  retryBtnText: { color: "#fff", fontWeight: "600" },

  backBtn: {
    backgroundColor: colors.muted,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  backBtnText: { color: "#fff", fontWeight: "600" },

  btnDisabled: { opacity: 0.7 },
});
