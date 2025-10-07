import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { sendPasswordReset } from "../../services/authService"; // 👈 bruger service
import styles from "../../styles/shared/passwordResetStyles";   // 👈 lav en ny stylefil

export default function PasswordResetScreen({ navigation }) {
  const [email, setEmail] = useState("");

  const handleReset = async () => {
    if (!email) {
      Alert.alert("Manglende email", "Skriv din email først.");
      return;
    }
    try {
      await sendPasswordReset(email);
      Alert.alert("Email sendt", "Tjek din indbakke for reset-link.");
      navigation.goBack();
    } catch (err) {
      console.error("Password reset error:", err);
      Alert.alert("Fejl", err.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Nulstil adgangskode</Text>
      <Text style={styles.subtitle}>
        Indtast din email, og vi sender et link til nulstilling af din adgangskode.
      </Text>

      <TextInput
        style={styles.input}
        placeholder="Din email"
        value={email}
        onChangeText={setEmail}
        autoCapitalize="none"
        keyboardType="email-address"
      />

      <TouchableOpacity style={styles.button} onPress={handleReset}>
        <Text style={styles.buttonText}>Send reset-link</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.goBack()}>
        <Text style={styles.link}>Tilbage til login</Text>
      </TouchableOpacity>
    </View>
  );
}
