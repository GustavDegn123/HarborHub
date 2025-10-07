import { StyleSheet, Platform } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
    paddingBottom: 24,
    backgroundColor: "#F4F8FB", // lys blålig
  },

  header: {
    fontSize: 24,
    fontWeight: "800",
    color: "#0B5FA5",
    textAlign: "center",
    marginBottom: 16,
    letterSpacing: 0.2,
  },

  card: {
    backgroundColor: "#fff",
    borderRadius: 18,
    paddingHorizontal: 18,
    paddingVertical: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 4 },
    }),
  },

  row: {
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: "#E7EEF3",
  },
  rowLast: {
    borderBottomWidth: 0,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: "#0B5FA5",
    marginBottom: 4,
    textTransform: "none",
  },

  value: {
    fontSize: 16,
    color: "#1E293B",
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F4F8FB",
  },
});
