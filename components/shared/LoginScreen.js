// /components/shared/LoginScreen.js
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import { firebaseGoogleLogin } from "../../services/authService";
import Constants from "expo-constants";
import styles from "../../styles/shared/loginStyles";

// Sørger for at Google redirect ikke hænger
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /* ---------------- Google login ---------------- */
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "16622525056-qcgjdv8gkbunfgv4c8g79qm0brnjvoj5.apps.googleusercontent.com",
    iosClientId: "16622525056-7pgliodrdtnruh16cobp7kjb8h838g58.apps.googleusercontent.com",
    androidClientId: "16622525056-3j94ogkp9q6gs2bn0p1q2q50iv9dt0q1.apps.googleusercontent.com",
    webClientId: "16622525056-i5cbljlogf92qbdc505gcbrn8cne8r48.apps.googleusercontent.com",
    redirectUri: makeRedirectUri({
      scheme: "harborhub",
      useProxy: Constants.appOwnership === "expo", // Expo Go bruger proxy
    }),
  });

  useEffect(() => {
    if (response?.type === "success") {
      // Nogle versioner lægger token i response.params.id_token, andre i response.authentication.idToken
      const idToken =
        response.params?.id_token || response.authentication?.idToken || null;

      if (!idToken) {
        Alert.alert("Google login", "Kunne ikke hente id_token fra Google-responsen.");
        return;
      }

      firebaseGoogleLogin(idToken)
        .then((user) => {
          const emailTxt = user?.email || "bruger";
          Alert.alert("Google login", `✅ Velkommen ${emailTxt}`);
        })
        .catch((err) => {
          console.error("Google login fejl:", err);
          Alert.alert("Google login fejl", err?.message || "Uventet fejl ved Google login.");
        });
    }
  }, [response]);

  /* ---------------- Email + password ---------------- */
  const handleEmailLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email.trim(), password);
      Alert.alert("Success", "✅ Du er logget ind!");
    } catch (error) {
      console.error("Login Error:", error);
      Alert.alert("Login fejl", error?.message || "Kunne ikke logge ind.");
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image source={require("../../assets/logo.png")} style={styles.logoImage} />

      {/* Apple Login (placeholder) */}
      <TouchableOpacity
        style={[styles.socialButton, styles.appleButton]}
        onPress={() => Alert.alert("Apple login", "Ikke implementeret endnu.")}
      >
        <Text style={styles.appleText}> Log ind med Apple</Text>
      </TouchableOpacity>

      {/* Facebook Login (placeholder) */}
      <TouchableOpacity
        style={[styles.socialButton, styles.facebookButton]}
        onPress={() => Alert.alert("Facebook login", "Ikke implementeret endnu.")}
      >
        <View style={styles.socialContent}>
          <Image source={require("../../assets/facebook.png")} style={styles.icon} />
          <Text style={styles.socialText}>Facebook</Text>
        </View>
      </TouchableOpacity>

      {/* Google Login */}
      <TouchableOpacity
        style={[styles.socialButton, styles.googleButton]}
        disabled={!request}
        onPress={() => promptAsync()}
      >
        <View style={styles.socialContent}>
          <Image source={require("../../assets/google.png")} style={styles.icon} />
          <Text style={[styles.socialText, { color: "#333" }]}>Google</Text>
        </View>
      </TouchableOpacity>

      {/* Divider */}
      <View style={styles.dividerContainer}>
        <View style={styles.divider} />
        <Text style={styles.dividerText}>Eller fortsæt med</Text>
        <View style={styles.divider} />
      </View>

      {/* Email input */}
      <TextInput
        style={styles.input}
        placeholder="E-mail"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
        autoCapitalize="none"
      />

      {/* Password input */}
      <TextInput
        style={styles.input}
        placeholder="Adgangskode"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      {/* Login button */}
      <TouchableOpacity style={styles.loginButton} onPress={handleEmailLogin}>
        <Text style={styles.loginText}>Log ind</Text>
      </TouchableOpacity>

      {/* Links */}
      <TouchableOpacity onPress={() => navigation.navigate("PasswordReset")}>
        <Text style={styles.forgotPassword}>Glemt adgangskode?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
        <Text style={styles.signUpText}>
          Ingen konto? <Text style={{ fontWeight: "bold" }}>Tilmeld</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}
