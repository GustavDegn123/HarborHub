import { StyleSheet } from "react-native";

export const colors = {
  bg: "#FFFFFF",
  text: "#111827",
  muted: "#6B7280",
  border: "#E5E7EB",
  primary: "#0A84FF",
  primaryDisabled: "#93C5FD",
  white: "#FFFFFF",
  starFilled: "#F59E0B",
  starEmpty: "#D1D5DB",
};

export default StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },

  content: {
    padding: 16,
    gap: 16, // hvis din RN-version ikke understøtter 'gap', kan du erstatte med marginer mellem elementerne
  },

  title: { fontSize: 22, fontWeight: "800", color: colors.text },
  subtitle: { color: colors.muted },

  starsRow: { flexDirection: "row", alignItems: "center" },
  starTouch: { padding: 4 },
  starIcon: { lineHeight: 30 }, // base; fontSize og farve sættes i komponenten

  ratingText: { marginLeft: 8, fontWeight: "600", color: colors.text },

  label: { fontWeight: "700", color: colors.text },

  input: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    padding: 12,
    minHeight: 100,
    textAlignVertical: "top",
    color: colors.text,
    backgroundColor: colors.white,
  },

  button: {
    paddingVertical: 14,
    borderRadius: 12,
    alignItems: "center",
  },
  buttonText: { color: colors.white, fontWeight: "800" },
});
