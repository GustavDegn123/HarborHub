// /components/shared/LoginScreen.js
import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import * as Linking from "expo-linking";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth, db } from "../../firebase";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { firebaseGoogleLogin } from "../../services/authService";
import Constants from "expo-constants";
import { useCriiptoVerify } from "@criipto/verify-expo";

import styles from "../../styles/shared/loginStyles";

// Sørger for at Google redirect ikke hænger
WebBrowser.maybeCompleteAuthSession();

export default function LoginScreen({ navigation }) {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  /* ---------------- Google login ---------------- */
  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId:
      "16622525056-qcgjdv8gkbunfgv4c8g79qm0brnjvoj5.apps.googleusercontent.com",
    iosClientId:
      "16622525056-7pgliodrdtnruh16cobp7kjb8h838g58.apps.googleusercontent.com",
    androidClientId:
      "16622525056-3j94ogkp9q6gs2bn0p1q2q50iv9dt0q1.apps.googleusercontent.com",
    webClientId:
      "16622525056-i5cbljlogf92qbdc505gcbrn8cne8r48.apps.googleusercontent.com",
    redirectUri: makeRedirectUri({
      scheme: "harborhub",
      useProxy: Constants.appOwnership === "expo", // Expo Go
    }),
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      firebaseGoogleLogin(id_token)
        .then((user) => {
          Alert.alert("Google login", `✅ Velkommen ${user.email}`);
        })
        .catch((err) => {
          console.error("Google login fejl:", err);
          Alert.alert("Google login fejl", err.message);
        });
    }
  }, [response]);

  /* ---------------- Criipto Verify (MitID) ---------------- */
  const { login: mitIdLogin, claims, error: mitIdError } = useCriiptoVerify();

  // Email login
  const handleEmailLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("Success", "✅ Du er logget ind!");
    } catch (error) {
      console.error("Login Error:", error);
      Alert.alert("Login fejl", error.message);
    }
  };

  // MitID login
  const handleMitIDLogin = async () => {
    // Vælg redirectUri dynamisk:
    // - I Expo Go: exp://<ip>:8081/--/auth/callback (skifter ofte)
    // - I dev-client/builds: harborhub://auth/callback (stabil)
    const redirectUri =
      Constants.appOwnership === "expo"
        ? Linking.createURL("/auth/callback")
        : makeRedirectUri({ scheme: "harborhub", path: "auth/callback" });

    console.log("Criipto redirectUri:", redirectUri);

    // ACR for MitID (substantial er typisk kravet)
    const acr = "urn:grn:authn:dk:mitid:substantial";

    try {
      const result = await mitIdLogin(acr, redirectUri);
      // claims kan komme fra hook eller fra result afhængigt af lib-version
      const c = claims || result?.claims || result || {};

      if (auth.currentUser) {
        await setDoc(
          doc(db, "users", auth.currentUser.uid),
          {
            mitidSub: c?.sub || null,                // unik MitID identifikator
            mitidAmr: Array.isArray(c?.amr) ? c.amr : [],
            mitidUpdatedAt: serverTimestamp(),
          },
          { merge: true }
        );
        Alert.alert("MitID", "✅ MitID er tilknyttet din konto.");
      } else {
        Alert.alert(
          "MitID",
          "✅ MitID godkendt. Log ind (fx e-mail/Google) for at tilknytte MitID til din konto."
        );
      }
    } catch (e) {
      // iOS "cancel" error (ASWebAuthenticationSession error 1) håndteres pænt
      const msg = String(e?.message || e);
      console.error("MitID login fejl:", e);

      if (msg.includes("WebAuthenticationSession") || msg.toLowerCase().includes("cancel")) {
        Alert.alert(
          "Login afbrudt",
          "MitID-login blev afbrudt. Prøv igen og bliv i browseren til du sendes tilbage til appen."
        );
      } else {
        Alert.alert(
          "MitID fejl",
          `${msg}\n\nTjek at denne redirect-URL er whitelisted i Criipto:\n${redirectUri}`
        );
      }
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image source={require("../../assets/logo.png")} style={styles.logoImage} />

      {/* MitID (Criipto Verify) */}
      <TouchableOpacity
        style={[styles.socialButton, { backgroundColor: "#0A84FF" }]}
        onPress={handleMitIDLogin}
      >
        <Text style={[styles.socialText, { color: "white" }]}>Log ind med MitID</Text>
      </TouchableOpacity>
      {mitIdError ? (
        <Text style={{ color: "red", marginTop: 6 }}>
          MitID fejl: {String(mitIdError)}
        </Text>
      ) : null}

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