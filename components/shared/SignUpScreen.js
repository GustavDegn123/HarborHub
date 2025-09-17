// /components/shared/SignUpScreen.js
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { signUpUser } from "../../services/authService";

// styles
import styles from "../../styles/shared/signUpStyles";

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("owner"); // default = owner
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  const handleSignUp = async () => {
    try {
      const user = await signUpUser(email, password, name, role, phone, location);
      Alert.alert("Success", `✅ Bruger oprettet som ${role}: ${user.email}`);
      // Ingen navigation her – App.js håndterer redirect via onAuthStateChanged
    } catch (error) {
      console.error("SignUp Error:", error);
      Alert.alert("Fejl", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Opret konto</Text>

      <TextInput
        style={styles.input}
        placeholder="Fulde navn"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      <TextInput
        style={styles.input}
        placeholder="Adgangskode"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Telefonnummer"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Lokation"
        value={location}
        onChangeText={setLocation}
      />

      {/* Role Selection */}
      <Text style={styles.label}>Vælg din rolle:</Text>
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[styles.roleButton, role === "owner" && styles.roleButtonActive]}
          onPress={() => setRole("owner")}
        >
          <Text style={[styles.roleText, role === "owner" && styles.roleTextActive]}>
            Bådejer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleButton, role === "provider" && styles.roleButtonActive]}
          onPress={() => setRole("provider")}
        >
          <Text style={[styles.roleText, role === "provider" && styles.roleTextActive]}>
            Udbyder / Mekaniker
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Opret konto</Text>
      </TouchableOpacity>

      {/* Behold navigation til login for eksisterende brugere */}
      <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")}>
        <Text style={styles.link}>Har du allerede en konto? Log ind</Text>
      </TouchableOpacity>
    </View>
  );
}
