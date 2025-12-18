// /components/shared/SignUpScreen.js
import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
} from "react-native";
import { sendEmailVerification } from "firebase/auth";
import { signUpUser } from "../../services/authService";
import { auth } from "../../firebase";

// styles
import styles from "../../styles/shared/signUpStyles";

export default function SignUpScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("owner"); // default = owner
  const [phone, setPhone] = useState("");
  const [loading, setLoading] = useState(false);

  const validate = () => {
    if (!name.trim()) return "Skriv dit navn.";
    if (!email.trim()) return "Skriv din e-mail.";
    if (!/^[^@\s]+@[^@\s]+\.[^@\s]+$/.test(email.trim()))
      return "Ugyldig e-mail.";
    if (password.length < 6) return "Adgangskoden skal være mindst 6 tegn.";
    return null;
  };

  const handleSignUp = async () => {
    const err = validate();
    if (err) {
      Alert.alert("Tjek dine oplysninger", err);
      return;
    }

    try {
      setLoading(true);

      // Opret bruger + profil i Firestore
      await signUpUser(
        email.trim(),
        password,
        name.trim(),
        role,
        phone.trim()
      );

      // Send e-mail-verifikation
      try {
        if (auth.currentUser) {
          await sendEmailVerification(auth.currentUser);
        }
      } catch (_) {
        // Ignorér — fx hvis der allerede er sendt / rate-limit
      }

      Alert.alert(
        "Konto oprettet",
        `✅ Bruger oprettet som ${role}. Tjek din e-mail for at bekræfte før du fortsætter.`
      );

      // Ingen navigation her – App.js håndterer redirect via onAuthStateChanged
    } catch (error) {
      console.error("SignUp Error:", error);
      const msg =
        error?.message || "Der opstod en fejl under oprettelse. Prøv igen.";
      Alert.alert("Fejl", msg);
    } finally {
      setLoading(false);
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
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
        autoCorrect={false}
        textContentType="emailAddress"
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Adgangskode"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        textContentType="newPassword"
        editable={!loading}
      />

      <TextInput
        style={styles.input}
        placeholder="Telefonnummer"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
        textContentType="telephoneNumber"
        editable={!loading}
      />

      {/* Role Selection */}
      <Text style={styles.label}>Vælg din rolle:</Text>
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[styles.roleButton, role === "owner" && styles.roleButtonActive]}
          onPress={() => setRole("owner")}
          disabled={loading}
        >
          <Text style={[styles.roleText, role === "owner" && styles.roleTextActive]}>
            Bådejer
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.roleButton,
            role === "provider" && styles.roleButtonActive,
          ]}
          onPress={() => setRole("provider")}
          disabled={loading}
        >
          <Text
            style={[
              styles.roleText,
              role === "provider" && styles.roleTextActive,
            ]}
          >
            Mekaniker
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity
        style={[styles.button, loading && { opacity: 0.6 }]}
        onPress={handleSignUp}
        disabled={loading}
      >
        {loading ? <ActivityIndicator /> : <Text style={styles.buttonText}>Opret konto</Text>}
      </TouchableOpacity>

      {/* Link til login for eksisterende brugere */}
      <TouchableOpacity onPress={() => navigation.navigate("LoginScreen")} disabled={loading}>
        <Text style={styles.link}>Har du allerede en konto? Log ind</Text>
      </TouchableOpacity>
    </View>
  );
}
