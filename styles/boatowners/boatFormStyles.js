// styles/boatowners/boatFormStyles.js
import { StyleSheet } from "react-native";
 
/* Rolig palet */
const C = {
  primary: "#165E8B",
  primaryDark: "#134E72",
  bg: "#F8FAFC",
  surface: "#FFFFFF",
  border: "#E5E7EB",
  soft: "#F3F4F6",
  text: "#0B1220",
  muted: "#606776ff",
};
 
/* Spacing-skala (nem at tweake) */
const S = {
  pagePadH: 20,
  pagePadV: 16,
  cardPad: 20,
  fieldGap: 18,          // afstand mellem enkeltfelter
  rowGap: 16,            // afstand mellem to felter i en række
  sectionGap: 22,        // afstand før/efter sektioner
  typeGap: 16,           // mellem Sejlbåd/Motorbåd
  footerTop: 26,         // luft før knappen
};
 
export default StyleSheet.create({
  /* Skærm & container */
  screen: { flex: 1, backgroundColor: C.bg },
  container: {
    paddingHorizontal: S.pagePadH,
    paddingTop: S.pagePadV,
    paddingBottom: S.pagePadV + 8,
  },
 
  /* Card omkring formularen */
  formCard: {
    backgroundColor: C.surface,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: S.cardPad,
  },
 
  /* Titel */
  title: {
    fontSize: 26,
    fontWeight: "800",
    letterSpacing: -0.2,
    color: C.text,
    marginBottom: S.sectionGap,
  },
 
  /* Felter */
  field: { marginBottom: S.fieldGap }, // brug denne wrapper rundt om hvert input
 
  input: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.surface,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 12,
    fontSize: 16,
    // fallback hvis du ikke bruger <View style={styles.field}>
    marginBottom: S.fieldGap,
  },
  inputFocus: { borderColor: C.primary },
  inputDisabled: { backgroundColor: C.soft, color: "#9CA3AF" },
 
  /* Række til to felter */
  row: {
    flexDirection: "row",
    gap: S.rowGap,
    marginBottom: S.fieldGap, // ekstra luft efter rækker
  },
  col: { flex: 1 },
 
  /* Bådtype: mere luft og klassisk */
  typeRow: {
    flexDirection: "row",
    gap: S.typeGap,           // 👉 tydelig afstand mellem knapperne
    marginBottom: S.sectionGap,
    marginTop: 4,
  },
  typeBtn: {
    flex: 1,
    alignItems: "center",
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
  },
  typeBtnActive: { backgroundColor: C.primary, borderColor: C.primary },
  typeBtnInactive: { backgroundColor: C.soft, borderColor: C.border },
  typeBtnText: { fontWeight: "700", fontSize: 15 },
  typeBtnTextActive: { color: "#FFFFFF" },
  typeBtnTextInactive: { color: "#3c4553ff" },
 
  /* Switch-række */
  switchRow: {
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    marginTop: S.sectionGap - 6,
    marginBottom: S.fieldGap - 6,
  },
  switchLabel: { fontSize: 16, color: C.text, fontWeight: "600" },
 
  /* Divider (hvis du vil sektionere) */
  divider: { height: 1, backgroundColor: C.border, marginVertical: S.sectionGap },
 
  /* Footer med ekstra luft før knappen */
  footerBar: {
    paddingHorizontal: S.pagePadH,
    paddingTop: S.footerTop, // 👉 mere luft til knappen
    paddingBottom: 14,
  },
 
  /* Gem-knap – klassisk og rolig */
  saveBtn: {
    backgroundColor: C.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  saveBtnPressed: { backgroundColor: C.primaryDark },
  saveBtnText: {
    color: "#FFFFFF",
    fontWeight: "800",
    fontSize: 17,
    letterSpacing: 0.2,
  },
saveBtnDisabled: { opacity: 0.75 },
  saveBtnInner: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
  },

  /* ---------- Success modal ---------- */
  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(11, 18, 32, 0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 22,
  },
  modalCard: {
    width: "100%",
    maxWidth: 420,
    backgroundColor: "#FFFFFF",
    borderRadius: 18,
    paddingVertical: 18,
    paddingHorizontal: 18,
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalBadge: {
    width: 54,
    height: 54,
    borderRadius: 16,
    backgroundColor: "rgba(22, 94, 139, 0.10)",
    alignItems: "center",
    justifyContent: "center",
    alignSelf: "center",
    marginBottom: 12,
    borderWidth: 1,
    borderColor: "rgba(22, 94, 139, 0.20)",
  },
  modalBadgeText: {
    fontSize: 28,
    fontWeight: "900",
    color: "#165E8B",
  },
  modalTitle: {
    fontSize: 20,
    fontWeight: "900",
    color: "#0B1220",
    textAlign: "center",
    marginBottom: 6,
  },
  modalSubtitle: {
    fontSize: 14,
    color: "#606776ff",
    textAlign: "center",
    lineHeight: 20,
    marginBottom: 14,
  },
  modalBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  modalPrimaryBtn: {
    flex: 1,
    backgroundColor: "#165E8B",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  modalPrimaryText: {
    color: "#FFFFFF",
    fontWeight: "900",
    fontSize: 15,
  },
  modalSecondaryBtn: {
    flex: 1,
    backgroundColor: "#F3F4F6",
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: "#E5E7EB",
  },
  modalSecondaryText: {
    color: "#0B1220",
    fontWeight: "900",
    fontSize: 15,
  },
});