import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  title: { fontSize: 24, fontWeight: "bold", marginBottom: 20, textAlign: "center" },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, marginBottom: 12, borderRadius: 8 },
  label: { fontSize: 16, fontWeight: "600", marginBottom: 10 },
  roleContainer: { flexDirection: "row", justifyContent: "space-between", marginBottom: 20 },
  roleButton: {
    flex: 1,
    padding: 15,
    height: 50,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    marginHorizontal: 5,
    alignItems: "center",
    backgroundColor: "#f9f9f9",
  },
  roleButtonActive: {
    borderColor: "#007bff",
    backgroundColor: "#e6f0ff",
  },
  roleText: { fontSize: 14, fontWeight: "500", color: "#555" },
  roleTextActive: { color: "#007bff", fontWeight: "700" },
  button: { backgroundColor: "#007bff", padding: 15, borderRadius: 8, alignItems: "center" },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  link: { color: "#007bff", textAlign: "center", marginTop: 15 },
});
