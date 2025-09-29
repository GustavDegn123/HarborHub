import { StyleSheet } from "react-native";

export default StyleSheet.create({
  panel: {
    position: "absolute",
    left: 12,
    right: 12,
    bottom: 16,
    backgroundColor: "white",
    borderRadius: 14,
    padding: 12,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 3,
  },
  row: {
    flexDirection: "row",
    alignItems: "center",
  },
  addr: {
    color: "#374151",
    fontSize: 14,
    marginTop: 2,
  },
  btn: {
    marginTop: 10,
    backgroundColor: "#1f5c7d",
    paddingVertical: 12,
    alignItems: "center",
    borderRadius: 10,
  },
  btnText: {
    color: "white",
    fontWeight: "700",
  },
});
