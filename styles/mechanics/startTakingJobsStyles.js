import { StyleSheet } from "react-native";

export default StyleSheet.create({
  screen: {
    flex: 1,
    backgroundColor: "#fff",
  },
  container: {
    flex: 1,
    paddingHorizontal: 20,
    paddingTop: 16,
  },
  stepLabel: {
    textAlign: "center",
    fontSize: 16,
    color: "#194b63",
    fontWeight: "600",
    marginBottom: 8,
  },
  header: {
    fontSize: 20,
    fontWeight: "700",
    marginTop: 8,
    marginBottom: 12,
  },
  subheader: {
    fontSize: 16,
    marginBottom: 16,
  },
  label: {
    color: "#4b5563",
    marginTop: 16,
    marginBottom: 8,
  },
  inputWrapper: {
    borderWidth: 1,
    borderColor: "#d1d5db",
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  input: {
    fontSize: 16,
  },
  mapBtn: {
    backgroundColor: "#e8f0f4",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 12,
    marginTop: 10,
  },
  mapBtnText: {
    fontWeight: "700",
    color: "#1f5c7d",
  },
  pickedLabel: {
    color: "#6b7280",
    marginTop: 6,
  },
  geoRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    marginBottom: 8,
  },
  geoText: {
    color: "#6b7280",
  },
  nextBtn: {
    backgroundColor: "#1f5c7d",
    paddingVertical: 16,
    alignItems: "center",
    borderRadius: 24,
    marginBottom: 10,
  },
  nextBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  skipBtn: {
    alignItems: "center",
    marginBottom: 16,
  },
  skipBtnText: {
    color: "#1f5c7d",
  },
});
