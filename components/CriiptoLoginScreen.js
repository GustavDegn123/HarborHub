// components/auth/CriiptoLoginScreen.js
import React, { useMemo } from "react";
import { View, Text, Button, Alert } from "react-native";
import * as Linking from "expo-linking";
import { useCriiptoVerify } from "@criipto/verify-expo";

export default function CriiptoLoginScreen() {
  const { login, claims, logout, error } = useCriiptoVerify();

  const redirectUri = useMemo(
    () => Linking.createURL("/auth/callback"),
    []
  );
  // MitID “acrValues” – substantial er det almindelige niveau for MitID login
  const ACR_MITID = "urn:grn:authn:dk:mitid:substantial";

  async function onLogin() {
    try {
      const result = await login(ACR_MITID, redirectUri);
      // result er typisk et id_token; claims bliver også udfyldt
      Alert.alert("Login OK", "Du er nu logget ind med MitID");
      console.log("id_token result:", result);
      console.log("claims:", claims);
      // TODO: map claims -> din Firebase bruger (fx save sub/email på users/{uid})
    } catch (e) {
      Alert.alert("Login fejl", e?.message || String(e));
    }
  }

  return (
    <View style={{ flex: 1, padding: 24, gap: 16, justifyContent: "center" }}>
      <Text style={{ fontSize: 22, fontWeight: "800" }}>
        Log ind med MitID (Criipto)
      </Text>

      <Button title="Login med MitID" onPress={onLogin} />

      {error ? (
        <Text style={{ color: "red" }}>Fejl: {error.toString()}</Text>
      ) : null}

      {claims ? (
        <View style={{ marginTop: 16 }}>
          <Text style={{ fontWeight: "700" }}>Claims:</Text>
          <Text selectable>{JSON.stringify(claims, null, 2)}</Text>
        </View>
      ) : null}

      <Button title="Log ud" onPress={logout} />
    </View>
  );
}