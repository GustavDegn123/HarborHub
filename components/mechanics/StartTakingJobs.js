import React, { useEffect, useState, useCallback } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from "react-native";
import Slider from "@react-native-community/slider";
import * as Location from "expo-location";
import { geohashForLocation } from "geofire-common";
import { getAuth } from "firebase/auth";

// styles
import styles from "../../styles/mechanics/startTakingJobsStyles";

// services
import { saveProviderProfile, setUserRole } from "../../services/providersService";

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
    if (!homeAddress.trim() && !picked)
      return Alert.alert("Adresse mangler", "Skriv din adresse eller vælg på kortet.");

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
        createdAt: new Date(),
      };

      await saveProviderProfile(user.uid, payload);
      await setUserRole(user.uid, "provider"); // bruger bliver markeret som provider

      navigation.navigate("ChooseWork");
    } catch (e) {
      Alert.alert("Fejl", e?.message ?? "Noget gik galt.");
    } finally {
      setSaving(false);
    }
  }, [user, km, homeAddress, workAreaAddress, picked, navigation]);

  const onSkip = () => navigation.replace("ProviderHome");

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.stepLabel}>Sted</Text>
        <Text style={styles.header}>Hvor kan du udføre opgaver?</Text>
        <Text style={styles.subheader}>
          Jeg er villig til at rejse op til {Math.round(km)} km
        </Text>

        <Slider
          value={km}
          onValueChange={setKm}
          minimumValue={0}
          maximumValue={200}
          step={1}
          minimumTrackTintColor="#1f5c7d"
          maximumTrackTintColor="#c8d6df"
          thumbTintColor="#1f5c7d"
        />

        <Text style={styles.label}>Din adresse (eller vælg på kort)</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Fx Howitzvej 60, 2000 Frederiksberg"
            value={homeAddress}
            onChangeText={setHomeAddress}
            autoCapitalize="none"
            style={styles.input}
            returnKeyType="done"
          />
        </View>

        <TouchableOpacity onPress={openMap} style={styles.mapBtn}>
          <Text style={styles.mapBtnText}>
            {picked ? "Redigér placering på kort" : "Vælg på kort"}
          </Text>
        </TouchableOpacity>
        {picked?.label ? (
          <Text style={styles.pickedLabel}>Valgt: {picked.label}</Text>
        ) : null}

        <Text style={styles.label}>
          Arbejdsområde (valgfri – by/havn/adresse)
        </Text>
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Fx Svanemøllehavnen, København"
            value={workAreaAddress}
            onChangeText={setWorkAreaAddress}
            autoCapitalize="none"
            style={styles.input}
            returnKeyType="done"
          />
        </View>

        {geocoding && (
          <View style={styles.geoRow}>
            <ActivityIndicator />
            <Text style={styles.geoText}>Finder positioner for adresserne…</Text>
          </View>
        )}

        <View style={{ flex: 1 }} />

        <TouchableOpacity onPress={onNext} disabled={saving} style={styles.nextBtn}>
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextBtnText}>Næste</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={onSkip} style={styles.skipBtn}>
          <Text style={styles.skipBtnText}>Jeg ønsker ikke at tjene penge</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
