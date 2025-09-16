import React, { useEffect, useState, useCallback } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert, KeyboardAvoidingView, Platform, ActivityIndicator } from "react-native";
import Slider from "@react-native-community/slider";
import * as Location from "expo-location";
import { geohashForLocation } from "geofire-common";
import { doc, setDoc, serverTimestamp } from "firebase/firestore";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";

export default function StartTakingJobs({ navigation, route }) {
  const auth = getAuth();
  const user = auth.currentUser;

  const [km, setKm] = useState(30);
  const [homeAddress, setHomeAddress] = useState("");
  const [workAreaAddress, setWorkAreaAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [picked, setPicked] = useState(null); // {lat,lng,label}

  const geocodeAddress = async (address) => {
    const results = await Location.geocodeAsync(address);
    if (!results || results.length === 0) return null;
    const { latitude, longitude } = results[0];
    const geohash = geohashForLocation([latitude, longitude]);
    return { lat: latitude, lng: longitude, geohash };
  };

  useEffect(() => {
    const pl = route?.params?.pickedLocation;
    if (pl?.lat && pl?.lng) {
      setPicked({ lat: pl.lat, lng: pl.lng, label: pl.label || "" });
      if (pl.label) setHomeAddress(pl.label);
    }
  }, [route?.params?.pickedLocation]);

  const openMap = () => {
    const start = picked ? { lat: picked.lat, lng: picked.lng } : undefined;
    navigation.navigate("MapPicker", { start, returnTo: "StartTakingJobs" });
  };

  const onNext = useCallback(async () => {
    if (!user) return Alert.alert("Ikke logget ind", "Log ind først.");
    if (!homeAddress.trim() && !picked) return Alert.alert("Adresse mangler", "Skriv din adresse eller vælg på kortet.");

    setSaving(true);
    setGeocoding(true);
    try {
      let homeGeo = null;
      if (picked?.lat && picked?.lng) {
        const geohash = geohashForLocation([picked.lat, picked.lng]);
        homeGeo = { lat: picked.lat, lng: picked.lng, geohash };
      } else {
        homeGeo = await geocodeAddress(homeAddress.trim());
        if (!homeGeo) {
          setGeocoding(false);
          setSaving(false);
          Alert.alert("Kunne ikke finde adressen", "Vælg placeringen på kortet i stedet.");
          return openMap();
        }
      }

      let workArea = null;
      if (workAreaAddress.trim()) {
        workArea = await geocodeAddress(workAreaAddress.trim());
      }
      setGeocoding(false);

      const payload = {
        userId: user.uid,
        willingToTravelKm: Math.round(km),
        baseAddress: (picked?.label || homeAddress || "").trim(),
        geo: homeGeo,
        workAreaText: workAreaAddress.trim() || null,
        workAreaGeo: workArea,
        active: true,
        createdAt: serverTimestamp(),
        updatedAt: serverTimestamp(),
      };

      await setDoc(doc(db, "providers", user.uid), payload, { merge: true });
      await setDoc(doc(db, "users", user.uid), { role: "yard_owner", updatedAt: serverTimestamp() }, { merge: true });

      navigation.navigate("ChooseWork");
    } catch (e) {
      Alert.alert("Fejl", e?.message ?? "Noget gik galt.");
    } finally {
      setSaving(false);
    }
  }, [user, km, homeAddress, workAreaAddress, picked, navigation]);

  const onSkip = () => navigation.replace("Home");

  return (
    <KeyboardAvoidingView style={{ flex: 1, backgroundColor: "#fff" }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
      <View style={{ flex: 1, paddingHorizontal: 20, paddingTop: 16 }}>
        <Text style={{ textAlign: "center", fontSize: 16, color: "#194b63", fontWeight: "600", marginBottom: 8 }}>Sted</Text>
        <Text style={{ fontSize: 20, fontWeight: "700", marginTop: 8, marginBottom: 12 }}>Hvor kan du udføre opgaver?</Text>
        <Text style={{ fontSize: 16, marginBottom: 16 }}>Jeg er villig til at rejse op til {Math.round(km)} km</Text>

        <Slider value={km} onValueChange={setKm} minimumValue={0} maximumValue={200} step={1}
          minimumTrackTintColor="#1f5c7d" maximumTrackTintColor="#c8d6df" thumbTintColor="#1f5c7d" />

        <Text style={{ color: "#4b5563", marginTop: 16, marginBottom: 8 }}>Din adresse (eller vælg på kort)</Text>
        <View style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10 }}>
          <TextInput placeholder="Fx Howitzvej 60, 2000 Frederiksberg" value={homeAddress}
            onChangeText={setHomeAddress} autoCapitalize="none" style={{ fontSize: 16 }} returnKeyType="done" />
        </View>

        <TouchableOpacity onPress={openMap} style={{ backgroundColor:"#e8f0f4", paddingVertical:12, alignItems:"center", borderRadius:12, marginTop:10 }}>
          <Text style={{ fontWeight:"700", color:"#1f5c7d" }}>{picked ? "Redigér placering på kort" : "Vælg på kort"}</Text>
        </TouchableOpacity>
        {picked?.label ? <Text style={{ color:"#6b7280", marginTop:6 }}>Valgt: {picked.label}</Text> : null}

        <Text style={{ color: "#4b5563", marginTop: 16, marginBottom: 8 }}>Arbejdsområde (valgfri – by/havn/adresse)</Text>
        <View style={{ borderWidth: 1, borderColor: "#d1d5db", borderRadius: 8, paddingHorizontal: 12, paddingVertical: 10, marginBottom: 16 }}>
          <TextInput placeholder="Fx Svanemøllehavnen, København" value={workAreaAddress}
            onChangeText={setWorkAreaAddress} autoCapitalize="none" style={{ fontSize: 16 }} returnKeyType="done" />
        </View>

        {geocoding && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, marginBottom: 8 }}>
            <ActivityIndicator />
            <Text style={{ color: "#6b7280" }}>Finder positioner for adresserne…</Text>
          </View>
        )}

        <View style={{ flex: 1 }} />

        <TouchableOpacity onPress={onNext} disabled={saving}
          style={{ backgroundColor: "#1f5c7d", paddingVertical: 16, alignItems: "center", borderRadius: 24, marginBottom: 10 }}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={{ color: "#fff", fontWeight: "700", fontSize: 16 }}>Næste</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={onSkip} style={{ alignItems: "center", marginBottom: 16 }}>
          <Text style={{ color: "#1f5c7d" }}>Jeg ønsker ikke at tjene penge</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
