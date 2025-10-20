// /components/shared/LoginScreen.js
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as Facebook from "expo-auth-session/providers/facebook";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../../firebase";
import { firebaseGoogleLogin, firebaseFacebookLogin } from "../../services/authService";
import Constants from "expo-constants";
import styles from "../../styles/shared/loginStyles";

// Sørger for at auth-session redirect ikke hænger i browseren
WebBrowser.maybeCompleteAuthSession();

/** IMPORTANT:
 * I udvikling vil vi T-V-I-N-G-E Expo proxy'en.
 * Derfor hardcoder vi redirectUri til auth.expo.io i stedet for makeRedirectUri.
 * (makeRedirectUri kan i nogle setups returnere exp:// selv med useProxy=true).
 */
const REDIRECT_URI = "https://auth.expo.io/@gustavdegn/harborhub";

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  // Debug: vis hvilke værdier der bruges
  useEffect(() => {
    console.log("FB APP ID =", Constants.expoConfig?.extra?.FACEBOOK_APP_ID);
    console.log("Auth redirectUri =", REDIRECT_URI);
  }, []);

  /* ---------------- Google login ---------------- */
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "16622525056-qcgjdv8gkbunfgv4c8g79qm0brnjvoj5.apps.googleusercontent.com",
    iosClientId: "16622525056-7pgliodrdtnruh16cobp7kjb8h838g58.apps.googleusercontent.com",
    androidClientId: "16622525056-3j94ogkp9q6gs2bn0p1q2q50iv9dt0q1.apps.googleusercontent.com",
    webClientId: "16622525056-i5cbljlogf92qbdc505gcbrn8cne8r48.apps.googleusercontent.com",
    redirectUri: REDIRECT_URI, // 👈 fast proxy-URL
  });

  /* ---------------- Facebook login ---------------- */
  const [fbRequest, fbResponse, fbPromptAsync] = Facebook.useAuthRequest({
    clientId: Constants.expoConfig?.extra?.FACEBOOK_APP_ID,
    scopes: ["public_profile", "email"],
    redirectUri: REDIRECT_URI, // 👈 fast proxy-URL
  });

  // Google-respons
  useEffect(() => {
    if (response?.type === "success") {
      const idToken =
        response?.params?.id_token || response?.authentication?.idToken || null;

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

  // Facebook-respons
  useEffect(() => {
    if (fbResponse?.type === "success") {
      const accessToken = fbResponse?.authentication?.accessToken || null;
      if (!accessToken) {
        Alert.alert("Facebook login", "Kunne ikke hente accessToken fra Facebook-responsen.");
        return;
      }

      firebaseFacebookLogin(accessToken)
        .then((user) => {
          const emailTxt = user?.email || "bruger";
          Alert.alert("Facebook login", `✅ Velkommen ${emailTxt}`);
        })
        .catch((err) => {
          console.error("Facebook login fejl:", err);
          const msg =
            err?.code === "auth/account-exists-with-different-credential"
              ? "Der findes allerede en konto med denne e-mail via en anden login-udbyder. Prøv at logge ind med Google eller e-mail."
              : err?.message || "Uventet fejl ved Facebook login.";
          Alert.alert("Facebook login fejl", msg);
        });
    }
  }, [fbResponse]);

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

      {/* Facebook Login (AKTIV) */}
      <TouchableOpacity
        style={[styles.socialButton, styles.facebookButton]}
        disabled={!fbRequest}
        onPress={() => fbPromptAsync()}
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
