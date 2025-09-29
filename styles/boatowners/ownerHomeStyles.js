import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    padding: 20,
  },
  title: {
    fontSize: 24,
    fontWeight: "700",
    marginBottom: 10,
  },
  subtitle: {
    fontSize: 16,
    color: "#555",
    textAlign: "center",
    marginBottom: 20,
  },
  button: {
    backgroundColor: "#1f5c7d",
    padding: 14,
    borderRadius: 10,
    marginTop: 10,
    width: "80%",
  },
  buttonText: {
    color: "white",
    textAlign: "center",
    fontWeight: "600",
  },
  logoutButton: {
    backgroundColor: "#a94442",
  },
});
