// /components/boatowners/NewRequestScreen.js
import React, { useEffect, useMemo, useRef, useState, useCallback } from "react";
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
  Animated,
  KeyboardAvoidingView,
  UIManager,
  LayoutAnimation,
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
import { getAvailableServices } from "../../services/providersService";

import styles, { colors } from "../../styles/boatowners/newRequestStyles";

if (Platform.OS === "android" && UIManager.setLayoutAnimationEnabledExperimental) {
  UIManager.setLayoutAnimationEnabledExperimental(true);
}

/* -------------------------------------------
   Hjælpere til service-katalog (træ -> blade)
-------------------------------------------- */
function flattenLeaves(nodes, acc = []) {
  if (!Array.isArray(nodes)) return acc;
  for (const n of nodes) {
    if (Array.isArray(n?.children) && n.children.length) {
      flattenLeaves(n.children, acc);
    } else if (n?.id && n?.name) {
      acc.push({ id: String(n.id), name: String(n.name) });
    }
  }
  return acc;
}

export default function NewRequestScreen({ navigation, route }) {
  /* -------- Wizard state -------- */
  const steps = ["Placering & båd", "Service", "Budget & tid", "Detaljer"];
  const [step, setStep] = useState(0); // 0..3

  // Smooth transitions
  const fade = useRef(new Animated.Value(1)).current;
  const slide = useRef(new Animated.Value(0)).current; // 0 -> synlig, 1 -> ud
  const [renderKey, setRenderKey] = useState(0);

  const animateToStep = (nextStep) => {
    LayoutAnimation.configureNext(LayoutAnimation.Presets.easeInEaseOut);
    Animated.parallel([
      Animated.timing(fade, { toValue: 0, duration: 140, useNativeDriver: true }),
      Animated.timing(slide, { toValue: 1, duration: 140, useNativeDriver: true }),
    ]).start(() => {
      setRenderKey(nextStep);
      setStep(nextStep);
      fade.setValue(0);
      slide.setValue(1);
      Animated.parallel([
        Animated.timing(fade, { toValue: 1, duration: 220, useNativeDriver: true }),
        Animated.timing(slide, { toValue: 0, duration: 220, useNativeDriver: true }),
      ]).start();
    });
  };

  const canPrev = step > 0;
  const canNext = step < steps.length - 1;

  /* -------- Data state -------- */
  const [boats, setBoats] = useState([]);
  const [boatId, setBoatId] = useState("");

  const [catalog, setCatalog] = useState([]);
  const [serviceQuery, setServiceQuery] = useState("");
  const [serviceType, setServiceType] = useState(""); // leaf-ID
  const [serviceName, setServiceName] = useState("");

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
  const [picked, setPicked] = useState(null); // { lat, lng, label }
  const [address, setAddress] = useState(""); // manuel adresse

  /* -------- Load båd + services -------- */
  useEffect(() => {
    let alive = true;
    (async () => {
      try {
        const ownerId = auth.currentUser?.uid;
        const [boatsArr, servicesArr] = await Promise.all([
          ownerId ? getBoats(ownerId) : Promise.resolve([]),
          getAvailableServices().catch(() => []),
        ]);
        if (!alive) return;
        setBoats(Array.isArray(boatsArr) ? boatsArr : []);
        setCatalog(Array.isArray(servicesArr) ? servicesArr : []);
      } catch (err) {
        console.error("Init fejl:", err);
      } finally {
        if (alive) setLoading(false);
      }
    })();
    return () => {
      alive = false;
    };
  }, []);

  /* -------- MapPicker return -------- */
  useEffect(() => {
    const pl = route?.params?.pickedLocation;
    if (pl?.lat && pl?.lng) {
      setPicked(pl);
      if (pl?.label && !address) setAddress(pl.label);
    }
  }, [route?.params?.pickedLocation, address]);

  /* -------- Geocode adresse -------- */
  const geocodeAddress = useCallback(async () => {
    if (!address.trim())
      return Alert.alert("Adresse mangler", "Skriv en adresse.");
    try {
      const res = await Location.geocodeAsync(address.trim());
      if (!res?.length)
        return Alert.alert(
          "Ikke fundet",
          "Kunne ikke finde adressen. Vælg på kortet i stedet."
        );
      const { latitude, longitude } = res[0];
      const pl = { lat: latitude, lng: longitude, label: address.trim() };
      setPicked(pl);
      Alert.alert("OK", "Placering sat ud fra adressen.");
    } catch {
      Alert.alert("Fejl", "Kunne ikke slå adressen op. Vælg på kortet.");
    }
  }, [address]);

  /* -------- Map -------- */
  const openMap = useCallback(() => {
    const start = picked ? { lat: picked.lat, lng: picked.lng } : undefined;
    navigation.navigate("MapPicker", { start, returnTo: "NewRequest" });
  }, [navigation, picked]);

  /* -------- Dato -------- */
  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === "ios");
    setDate(currentDate);
  };

  /* -------- Billed-upload -------- */
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
      quality: 0.85,
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
      quality: 0.85,
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

  /* -------- Services (blade) -------- */
  const leaves = useMemo(() => flattenLeaves(catalog), [catalog]);
  const filteredLeaves = useMemo(() => {
    const q = serviceQuery.trim().toLowerCase();
    if (!q) return leaves;
    return leaves.filter(
      (l) => l.name.toLowerCase().includes(q) || l.id.toLowerCase().includes(q)
    );
  }, [leaves, serviceQuery]);

  const onPickService = (leaf) => {
    setServiceType(leaf.id);
    setServiceName(leaf.name);
  };

  /* -------- Submit -------- */
  const handleSave = async () => {
    if (!boatId) return Alert.alert("Fejl", "Vælg en båd først.");
    if (!serviceType) return Alert.alert("Fejl", "Vælg en service.");
    if (!budget) return Alert.alert("Fejl", "Indtast et budget.");
    if (!picked?.lat || !picked?.lng) {
      return Alert.alert(
        "Vælg placering",
        "Vælg en placering (adresse eller kort)."
      );
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
        service_type: serviceType,          // matcher mekanikerens filtre
        service_name: serviceName || null,  // valgfri til UI
        description: description?.trim() || "",
        budget: parseInt(budget, 10),
        deadline:
          selectedOption === "Fleksibel" ? "flexible" : Timestamp.fromDate(date),
        deadlineType: selectedOption,
        specificTime: isSpecificTime ? selectedTime : null,
        status: "open",
        imageUrl: imageUrl || null,
        location,                           // til radius
      });

      Alert.alert("Succes", "Opgave oprettet!", [
        {
          text: "OK",
          onPress: () =>
            navigation.navigate("OwnerRoot", { screen: "Requests" }),
        },
      ]);
    } catch (err) {
      console.error("Fejl ved oprettelse af request:", err);
      Alert.alert("Fejl", "Kunne ikke oprette opgaven.");
    }
  };

  /* -------- UI helpers -------- */
  const validateStep = (idx) => {
    if (idx === 0) return !!picked && !!boatId;
    if (idx === 1) return !!serviceType;
    if (idx === 2) return !!budget && (selectedOption === "Fleksibel" || !!date);
    return true;
  };

  const next = () => {
    const ok = validateStep(step);
    if (!ok) {
      if (step === 0) return Alert.alert("Tjek trin 1", "Vælg placering og båd.");
      if (step === 1) return Alert.alert("Tjek trin 2", "Vælg en service.");
      if (step === 2) return Alert.alert("Tjek trin 3", "Angiv budget og evt. dato.");
    }
    if (step < steps.length - 1) animateToStep(step + 1);
  };
  const prev = () => {
    if (step > 0) animateToStep(step - 1);
  };

  const jumpBackTo = (idx) => {
    if (idx < step) animateToStep(idx); // kun tilbage
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  /* -------- RENDER -------- */
  const translateY = slide.interpolate({ inputRange: [0, 1], outputRange: [0, 16] });

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 84 : 0}
    >
      <ScrollView style={styles.container} contentContainerStyle={styles.scrollContent}>
        <Text style={styles.header}>Opret ny serviceopgave</Text>

        {/* Stepper */}
        <View style={styles.progressWrap}>
          {steps.map((title, idx) => {
            const done = idx < step;
            const active = idx === step;
            return (
              <TouchableOpacity
                key={title}
                style={styles.progressItem}
                activeOpacity={idx < step ? 0.7 : 1}
                onPress={() => jumpBackTo(idx)}
              >
                <View
                  style={[
                    styles.progressDot,
                    done && styles.progressDotDone,
                    active && styles.progressDotActive,
                  ]}
                >
                  <Text style={[styles.progressNumber, done && styles.progressTick]}>
                    {done ? "✓" : idx + 1}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.progressLabel,
                    active && styles.progressLabelActive,
                    done && styles.progressLabelDone,
                  ]}
                  numberOfLines={1}
                >
                  {title}
                </Text>
                {idx < steps.length - 1 && <View style={styles.progressLine} />}
              </TouchableOpacity>
            );
          })}
        </View>

        {/* Trin-indhold med smooth transition */}
        <Animated.View style={{ opacity: fade, transform: [{ translateY }] }}>
          {/* -------- STEP 1: Placering & båd -------- */}
          {renderKey === 0 && (
            <>
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
                  <TouchableOpacity onPress={geocodeAddress} style={[styles.outlineBtn, styles.btnBig]}>
                    <Text style={styles.outlineBtnText}>Brug adressen</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={openMap} style={[styles.primaryBtn, styles.btnBig]}>
                    <Text style={styles.primaryBtnText}>
                      {picked ? "Redigér på kort" : "Vælg på kort"}
                    </Text>
                  </TouchableOpacity>
                </View>

                {picked?.label ? (
                  <Text style={styles.pickedLabel}>Valgt: {picked.label}</Text>
                ) : null}
              </View>

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
                        <Text
                          style={[
                            styles.selectButtonText,
                            active && styles.selectButtonTextSelected,
                          ]}
                        >
                          {b.name}
                        </Text>
                      </TouchableOpacity>
                    );
                  })}
                </View>
              </View>
            </>
          )}

          {/* -------- STEP 2: Service -------- */}
          {renderKey === 1 && (
            <View style={styles.card}>
              <Text style={styles.sectionTitle}>Service</Text>

              <View style={styles.inputWrapper}>
                <TextInput
                  placeholder="Søg fx 'motor', 'polering'…"
                  value={serviceQuery}
                  onChangeText={setServiceQuery}
                  style={styles.input}
                  returnKeyType="search"
                />
              </View>

              <View style={styles.buttonGrid}>
                {(filteredLeaves.length ? filteredLeaves : leaves).map((leaf) => {
                  const active = serviceType === leaf.id;
                  return (
                    <TouchableOpacity
                      key={leaf.id}
                      onPress={() => onPickService(leaf)}
                      style={[styles.selectButton, active && styles.selectButtonSelected]}
                    >
                      <Text
                        style={[
                          styles.selectButtonText,
                          active && styles.selectButtonTextSelected,
                        ]}
                      >
                        {leaf.name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}

                {!leaves.length &&
                  ["Motorservice", "Bundmaling", "Vinteropbevaring", "Polering & voks", "Riggerservice", "El-arbejde", "Reparationer"]
                    .map((name) => {
                      const id = name.toLowerCase().replace(/\s|&/g, "").replace("ø","oe").replace("æ","ae").replace("å","aa");
                      const active = serviceType === id;
                      return (
                        <TouchableOpacity
                          key={id}
                          onPress={() => { setServiceType(id); setServiceName(name); }}
                          style={[styles.selectButton, active && styles.selectButtonSelected]}
                        >
                          <Text style={[styles.selectButtonText, active && styles.selectButtonTextSelected]}>{name}</Text>
                        </TouchableOpacity>
                      );
                    })}
              </View>
            </View>
          )}

          {/* -------- STEP 3: Budget & tid -------- */}
          {renderKey === 2 && (
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
                      <Text style={[styles.optionText, active && styles.optionTextSelected]}>
                        {option}
                      </Text>
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
                  {date.toLocaleDateString("da-DK")}
                </Text>
              )}

              <View style={styles.checkboxContainer}>
                <Checkbox
                  value={isSpecificTime}
                  onValueChange={setIsSpecificTime}
                  color={colors.primary}
                />
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
          )}

          {/* -------- STEP 4: Detaljer + billede + submit -------- */}
          {renderKey === 3 && (
            <>
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Beskrivelse</Text>
                <View style={styles.inputWrapper}>
                  <TextInput
                    style={[styles.input, styles.inputMultiline]}
                    placeholder="Beskriv opgaven"
                    value={description}
                    onChangeText={setDescription}
                    multiline
                  />
                </View>
              </View>

              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Billeder (valgfrit)</Text>
                <View style={styles.imagesRow}>
                  <TouchableOpacity style={styles.outlineBtn} onPress={pickImage}>
                    <Text style={styles.outlineBtnText}>Fra galleri</Text>
                  </TouchableOpacity>
                  <TouchableOpacity style={styles.outlineBtn} onPress={takePhoto}>
                    <Text style={styles.outlineBtnText}>Tag billede</Text>
                  </TouchableOpacity>
                </View>

                {image && (
                  <View style={styles.imagePreviewWrapper}>
                    <Image source={{ uri: image }} style={styles.imagePreview} />
                    <Text style={styles.imagePreviewLabel}>Billede valgt</Text>
                  </View>
                )}
              </View>

              {/* Opsummering */}
              <View style={styles.card}>
                <Text style={styles.sectionTitle}>Opsummering</Text>
                <Text style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Båd:</Text>{" "}
                  {boats.find((b) => b.id === boatId)?.name || "-"}
                </Text>
                <Text style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Service:</Text>{" "}
                  {serviceName || serviceType || "-"}
                </Text>
                <Text style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Placering:</Text>{" "}
                  {picked?.label || "-"}
                </Text>
                <Text style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Budget:</Text>{" "}
                  {budget ? `${Number(budget).toLocaleString("da-DK")} kr.` : "-"}
                </Text>
                <Text style={styles.summaryRow}>
                  <Text style={styles.summaryLabel}>Deadline:</Text>{" "}
                  {selectedOption === "Fleksibel"
                    ? "Fleksibel"
                    : `${selectedOption} ${date.toLocaleDateString("da-DK")}`}
                </Text>
              </View>

              <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
                <Text style={styles.submitButtonText}>Gem opgave</Text>
              </TouchableOpacity>
            </>
          )}
        </Animated.View>
      </ScrollView>

      {/* Sticky wizard navigation */}
      <View style={styles.wizardNav}>
        <TouchableOpacity
          onPress={prev}
          disabled={!canPrev}
          style={[styles.wizardBtn, !canPrev && styles.wizardBtnDisabled]}
        >
          <Text style={styles.wizardBtnText}>Tilbage</Text>
        </TouchableOpacity>
        {canNext ? (
          <TouchableOpacity
            onPress={next}
            style={[
              styles.wizardBtn,
              styles.wizardBtnPrimary,
              !validateStep(step) && styles.wizardBtnDisabled,
            ]}
            disabled={!validateStep(step)}
          >
            <Text style={[styles.wizardBtnText, styles.wizardBtnTextPrimary]}>Næste</Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
