// components/shared/VerifyEmailScreen.js
import React, { useEffect, useMemo, useRef, useState } from "react";
import {
  View,
  Text,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { auth } from "../../firebase";
import {
  sendEmailVerification,
  reload,
  signOut,
  onIdTokenChanged,
} from "firebase/auth";
import styles from "../../styles/shared/verifyEmailStyles";

export default function VerifyEmailScreen() {
  const [busy, setBusy] = useState(false);
  const [email, setEmail] = useState(auth.currentUser?.email ?? "");
  const [isVerified, setIsVerified] = useState(!!auth.currentUser?.emailVerified);

  // Undgå at spamme Alert hvis listener trigges flere gange
  const alertedRef = useRef(false);

  useEffect(() => {
    // Denne listener trigges når ID token ændrer sig (fx efter getIdToken(true))
    const unsub = onIdTokenChanged(auth, (user) => {
      setEmail(user?.email ?? "");
      const verified = !!user?.emailVerified;
      setIsVerified(verified);

      if (verified && !alertedRef.current) {
        alertedRef.current = true;
        Alert.alert("Tak!", "Din e-mail er bekræftet – du sendes videre.");
        // App.js bør nu automatisk skifte væk fra denne skærm
      }
    });

    return unsub;
  }, []);

  const resend = async () => {
    try {
      setBusy(true);
      if (!auth.currentUser) throw new Error("Ikke logget ind.");
      await sendEmailVerification(auth.currentUser);
      Alert.alert("Sendt", "Vi har sendt verifikationsmail igen.");
    } catch (e) {
      Alert.alert("Fejl", e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const check = async () => {
    try {
      setBusy(true);
      if (!auth.currentUser) throw new Error("Ikke logget ind.");

      // 1) Opdater auth.currentUser fra serveren
      await reload(auth.currentUser);

      if (auth.currentUser.emailVerified) {
        // 2) Tving token-refresh så onIdTokenChanged kan fange ændringen
        await auth.currentUser.getIdToken(true);

        setIsVerified(true);

        // Alert vises også via listener, men vi viser den her for respons med det samme
        if (!alertedRef.current) {
          alertedRef.current = true;
          Alert.alert("Tak!", "Din e-mail er bekræftet – du sendes videre.");
        }
      } else {
        Alert.alert(
          "Ikke bekræftet endnu",
          "Klik på linket i mailen og prøv igen."
        );
      }
    } catch (e) {
      Alert.alert("Fejl", e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const doLogout = async () => {
    try {
      setBusy(true);
      await signOut(auth);
    } catch (e) {
      Alert.alert("Fejl", e?.message || String(e));
    } finally {
      setBusy(false);
    }
  };

  const helperText = useMemo(() => {
    if (isVerified) return "Din konto er aktiv. Du sendes videre…";
    return "Åbn mailen og klik på linket for at aktivere din konto.";
  }, [isVerified]);

  return (
    <SafeAreaView style={styles.safe}>
      <View style={styles.container}>
        <View style={styles.hero}>
          <View style={styles.badge}>
            <Text style={styles.badgeEmoji}>✉️</Text>
          </View>

          <Text style={styles.title}>Bekræft din e-mail</Text>

          {!!email && (
            <Text style={styles.subtitle}>
              Vi har sendt en bekræftelse til{" "}
              <Text style={styles.subtitleBold}>{email}</Text>.
            </Text>
          )}

          <Text style={styles.helper}>{helperText}</Text>
        </View>

        <View style={styles.actions}>
          <TouchableOpacity
            onPress={resend}
            disabled={busy || isVerified}
            activeOpacity={0.9}
            style={[styles.buttonPrimary, (busy || isVerified) && styles.buttonDisabled]}
          >
            <Text style={styles.buttonPrimaryText}>Send verifikationsmail igen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={check}
            disabled={busy}
            activeOpacity={0.9}
            style={[styles.buttonSecondary, busy && styles.buttonDisabled]}
          >
            <Text style={styles.buttonSecondaryText}>Jeg har bekræftet – tjek igen</Text>
          </TouchableOpacity>

          <TouchableOpacity
            onPress={doLogout}
            disabled={busy}
            activeOpacity={0.9}
            style={[styles.buttonGhostDanger, busy && styles.buttonDisabled]}
          >
            <Text style={styles.buttonGhostDangerText}>Log ud</Text>
          </TouchableOpacity>
        </View>
      </View>

      {busy && (
        <View style={styles.loadingOverlay}>
          <ActivityIndicator size="large" />
        </View>
      )}
    </SafeAreaView>
  );
}
