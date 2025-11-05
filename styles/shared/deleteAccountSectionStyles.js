import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    marginTop: 24,
    padding: 16,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#FCA5A5",
    backgroundColor: "#FEF2F2",
  },
  title: {
    fontWeight: "800",
    color: "#991B1B",
    marginBottom: 6,
  },
  desc: {
    color: "#7F1D1D",
    marginBottom: 12,
  },
  deleteBtn: {
    backgroundColor: "#dc2626",
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  deleteBtnLoading: {
    backgroundColor: "#f87171",
    opacity: 0.9,
  },
  deleteBtnText: {
    color: "#fff",
    fontWeight: "800",
  },
});
