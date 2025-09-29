// /styles/newRequestStyles.js
import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#fff",
    padding: 20,
  },
  center: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
  },
  header: {
    fontSize: 22,
    fontWeight: "bold",
    textAlign: "center",
    marginBottom: 20,
    color: "#001f54",
  },
  label: {
    fontSize: 16,
    fontWeight: "600",
    marginBottom: 10,
    color: "#333",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 12,
    marginBottom: 20,
    backgroundColor: "#f9f9f9",
    fontSize: 15,
  },
  optionRow: {
    flexDirection: "row",
    justifyContent: "space-between",
    marginBottom: 15,
  },
  optionButton: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 6,
    paddingVertical: 12,
    marginHorizontal: 4,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  optionButtonSelected: {
    backgroundColor: "#001f54",
    borderColor: "#001f54",
  },
  optionText: {
    color: "#333",
    fontWeight: "500",
  },
  optionTextSelected: {
    color: "#fff",
    fontWeight: "600",
  },
  checkboxContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 15,
  },
  checkboxLabel: {
    marginLeft: 8,
    fontSize: 15,
    color: "#333",
  },
  timeRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    justifyContent: "space-between",
    marginTop: 10,
  },
  timeButton: {
    width: "48%",
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    padding: 15,
    marginBottom: 12,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  timeButtonSelected: {
    borderColor: "#001f54",
    backgroundColor: "#e6f0ff",
  },
  timeLabel: {
    fontSize: 16,
    fontWeight: "600",
    color: "#001f54",
  },
  timeSub: {
    fontSize: 13,
    color: "#555",
  },
  submitButton: {
    marginTop: 20,
    backgroundColor: "#1f5c7d",
    padding: 16,
    borderRadius: 10,
    width: "80%",
    alignItems: "center",
    alignSelf: "center",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.15,
    shadowRadius: 3,
    elevation: 3, // Android shadow
  },
  submitButtonText: {
    color: "white",
    fontSize: 16,
    fontWeight: "700",
  },
buttonGrid: {
  flexDirection: "row",
  flexWrap: "wrap",
  justifyContent: "space-between",
  marginBottom: 20,
},

selectButton: {
  flexBasis: "48%", // 2 per række
  paddingVertical: 12,
  paddingHorizontal: 8,
  borderWidth: 1,
  borderColor: "#ccc",
  borderRadius: 8,
  marginBottom: 10,
  alignItems: "center",
  backgroundColor: "#f9f9f9",
},

selectButtonSelected: {
  backgroundColor: "#001f54",
  borderColor: "#001f54",
},

selectButtonText: {
  fontSize: 14,
  color: "#333",
  fontWeight: "500",
},

selectButtonTextSelected: {
  color: "#fff",
  fontWeight: "600",
},
});
