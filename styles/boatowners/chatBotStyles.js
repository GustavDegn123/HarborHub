import { Platform, StyleSheet } from "react-native";

export const colors = {
  bg: "#FFFFFF",
  text: "#111827",
  muted: "#667085",
  primary: "#0A84FF",
  border: "#E5E7EB",
  assistantBg: "#F3F4F6",
  placeholder: "#667085",
  white: "#FFFFFF",
};

const shadow = Platform.select({
  ios: {
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 8,
    shadowOffset: { width: 0, height: 3 },
  },
  android: { elevation: 4 },
  default: {},
});

export default StyleSheet.create({
  root: { flex: 1, backgroundColor: colors.bg },
  flex1: { flex: 1 },
  listContent: { padding: 16 },

  bubbleBase: {
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 16,
    marginVertical: 6,
    maxWidth: "82%",
    alignSelf: "flex-start",
  },
  bubbleUser: { alignSelf: "flex-end", backgroundColor: colors.primary },
  bubbleAssistant: { alignSelf: "flex-start", backgroundColor: colors.assistantBg },

  bubbleText: { color: colors.text, fontSize: 15, lineHeight: 20 },
  bubbleTextUser: { color: colors.white },

  composer: {
    position: "absolute",
    left: 12,
    right: 12,
    backgroundColor: colors.white,
    borderRadius: 24,
    borderWidth: 1,
    borderColor: colors.border,
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 6,
    ...shadow,
  },

  input: { flex: 1, padding: 10, fontSize: 15 },
});
