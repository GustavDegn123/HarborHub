// styles/shared/mapPickerStyles.js
import { StyleSheet, Platform } from "react-native";

const PRIMARY = "#0B5FA5";
const PANEL_BG = "#FFFFFF";

export default StyleSheet.create({
  panel: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 12,
    backgroundColor: PANEL_BG,
    borderRadius: 16,
    padding: 12,
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 12,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 3 },
    }),
  },
  row: { flexDirection: "row", alignItems: "center" },
  addr: { flex: 1, color: "#0F172A", fontSize: 14, marginLeft: 8 },
  btn: {
    marginTop: 10,
    backgroundColor: PRIMARY,
    borderRadius: 12,
    alignItems: "center",
    paddingVertical: 12,
  },
  btnText: { color: "#fff", fontWeight: "800", fontSize: 15 },

  // Floating action button (øverst til højre)
  fabWrap: {
    position: "absolute",
    top: 12,
    right: 12,
  },
  fab: {
    backgroundColor: PANEL_BG,
    borderRadius: 12,
    paddingVertical: 8,
    paddingHorizontal: 12,
    borderWidth: 1,
    borderColor: "#E6EEF3",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.1,
        shadowRadius: 8,
        shadowOffset: { width: 0, height: 4 },
      },
      android: { elevation: 2 },
    }),
  },
  fabText: { color: PRIMARY, fontWeight: "800" },
});
