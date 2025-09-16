import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const handleLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("Success", "You are now logged in!");
      navigation.replace("Home");
    } catch (error) {
      console.error(error);
      Alert.alert("Login Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.logo}>HarborHub</Text>

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TouchableOpacity style={styles.button} onPress={handleLogin}>
        <Text style={styles.buttonText}>Log ind</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
        <Text style={styles.link}>Ingen konto? Tilmeld dig</Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;

const styles = StyleSheet.create({
  container: { flex: 1, justifyContent: "center", padding: 20, backgroundColor: "#fff" },
  logo: { fontSize: 36, fontWeight: "bold", color: "#007bff", textAlign: "center", marginBottom: 40 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, marginBottom: 12, borderRadius: 8 },
  button: { backgroundColor: "#007bff", padding: 15, borderRadius: 8, alignItems: "center", marginTop: 10 },
  buttonText: { color: "#fff", fontWeight: "bold", fontSize: 16 },
  link: { color: "#007bff", textAlign: "center", marginTop: 15 },
});
