import React, { useEffect, useState, useCallback } from "react";
import {
  ScrollView,
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
  Image,
} from "react-native";
import Checkbox from "expo-checkbox";
import DateTimePicker from "@react-native-community/datetimepicker";
import * as ImagePicker from "expo-image-picker";
import * as Location from "expo-location";
import { auth, storage } from "../../firebase";
import { Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { geohashForLocation } from "geofire-common";

import { getBoats } from "../../services/boatsService";
import { addRequest } from "../../services/requestsService";

import styles from "../../styles/boatowners/newRequestStyles";

export default function NewRequestScreen({ navigation, route }) {
  const [boats, setBoats] = useState([]);
  const [boatId, setBoatId] = useState("");
  const [serviceType, setServiceType] = useState("bundmaling");
  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [selectedOption, setSelectedOption] = useState("Fleksibel");
  const [isSpecificTime, setIsSpecificTime] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);
  const [loading, setLoading] = useState(true);

  const [image, setImage] = useState(null);

  // Placering
  const [picked, setPicked] = useState(null);         // { lat, lng, label }
  const [address, setAddress] = useState("");         // manuel adresse

  useEffect(() => {
    const loadBoats = async () => {
      try {
        const ownerId = auth.currentUser.uid;
        const data = await getBoats(ownerId);
        setBoats(data);
      } catch (err) {
        console.error("Fejl ved hentning af både:", err);
      } finally {
        setLoading(false);
      }
    };
    loadBoats();
  }, []);

  // modtag fra MapPicker
  useEffect(() => {
    const pl = route?.params?.pickedLocation;
    if (pl?.lat && pl?.lng) {
      setPicked(pl);
      if (pl?.label && !address) setAddress(pl.label);
    }
  }, [route?.params?.pickedLocation]);

  const openMap = useCallback(() => {
    const start = picked ? { lat: picked.lat, lng: picked.lng } : undefined;
    navigation.navigate("MapPicker", { start, returnTo: "NewRequest" });
  }, [navigation, picked]);

  const geocodeAddress = useCallback(async () => {
    if (!address.trim()) return Alert.alert("Adresse mangler", "Skriv en adresse.");
    try {
      const res = await Location.geocodeAsync(address.trim());
      if (!res?.length) return Alert.alert("Ikke fundet", "Kunne ikke finde adressen. Vælg på kortet i stedet.");
      const { latitude, longitude } = res[0];
      setPicked({ lat: latitude, lng: longitude, label: address.trim() });
      Alert.alert("OK", "Placering sat ud fra adressen.");
    } catch {
      Alert.alert("Fejl", "Kunne ikke slå adressen op. Vælg på kortet.");
    }
  }, [address]);

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === "ios");
    setDate(currentDate);
  };

  async function uriToBlob(uri) {
    return await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response);
      xhr.onerror = () => reject(new TypeError("Netværksrequest fejlede."));
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });
  }

  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  const takePhoto = async () => {
    const permission = await ImagePicker.requestCameraPermissionsAsync();
    if (!permission.granted) {
      Alert.alert("Tilladelse kræves", "Du skal give adgang til kameraet");
      return;
    }
    const result = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) setImage(result.assets[0].uri);
  };

  async function uploadImageAsync(localUri, ownerId) {
    const blob = await uriToBlob(localUri);
    const extFromUri = (localUri.split(".").pop() || "jpg").toLowerCase();
    const ext = extFromUri.includes("/") ? "jpg" : extFromUri;
    const path = `requests/${ownerId}/${Date.now()}.${ext}`;
    const storageRef = ref(storage, path);
    const metadata = { contentType: `image/${ext === "jpg" ? "jpeg" : ext}` };
    await uploadBytes(storageRef, blob, metadata);
    const url = await getDownloadURL(storageRef);
    return url;
  }

  const handleSave = async () => {
    if (!boatId) return Alert.alert("Fejl", "Vælg en båd først.");
    if (!budget) return Alert.alert("Fejl", "Indtast et budget.");
    if (!picked?.lat || !picked?.lng) {
      return Alert.alert("Vælg placering", "Vælg en placering (adresse eller kort).");
    }

    try {
      const ownerId = auth.currentUser.uid;
      let imageUrl = null;
      if (image) imageUrl = await uploadImageAsync(image, ownerId);

      const location = {
        lat: picked.lat,
        lng: picked.lng,
        label: picked.label || "",
        geohash: geohashForLocation([picked.lat, picked.lng]),
      };

      await addRequest(ownerId, boatId, {
        service_type: serviceType,
        description,
        budget: parseInt(budget, 10),
        deadline: selectedOption === "Fleksibel" ? "flexible" : Timestamp.fromDate(date),
        deadlineType: selectedOption,
        specificTime: isSpecificTime ? selectedTime : null,
        status: "open",
        imageUrl: imageUrl || null,
        location,
      });

     Alert.alert("Succes", "Opgave oprettet!",
      navigation.navigate("OwnerRoot", { screen: "Requests" }));

    } catch (err) {
      console.error("Fejl ved oprettelse af request:", err);
      Alert.alert("Fejl", "Kunne ikke oprette opgaven.");
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  return (
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 24 }}>
      <Text style={styles.header}>Opret ny serviceopgave</Text>

      {/* Placering (øverst) */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Placering</Text>

        <Text style={styles.label}>Adresse</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            placeholder="Fx Svanemøllehavnen, København"
            value={address}
            onChangeText={setAddress}
            style={styles.input}
            returnKeyType="done"
          />
        </View>

        <View style={styles.mapBtnRow}>
          <TouchableOpacity onPress={geocodeAddress} style={styles.outlineBtn}>
            <Text style={styles.outlineBtnText}>Brug adressen</Text>
          </TouchableOpacity>
          <TouchableOpacity onPress={openMap} style={styles.primaryBtn}>
            <Text style={styles.primaryBtnText}>{picked ? "Redigér på kort" : "Vælg på kort"}</Text>
          </TouchableOpacity>
        </View>

        {picked?.label ? <Text style={styles.pickedLabel}>Valgt: {picked.label}</Text> : null}
      </View>

      {/* Vælg båd */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Båd</Text>
        <View style={styles.buttonGrid}>
          {boats.map((b) => {
            const active = boatId === b.id;
            return (
              <TouchableOpacity
                key={b.id}
                style={[styles.selectButton, active && styles.selectButtonSelected]}
                onPress={() => setBoatId(b.id)}
              >
                <Text style={[styles.selectButtonText, active && styles.selectButtonTextSelected]}>{b.name}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Service type */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Service</Text>
        <View style={styles.buttonGrid}>
          {["Bundmaling", "Vinteropbevaring", "Reparation", "Elarbejde", "Riggerservice", "Polering"].map((type) => {
            const key = type.toLowerCase();
            const active = serviceType === key;
            return (
              <TouchableOpacity
                key={key}
                style={[styles.selectButton, active && styles.selectButtonSelected]}
                onPress={() => setServiceType(key)}
              >
                <Text style={[styles.selectButtonText, active && styles.selectButtonTextSelected]}>{type}</Text>
              </TouchableOpacity>
            );
          })}
        </View>
      </View>

      {/* Budget & tid */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Budget & tid</Text>

        <Text style={styles.label}>Budget (DKK)</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={styles.input}
            keyboardType="numeric"
            placeholder="Indtast budget"
            value={budget}
            onChangeText={setBudget}
          />
        </View>

        <Text style={styles.label}>Hvornår skal det ordnes?</Text>
        <View style={styles.optionRow}>
          {["På Dato", "Før Dato", "Fleksibel"].map((option) => {
            const active = selectedOption === option;
            return (
              <TouchableOpacity
                key={option}
                style={[styles.optionButton, active && styles.optionButtonSelected]}
                onPress={() => {
                  setSelectedOption(option);
                  if (option !== "Fleksibel") setShowDatePicker(true);
                }}
              >
                <Text style={[styles.optionText, active && styles.optionTextSelected]}>{option}</Text>
              </TouchableOpacity>
            );
          })}
        </View>

        {showDatePicker && (
          <DateTimePicker
            value={date}
            mode="date"
            display="default"
            onChange={onChangeDate}
          />
        )}

        {selectedOption !== "Fleksibel" && (
          <Text style={styles.dateBadge}>
            {selectedOption === "Før Dato" ? "Senest: " : "Dato: "}
            {date.toLocaleDateString()}
          </Text>
        )}

        <View style={styles.checkboxContainer}>
          <Checkbox value={isSpecificTime} onValueChange={setIsSpecificTime} color="#0B5FA5" />
          <Text style={styles.checkboxLabel}>Det skal være et specifikt tidsrum</Text>
        </View>

        {isSpecificTime && (
          <View style={styles.timeRow}>
            {[
              { label: "Morgen", sub: "Før 10" },
              { label: "Middag", sub: "10-14" },
              { label: "Eftermiddag", sub: "14-18" },
              { label: "Aften", sub: "Efter 18" },
            ].map((t) => {
              const active = selectedTime === t.label;
              return (
                <TouchableOpacity
                  key={t.label}
                  style={[styles.timeButton, active && styles.timeButtonSelected]}
                  onPress={() => setSelectedTime(t.label)}
                >
                  <Text style={styles.timeLabel}>{t.label}</Text>
                  <Text style={styles.timeSub}>{t.sub}</Text>
                </TouchableOpacity>
              );
            })}
          </View>
        )}
      </View>

      {/* Beskrivelse */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Beskrivelse</Text>
        <View style={styles.inputWrapper}>
          <TextInput
            style={[styles.input, { minHeight: 90 }]}
            placeholder="Beskriv opgaven"
            value={description}
            onChangeText={setDescription}
            multiline
          />
        </View>
      </View>

      {/* Billeder */}
      <View style={styles.card}>
        <Text style={styles.sectionTitle}>Billeder (valgfrit)</Text>
        <View style={{ flexDirection: "row", gap: 8 }}>
          <TouchableOpacity style={styles.outlineBtn} onPress={pickImage}>
            <Text style={styles.outlineBtnText}>Fra galleri</Text>
          </TouchableOpacity>
          <TouchableOpacity style={styles.outlineBtn} onPress={takePhoto}>
            <Text style={styles.outlineBtnText}>Tag billede</Text>
          </TouchableOpacity>
        </View>

        {image && (
          <View style={{ alignItems: "center", marginTop: 10 }}>
            <Image source={{ uri: image }} style={{ width: 220, height: 220, borderRadius: 12 }} />
            <Text style={{ marginTop: 6, color: "#1E293B" }}>Billede valgt</Text>
          </View>
        )}
      </View>

      {/* Gem */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
        <Text style={styles.submitButtonText}>Gem opgave</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}
