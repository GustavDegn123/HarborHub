// styles/boatowners/requestBidsStyles.js
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#f6f9fc",
  },
  container: {
    padding: 16,
  },
  loader: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  loaderText: {
    marginTop: 8,
    color: "#6b7280",
  },
  title: {
    fontSize: 22,
    fontWeight: "900",
    color: "#0f1f2a",
    marginBottom: 16,
  },
  emptyText: {
    fontSize: 16,
    color: "#6b7280",
    textAlign: "center",
    marginTop: 20,
  },
  bidCard: {
    backgroundColor: "#fff",
    borderRadius: 14,
    padding: 16,
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "#e5e7eb",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 4,
    elevation: 2,
  },
  bidPrice: {
    fontSize: 18,
    fontWeight: "800",
    color: "#1f5c7d",
    marginBottom: 6,
  },
  bidMessage: {
    fontSize: 14,
    color: "#374151",
    marginBottom: 12,
  },
  btnPrimary: {
    backgroundColor: "#1f5c7d",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  btnPrimaryText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 15,
  },
providerBox: {
  marginTop: 8,
  padding: 8,
  backgroundColor: "#f0f4f8",
  borderRadius: 8,
},
providerName: {
  fontWeight: "700",
  color: "#0f1f2a",
},
providerEmail: {
  fontSize: 12,
  color: "#6b7280",
}
});
