// /components/shared/LoginScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Image,
  Alert,
  ActivityIndicator,
} from "react-native";
import { signInWithEmailAndPassword } from "firebase/auth";

import { auth } from "../../firebase";
import styles from "../../styles/shared/loginStyles";
import { Sentry } from "../../sentry";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [isSubmitting, setIsSubmitting] = useState(false);

  const handleEmailLogin = async () => {
    const cleanEmail = email.trim();

    if (!cleanEmail || !password) {
      Alert.alert("Manglende info", "Indtast både e-mail og adgangskode.");
      return;
    }

    try {
      setIsSubmitting(true);
      await signInWithEmailAndPassword(auth, cleanEmail, password);
      Alert.alert("Success", "✅ Du er logget ind!");
    } catch (error) {
      Sentry.Native.captureException(error);
      Alert.alert("Login fejl", error?.message || "Kunne ikke logge ind.");
    } finally {
      setIsSubmitting(false);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image source={require("../../assets/logo.png")} style={styles.logoImage} />

      {/* Email input */}
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        editable={!isSubmitting}
      />

      {/* Password input */}
      <TextInput
        style={styles.input}
        placeholder="Adgangskode"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        editable={!isSubmitting}
      />

      {/* Login button */}
      <TouchableOpacity
        style={[styles.loginButton, isSubmitting && styles.loginButtonDisabled]}
        onPress={handleEmailLogin}
        disabled={isSubmitting}
      >
        {isSubmitting ? (
          <ActivityIndicator />
        ) : (
          <Text style={styles.loginText}>Log ind</Text>
        )}
      </TouchableOpacity>

      {/* Links */}
      <TouchableOpacity
        onPress={() => navigation.navigate("PasswordReset")}
        disabled={isSubmitting}
      >
        <Text style={styles.forgotPassword}>Glemt adgangskode?</Text>
      </TouchableOpacity>

      <TouchableOpacity
        onPress={() => navigation.navigate("SignUp")}
        disabled={isSubmitting}
      >
        <Text style={styles.signUpText}>
          Ingen konto? <Text style={{ fontWeight: "bold" }}>Tilmeld</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
