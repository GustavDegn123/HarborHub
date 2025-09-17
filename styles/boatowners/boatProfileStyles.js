import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    padding: 20,
    backgroundColor: "#f4f9fc", // lys blålig baggrund
  },
  header: {
    fontSize: 26,
    fontWeight: "700",
    color: "#1f5c7d",
    marginBottom: 20,
    textAlign: "center",
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 20,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 6,
    shadowOffset: { width: 0, height: 3 },
    elevation: 4,
  },
  row: {
    marginBottom: 16,
    borderBottomWidth: 1,
    borderBottomColor: "#e6eef2",
    paddingBottom: 8,
  },
  label: {
    fontSize: 14,
    fontWeight: "700",
    color: "#1f5c7d",
    marginBottom: 4,
    textTransform: "capitalize", // gør labels pænere
  },
  value: {
    fontSize: 16,
    color: "#333",
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
});
