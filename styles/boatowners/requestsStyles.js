import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 12 },

  card: {
    backgroundColor: "#f9f9f9",
    padding: 12,
    borderRadius: 8,
    marginBottom: 10,
  },
  cardTitle: { fontSize: 16, fontWeight: "600" },
  status: { marginTop: 6, color: "#555" },

  newBtn: {
    backgroundColor: "#1f5c7d",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  newBtnText: { color: "white", fontWeight: "700" },
});
