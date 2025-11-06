// /styles/boatowners/newRequestStyles.js
import { StyleSheet, Platform } from "react-native";

export const colors = {
  primary: "#0B5FA5",
  bg: "#F5F8FB",
  text: "#0F172A",
  border: "#E6EEF3",
  white: "#FFFFFF",
  muted: "#64748B",
};

export default StyleSheet.create({
  screen: { flex: 1, backgroundColor: colors.bg },
  container: {
    flex: 1,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  scrollContent: {
    paddingBottom: 120, // ekstra plads til sticky nav
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },

  header: {
    fontSize: 24,
    fontWeight: "900",
    textAlign: "center",
    color: colors.primary,
    marginBottom: 12,
    letterSpacing: 0.3,
  },

  // Sektion-kort
  card: {
    backgroundColor: colors.white,
    borderRadius: 18,
    padding: 16,
    marginBottom: 14,
    borderWidth: 1,
    borderColor: "#E8EEF4",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 2 },
      default: {},
    }),
  },

  sectionTitle: {
    fontSize: 16,
    fontWeight: "800",
    color: colors.text,
    marginBottom: 10,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: colors.text,
    marginBottom: 8,
  },

  inputWrapper: {
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  input: {
    fontSize: 15,
    color: colors.text,
  },
  inputMultiline: {
    minHeight: 100,
    textAlignVertical: "top",
  },

  // Knapper til valg-lister
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  selectButton: {
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  selectButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  selectButtonText: {
    fontSize: 14,
    color: colors.text,
    fontWeight: "700",
  },
  selectButtonTextSelected: {
    color: colors.white,
  },

  // Hvornår
  optionRow: {
    flexDirection: "row",
    gap: 10,
  },
  optionButton: {
    flex: 1,
    paddingVertical: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: colors.border,
    alignItems: "center",
    backgroundColor: colors.white,
  },
  optionButtonSelected: {
    backgroundColor: colors.primary,
    borderColor: colors.primary,
  },
  optionText: {
    color: colors.text,
    fontWeight: "800",
  },
  optionTextSelected: {
    color: colors.white,
  },
  dateBadge: {
    marginTop: 8,
    fontWeight: "700",
    color: colors.text,
  },

  // Tidsrum
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginTop: 10,
    marginBottom: 6,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 14,
    color: colors.text,
  },
  timeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 10,
  },
  timeButton: {
    flexBasis: "48%",
    borderWidth: 1,
    borderColor: colors.border,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: colors.white,
  },
  timeButtonSelected: {
    borderColor: colors.primary,
    backgroundColor: "#E9F3FF",
  },
  timeLabel: {
    fontSize: 15,
    fontWeight: "800",
    color: colors.primary,
  },
  timeSub: {
    fontSize: 12,
    color: colors.muted,
  },

  // Kort/placering
  mapBtnRow: {
    flexDirection: "row",
    gap: 10,
    marginTop: 6,
  },
  btnBig: { flex: 1 },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
  },
  outlineBtn: {
    borderWidth: 1.5,
    borderColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 12,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  primaryBtnText: {
    color: colors.white,
    fontWeight: "900",
    fontSize: 14,
  },
  outlineBtnText: {
    color: colors.primary,
    fontWeight: "900",
    fontSize: 14,
  },
  pickedLabel: {
    marginTop: 6,
    color: colors.muted,
  },

  // Billeder
  imagesRow: {
    flexDirection: "row",
    gap: 10,
  },
  imagePreviewWrapper: {
    alignItems: "center",
    marginTop: 10,
  },
  imagePreview: {
    width: 220,
    height: 220,
    borderRadius: 12,
  },
  imagePreviewLabel: {
    marginTop: 6,
    color: colors.text,
  },

  // Submit
  submitButton: {
    marginTop: 6,
    backgroundColor: colors.primary,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  submitButtonText: {
    color: colors.white,
    fontSize: 16,
    fontWeight: "900",
    letterSpacing: 0.2,
  },

  // Stepper
  progressWrap: {
    flexDirection: "row",
    alignItems: "center",
    marginBottom: 10,
    flexWrap: "wrap",
  },
  progressItem: {
    flexDirection: "row",
    alignItems: "center",
    flexShrink: 1,
    marginRight: 8,
    marginBottom: 6,
  },
  progressDot: {
    width: 28,
    height: 28,
    borderRadius: 14,
    borderWidth: 2,
    borderColor: colors.border,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  progressDotActive: { borderColor: colors.primary },
  progressDotDone: { backgroundColor: colors.primary, borderColor: colors.primary },
  progressNumber: { color: colors.muted, fontWeight: "900" },
  progressTick: { color: "#fff" },
  progressLabel: { marginHorizontal: 8, maxWidth: 140, color: colors.muted },
  progressLabelActive: { color: colors.text, fontWeight: "900" },
  progressLabelDone: { color: colors.text },
  progressLine: { width: 18, height: 2, backgroundColor: colors.border },

  // Opsummering
  summaryRow: { marginBottom: 4, color: colors.text },
  summaryLabel: { fontWeight: "900", color: colors.text },

  // Sticky wizard navigation
  wizardNav: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    padding: 12,
    paddingHorizontal: 16,
    backgroundColor: "rgba(245, 248, 251, 0.96)",
    flexDirection: "row",
    gap: 10,
    borderTopWidth: 1,
    borderTopColor: "#E7EDF3",
  },
  wizardBtn: {
    flex: 1,
    paddingVertical: 14,
    borderRadius: 14,
    alignItems: "center",
    borderWidth: 1,
    borderColor: colors.border,
    backgroundColor: "#fff",
  },
  wizardBtnDisabled: { opacity: 0.5 },
  wizardBtnPrimary: { backgroundColor: colors.primary, borderColor: colors.primary },
  wizardBtnText: { fontWeight: "900", color: colors.text },
  wizardBtnTextPrimary: { color: "#fff" },
});
