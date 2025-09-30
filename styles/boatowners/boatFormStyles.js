import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    padding: 20,
  },
  title: {
    fontSize: 22,
    fontWeight: "700",
    marginBottom: 20,
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginBottom: 12,
    backgroundColor: "#f9f9f9",
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 12,
  },

  /* --- TYPE KNAPPER --- */
  typeBtn: {
    flex: 1,
    padding: 12,
    borderWidth: 1,
    borderRadius: 10,
    alignItems: "center",
    marginHorizontal: 4,
  },
  typeBtnActive: {
    backgroundColor: "#1f5c7d", // aktiv: mørk blå
    borderColor: "#1f5c7d",
  },
  typeBtnInactive: {
    backgroundColor: "#f1f5f9", // inaktiv: lys grå
    borderColor: "#cbd5e1",
  },
  typeBtnText: {
    fontWeight: "600",
  },
  typeBtnTextActive: {
    color: "#ffffff",
  },
  typeBtnTextInactive: {
    color: "#475569", // mørk grå tekst på lys baggrund
  },

  /* --- GEM-KNAP --- */
  saveBtn: {
    backgroundColor: "#1f5c7d",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  saveBtnText: {
    color: "white",
    fontWeight: "700",
    fontSize: 16,
  },
});