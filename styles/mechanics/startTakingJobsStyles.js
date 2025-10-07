import { StyleSheet } from "react-native";

export default StyleSheet.create({
  /* ---------- Intro ---------- */
  introScreen: {
    flex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 20,
    paddingTop: 24,
    justifyContent: "center",
  },
  introCard: {
    backgroundColor: "#F8FAFC",
    borderRadius: 20,
    padding: 20,
    // iOS
    shadowColor: "#000",
    shadowOpacity: 0.08,
    shadowRadius: 20,
    shadowOffset: { width: 0, height: 12 },
    // Android
    elevation: 3,
  },
  introBadge: {
    width: 60,
    height: 60,
    borderRadius: 30,
    alignSelf: "center",
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#E6F0FB",
    marginBottom: 14,
  },
  introBadgeText: {
    fontSize: 26,
  },
  introTitle: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    color: "#0f172a",
    marginBottom: 6,
  },
  introSub: {
    fontSize: 14,
    textAlign: "center",
    color: "#475569",
    marginBottom: 16,
  },
  ctaBtn: {
    backgroundColor: "#1f5c7d",
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  ctaBtnText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 16,
  },
  altLinkBtn: {
    alignItems: "center",
    marginTop: 12,
  },
  altLinkText: {
    color: "#1f5c7d",
    fontWeight: "600",
  },

  /* ---------- Formular ---------- */
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
