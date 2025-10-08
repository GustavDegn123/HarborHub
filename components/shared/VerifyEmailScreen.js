// components/shared/VerifyEmailScreen.js
import React, { useState } from "react";
import { View, Text, TouchableOpacity, Alert } from "react-native";
import { auth } from "../../firebase";
import { sendEmailVerification, reload, signOut } from "firebase/auth";

export default function VerifyEmailScreen() {
  const [busy, setBusy] = useState(false);

  const resend = async () => {
    try {
      setBusy(true);
      if (!auth.currentUser) throw new Error("Ikke logget ind");
      await sendEmailVerification(auth.currentUser);
      Alert.alert("Sendt", "Vi har sendt verifikationsmail igen.");
    } catch (e) {
      Alert.alert("Fejl", e.message || String(e));
    } finally { setBusy(false); }
  };

  const check = async () => {
    try {
      setBusy(true);
      if (!auth.currentUser) throw new Error("Ikke logget ind");
      await reload(auth.currentUser);
      if (auth.currentUser.emailVerified) {
        Alert.alert("Tak", "Din e-mail er bekræftet. Du sendes videre…");
        // App.js lytter på onAuthStateChanged og vil vise normale skærme
      } else {
        Alert.alert("Ikke bekræftet endnu", "Klik på linket i mailen og prøv igen.");
      }
    } catch (e) {
      Alert.alert("Fejl", e.message || String(e));
    } finally { setBusy(false); }
  };

  const doLogout = async () => {
    try { await signOut(auth); } catch (e) {
      Alert.alert("Fejl", e.message || String(e));
    }
  };

  return (
    <View style={{ flex:1, padding:24, gap:16 }}>
      <Text style={{ fontSize:22, fontWeight:"600", marginTop:24 }}>Bekræft din e-mail</Text>
      <Text>Vi har brug for at bekræfte din e-mail, før du kan bruge appen.</Text>

      <TouchableOpacity onPress={resend} disabled={busy} style={{ padding:12 }}>
        <Text style={{ color:"#0B6EEF", fontSize:18 }}>Send verifikationsmail igen</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={check} disabled={busy} style={{ padding:12 }}>
        <Text style={{ color:"#0B6EEF", fontSize:18 }}>Jeg har bekræftet – tjek igen</Text>
      </TouchableOpacity>

      <View style={{ height:12 }} />
      <TouchableOpacity onPress={doLogout} disabled={busy} style={{ padding:12 }}>
        <Text style={{ color:"#e11d48", fontSize:16 }}>Log ud</Text>
      </TouchableOpacity>
    </View>
  );
}
