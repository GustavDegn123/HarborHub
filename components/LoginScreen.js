import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, Image, Alert } from "react-native";
import * as Google from "expo-auth-session/providers/google";
import * as WebBrowser from "expo-web-browser";
import { makeRedirectUri } from "expo-auth-session";
import { signInWithEmailAndPassword } from "firebase/auth";
import { auth } from "../firebase";
import { firebaseGoogleLogin } from "../services/authService";
import Constants from "expo-constants";

// styles
import styles from "../styles/loginStyles";

WebBrowser.maybeCompleteAuthSession();

const LoginScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");

  const [request, response, promptAsync] = Google.useAuthRequest({
    expoClientId: "16622525056-qcgjdv8gkbunfgv4c8g79qm0brnjvoj5.apps.googleusercontent.com",
    iosClientId: "16622525056-7pgliodrdtnruh16cobp7kjb8h838g58.apps.googleusercontent.com",
    androidClientId: "16622525056-3j94ogkp9q6gs2bn0p1q2q50iv9dt0q1.apps.googleusercontent.com",
    webClientId: "16622525056-i5cbljlogf92qbdc505gcbrn8cne8r48.apps.googleusercontent.com",
    redirectUri: makeRedirectUri({
      scheme: "harborhub",
      useProxy: Constants.appOwnership === "expo",
    }),
  });

  useEffect(() => {
    if (response?.type === "success") {
      const { id_token } = response.params;
      firebaseGoogleLogin(id_token)
        .then((user) => {
          Alert.alert("Google login", `✅ Velkommen ${user.email}`);
          navigation.replace("Home");
        })
        .catch((err) => Alert.alert("Google login fejl", err.message));
    }
  }, [response]);

  const handleEmailLogin = async () => {
    try {
      await signInWithEmailAndPassword(auth, email, password);
      Alert.alert("Success", "✅ Du er logget ind!");
      navigation.replace("Home");
    } catch (error) {
      console.error(error);
      Alert.alert("Login Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      {/* Logo */}
      <Image source={require("../assets/logo.png")} style={styles.logoImage} />

      {/* Apple Login */}
      <TouchableOpacity style={[styles.socialButton, styles.appleButton]}>
        <Text style={styles.appleText}> Log ind med Apple</Text>
      </TouchableOpacity>

      {/* Facebook Login */}
      <TouchableOpacity style={[styles.socialButton, styles.facebookButton]}>
        <View style={styles.socialContent}>
          <Image source={require("../assets/facebook.png")} style={styles.icon} />
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
          <Image source={require("../assets/google.png")} style={styles.icon} />
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
      <TouchableOpacity>
        <Text style={styles.forgotPassword}>Glemt adgangskode?</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("SignUp")}>
        <Text style={styles.signUpText}>
          Ingen konto? <Text style={{ fontWeight: "bold" }}>Tilmeld</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
};

export default LoginScreen;
