// /styles/mechanics/chooseWorkStyles.js
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  loadingContainer: {
    flex: 1,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 8,
    color: "#4b5563",
  },
  subtitle: {
    textAlign: "center",
    fontSize: 16,
    color: "#194b63",
    fontWeight: "600",
    marginBottom: 8,
  },
  title: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 16,
  },
  suggestionButton: {
    backgroundColor: "#e8f0f4",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 16,
    marginBottom: 12,
  },
  suggestionButtonText: {
    fontWeight: "700",
    color: "#1f5c7d",
  },
  orText: {
    textAlign: "center",
    color: "#6b7280",
    marginBottom: 12,
  },
  listButton: {
    backgroundColor: "#e8f0f4",
    paddingVertical: 14,
    alignItems: "center",
    borderRadius: 16,
    marginBottom: 16,
  },
  listButtonText: {
    fontWeight: "700",
    color: "#1f5c7d",
  },
  listContent: {
    paddingVertical: 6,
  },
  serviceItem: {
    paddingVertical: 12,
    paddingHorizontal: 14,
    marginVertical: 6,
    borderRadius: 12,
    borderWidth: 1,
  },
  serviceItemSelected: {
    borderColor: "#1f5c7d",
    backgroundColor: "#eff6fb",
  },
  serviceItemUnselected: {
    borderColor: "#d1d5db",
    backgroundColor: "#fff",
  },
  serviceItemText: {
    fontSize: 16,
  },
  selectedInfo: {
    textAlign: "center",
    color: "#6b7280",
    marginTop: 8,
  },
  spacer: {
    flex: 1,
  },
  doneButton: {
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 24,
    marginBottom: 10,
  },
  doneButtonEnabled: {
    backgroundColor: "#1f5c7d",
  },
  doneButtonDisabled: {
    backgroundColor: "#93c5fd",
  },
  doneButtonText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  cancelButton: {
    alignItems: "center",
    marginBottom: 16,
  },
  cancelButtonText: {
    color: "#1f5c7d",
  },
});
