import { StyleSheet } from "react-native";

const colors = {
  bg: "#FFFFFF",
  surface: "#F3F4F6",
  border: "#E5E7EB",
  text: "#111827",
  muted: "#6B7280",
  primary: "#0A84FF",
  primaryDisabled: "#93C5FD",
  bubbleTheirs: "#E5E7EB",
  bubbleMine: "#0A84FF",
  bubbleMineText: "#FFFFFF",
};

export default StyleSheet.create({
  safe: { flex: 1, backgroundColor: colors.bg },
  flex1: { flex: 1 },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
  centerText: { marginTop: 8, color: colors.muted },

  listContent: { paddingVertical: 10 },

  /* Message rows */
  msgRow: { paddingVertical: 4, paddingHorizontal: 10 },
  msgRowMine: { alignItems: "flex-end" },
  msgRowTheirs: { alignItems: "flex-start" },

  /* Bubbles */
  bubble: {
    maxWidth: "80%",
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderRadius: 14,
  },
  bubbleCornerMine: { borderBottomRightRadius: 2, borderBottomLeftRadius: 14 },
  bubbleCornerTheirs: { borderBottomRightRadius: 14, borderBottomLeftRadius: 2 },
  bubbleMine: { backgroundColor: colors.bubbleMine },
  bubbleTheirs: { backgroundColor: colors.bubbleTheirs },

  bubbleText: { fontSize: 16, color: colors.text },
  bubbleTextMine: { color: colors.bubbleMineText },

  time: {
    fontSize: 10,
    marginTop: 4,
    alignSelf: "flex-end",
    color: colors.muted,
  },
  timeMine: { color: "rgba(255,255,255,0.8)" },

  /* Composer */
  composer: {
    flexDirection: "row",
    alignItems: "center",
    padding: 10,
    borderTopWidth: 1,
    borderTopColor: colors.border,
    gap: 8,
    backgroundColor: colors.bg,
  },
  input: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 20,
    paddingHorizontal: 14,
    paddingVertical: 10,
    fontSize: 16,
    color: colors.text,
  },
  sendBtn: {
    backgroundColor: colors.primary,
    paddingVertical: 10,
    paddingHorizontal: 16,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
  },
  sendBtnDisabled: { backgroundColor: colors.primaryDisabled },
  sendBtnText: { color: "#FFFFFF", fontWeight: "600" },
});
