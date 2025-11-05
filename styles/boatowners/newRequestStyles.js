import { StyleSheet, Platform } from "react-native";

export const colors = {
  primary: "#0B5FA5",
  bg: "#F5F8FB",
  text: "#1E293B",
  border: "#E6EEF3",
  white: "#FFFFFF",
  muted: "#64748B",
};

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.bg,
    paddingHorizontal: 16,
    paddingTop: 14,
  },
  scrollContent: {
    paddingBottom: 24,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: colors.bg,
  },

  header: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    color: colors.primary,
    marginBottom: 12,
  },

  // Sektion-kort
  card: {
    backgroundColor: colors.white,
    borderRadius: 16,
    padding: 14,
    marginBottom: 14,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 3 },
      default: {},
    }),
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
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
    minHeight: 90,
    textAlignVertical: "top",
  },

  // Knapper til valg-lister
  buttonGrid: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
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
    fontWeight: "600",
  },
  selectButtonTextSelected: {
    color: colors.white,
  },

  // Hvornår
  optionRow: {
    flexDirection: "row",
    gap: 8,
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
    fontWeight: "600",
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
    gap: 8,
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
    fontWeight: "700",
    color: colors.primary,
  },
  timeSub: {
    fontSize: 12,
    color: colors.muted,
  },

  // Kort/placering
  mapBtnRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  primaryBtn: {
    backgroundColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: colors.primary,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: colors.white,
  },
  primaryBtnText: {
    color: colors.white,
    fontWeight: "800",
    fontSize: 14,
  },
  outlineBtnText: {
    color: colors.primary,
    fontWeight: "800",
    fontSize: 14,
  },
  pickedLabel: {
    marginTop: 6,
    color: "#0F172A",
  },

  // Billeder
  imagesRow: {
    flexDirection: "row",
    gap: 8,
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
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
