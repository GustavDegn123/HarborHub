import { StyleSheet, Platform } from "react-native";

const PRIMARY = "#0B5FA5";
const BG = "#F5F8FB";
const TEXT = "#1E293B";
const BORDER = "#E6EEF3";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: BG,
    paddingHorizontal: 16,
    paddingTop: 14,
    paddingBottom: 24,
  },

  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: BG,
  },

  header: {
    fontSize: 22,
    fontWeight: "800",
    textAlign: "center",
    color: PRIMARY,
    marginBottom: 12,
  },

  // Sektion-kort
  card: {
    backgroundColor: "#fff",
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
    }),
  },

  sectionTitle: {
    fontSize: 15,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 10,
  },

  label: {
    fontSize: 13,
    fontWeight: "700",
    color: TEXT,
    marginBottom: 8,
  },

  inputWrapper: {
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    backgroundColor: "#fff",
    paddingHorizontal: 12,
    paddingVertical: 10,
    marginBottom: 10,
  },
  input: {
    fontSize: 15,
    color: TEXT,
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
    borderColor: BORDER,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  selectButtonSelected: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  selectButtonText: {
    fontSize: 14,
    color: TEXT,
    fontWeight: "600",
  },
  selectButtonTextSelected: {
    color: "#fff",
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
    borderColor: BORDER,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  optionButtonSelected: {
    backgroundColor: PRIMARY,
    borderColor: PRIMARY,
  },
  optionText: {
    color: TEXT,
    fontWeight: "600",
  },
  optionTextSelected: {
    color: "#fff",
  },
  dateBadge: {
    marginTop: 8,
    fontWeight: "700",
    color: TEXT,
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
    color: TEXT,
  },
  timeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  timeButton: {
    flexBasis: "48%",
    borderWidth: 1,
    borderColor: BORDER,
    borderRadius: 12,
    paddingVertical: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  timeButtonSelected: {
    borderColor: PRIMARY,
    backgroundColor: "#E9F3FF",
  },
  timeLabel: {
    fontSize: 15,
    fontWeight: "700",
    color: PRIMARY,
  },
  timeSub: {
    fontSize: 12,
    color: "#64748B",
  },

  // Kort/placering
  mapBtnRow: {
    flexDirection: "row",
    gap: 8,
    marginTop: 6,
  },
  primaryBtn: {
    backgroundColor: PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
  },
  outlineBtn: {
    borderWidth: 1,
    borderColor: PRIMARY,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  primaryBtnText: {
    color: "#fff",
    fontWeight: "800",
    fontSize: 14,
  },
  outlineBtnText: {
    color: PRIMARY,
    fontWeight: "800",
    fontSize: 14,
  },
  pickedLabel: {
    marginTop: 6,
    color: "#0F172A",
  },

  // Submit
  submitButton: {
    marginTop: 6,
    backgroundColor: PRIMARY,
    paddingVertical: 16,
    borderRadius: 14,
    alignItems: "center",
  },
  submitButtonText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "800",
    letterSpacing: 0.2,
  },
});
