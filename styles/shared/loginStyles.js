import { StyleSheet } from "react-native";

export default StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: "center",
    padding: 20,
    backgroundColor: "#fff",
  },
  logoImage: {
    width: 160,
    height: 160,
    resizeMode: "contain",
    alignSelf: "center",
    marginBottom: 30,
  },
  socialButton: {
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginBottom: 12,
  },
  appleButton: {
    backgroundColor: "#000",
  },
  facebookButton: {
    backgroundColor: "#1877f2",
  },
  googleButton: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: "#ccc",
  },
  socialContent: {
    flexDirection: "row",
    alignItems: "center",
  },
  icon: {
    width: 20,
    height: 20,
    resizeMode: "contain",
    marginRight: 8,
  },
  appleText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  socialText: {
    color: "#fff",
    fontSize: 16,
    fontWeight: "600",
  },
  dividerContainer: {
    flexDirection: "row",
    alignItems: "center",
    marginVertical: 20,
  },
  divider: {
    flex: 1,
    height: 1,
    backgroundColor: "#ccc",
  },
  dividerText: {
    marginHorizontal: 10,
    color: "#666",
  },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    marginBottom: 12,
    borderRadius: 8,
  },
  loginButton: {
    backgroundColor: "#007bff",
    padding: 15,
    borderRadius: 8,
    alignItems: "center",
    marginTop: 10,
  },
  loginText: {
    color: "#fff",
    fontWeight: "bold",
    fontSize: 16,
  },
  forgotPassword: {
    color: "#007bff",
    textAlign: "center",
    marginTop: 15,
  },
  signUpText: {
    color: "#333",
    textAlign: "center",
    marginTop: 10,
    fontSize: 14,
  },
});
