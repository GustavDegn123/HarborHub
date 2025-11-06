// /components/mechanics/StartTakingJobs.js
import React, { useEffect, useState, useCallback, useMemo } from "react";
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

import styles, { sliderColors } from "../../styles/mechanics/startTakingJobsStyles";
import { saveProviderProfile, setUserRole } from "../../services/providersService";

export default function StartTakingJobs({ navigation, route }) {
  const auth = getAuth();
  const user = auth.currentUser;

  // Intro vs. formular
  const [showIntro, setShowIntro] = useState(true);

  // Formular-state
  const [km, setKm] = useState(30);
  const [address, setAddress] = useState("");
  const [saving, setSaving] = useState(false);
  const [geocoding, setGeocoding] = useState(false);
  const [picked, setPicked] = useState(null); // {lat,lng,label}

  const kmLabel = useMemo(() => `${Math.round(km)} km`, [km]);

  const geocodeAddress = useCallback(async (addr) => {
    try {
      if (!addr?.trim()) return null;
      const results = await Location.geocodeAsync(addr.trim());
      if (!results?.length) return null;
      const { latitude, longitude } = results[0];
      return {
        lat: latitude,
        lng: longitude,
        geohash: geohashForLocation([latitude, longitude]),
      };
    } catch {
      return null;
    }
  }, []);

  // Modtag valgt placering fra MapPicker
  useEffect(() => {
    const pl = route?.params?.pickedLocation;
    if (pl?.lat && pl?.lng) {
      setPicked({ lat: pl.lat, lng: pl.lng, label: pl.label || "" });
      if (pl.label) setAddress(pl.label);
      setShowIntro(false);
    }
  }, [route?.params?.pickedLocation]);

  const openMap = useCallback(() => {
    const start = picked ? { lat: picked.lat, lng: picked.lng } : undefined;
    navigation.navigate("MapPicker", { start, returnTo: "StartTakingJobs" });
  }, [navigation, picked]);

  const onNext = useCallback(async () => {
    if (!user) return Alert.alert("Ikke logget ind", "Log ind først.");
    if (!address.trim() && !picked) {
      Alert.alert("Adresse mangler", "Skriv din adresse eller vælg på kortet.");
      return;
    }

    setSaving(true);
    setGeocoding(true);

    try {
      // Baseadresse: brug valgt punkt eller geokod teksten
      let homeGeo = null;
      if (picked?.lat && picked?.lng) {
        homeGeo = {
          lat: picked.lat,
          lng: picked.lng,
          geohash: geohashForLocation([picked.lat, picked.lng]),
        };
      } else {
        homeGeo = await geocodeAddress(address);
        if (!homeGeo) {
          setGeocoding(false);
          setSaving(false);
          Alert.alert("Kunne ikke finde adressen", "Vælg placeringen på kortet i stedet.");
          openMap();
          return;
        }
      }
      setGeocoding(false);

      const payload = {
        userId: user.uid,
        willingToTravelKm: Math.round(km),
        baseAddress: (picked?.label || address || "").trim(),
        geo: homeGeo, // <- bruges af feedet til radius
        active: true,
        createdAt: new Date(),
      };

      await saveProviderProfile(user.uid, payload);
      await setUserRole(user.uid, "provider");

      navigation.navigate("ChooseWork");
    } catch (e) {
      console.error(e);
      Alert.alert("Fejl", e?.message ?? "Noget gik galt.");
    } finally {
      setSaving(false);
    }
  }, [user, km, address, picked, geocodeAddress, navigation, openMap]);

  const onSkip = useCallback(() => {
    setKm(30);
    setAddress("");
    setPicked(null);
    setShowIntro(true);
  }, []);

  /* ---------- RENDER ---------- */

  // Intro
  if (showIntro) {
    return (
      <View style={styles.introScreen}>
        <View style={styles.introCard}>
          <View style={styles.introBadge}>
            <Text style={styles.introBadgeText}>⚓️</Text>
          </View>
          <Text style={styles.introTitle}>Begynd at tjene penge</Text>
          <Text style={styles.introSub}>
            Fortæl hvor du arbejder fra, hvor langt du vil køre, og vælg dine ydelser.
          </Text>

          <TouchableOpacity onPress={() => setShowIntro(false)} style={styles.ctaBtn}>
            <Text style={styles.ctaBtnText}>Kom i gang</Text>
          </TouchableOpacity>

          <TouchableOpacity onPress={onSkip} style={styles.altLinkBtn}>
            <Text style={styles.altLinkText}>Jeg ønsker ikke at tjene penge</Text>
          </TouchableOpacity>
        </View>
      </View>
    );
  }

  // Formular (kun én adresse)
  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
    >
      <View style={styles.container}>
        <Text style={styles.stepLabel}>Sted</Text>
        <Text style={styles.header}>Hvor kan du udføre opgaver?</Text>
        <Text style={styles.subheader}>Jeg er villig til at rejse op til {kmLabel}</Text>

        <Slider
          value={km}
          onValueChange={setKm}
          minimumValue={0}
          maximumValue={200}
          step={1}
          minimumTrackTintColor={sliderColors.minimumTrack}
          maximumTrackTintColor={sliderColors.maximumTrack}
          thumbTintColor={sliderColors.thumb}
          accessibilityLabel="Maksimal afstand i kilometer"
        />

        <Text style={styles.label}>Din adresse (eller vælg på kort)</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Fx Howitzvej 60, 2000 Frederiksberg"
            value={address}
            onChangeText={setAddress}
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
        {picked?.label ? <Text style={styles.pickedLabel}>Valgt: {picked.label}</Text> : null}

        {geocoding && (
          <View style={styles.geoRow}>
            <ActivityIndicator />
            <Text style={styles.geoText}>Finder position for adressen…</Text>
          </View>
        )}

        <View style={{ flex: 1 }} />

        <TouchableOpacity
          onPress={onNext}
          disabled={saving}
          style={[styles.nextBtn, saving && { opacity: 0.7 }]}
        >
          {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.nextBtnText}>Næste</Text>}
        </TouchableOpacity>

        <TouchableOpacity onPress={onSkip} style={styles.skipBtn} disabled={saving}>
          <Text style={styles.skipBtnText}>Jeg ønsker ikke at tjene penge</Text>
        </TouchableOpacity>
      </View>
    </KeyboardAvoidingView>
  );
}
