import React, { useCallback, useEffect, useMemo, useRef, useState } from "react";
import { useFocusEffect } from "@react-navigation/native";
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
  KeyboardAvoidingView,
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

/* Træ -> leaves */
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

/* Upload helper */
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

export default function NewRequestScreen({ navigation, route }) {
  const steps = ["Placering & båd", "Service", "Budget & tid", "Detaljer"];
  const [step, setStep] = useState(0);

  const scrollRef = useRef(null);
  useEffect(() => {
    scrollRef.current?.scrollTo({ y: 0, animated: true });
  }, [step]);

  /* Data */
  const [boats, setBoats] = useState([]);
  const [boatId, setBoatId] = useState("");

  const [catalog, setCatalog] = useState([]);
  const [serviceQuery, setServiceQuery] = useState("");
  const [serviceType, setServiceType] = useState("");
  const [serviceName, setServiceName] = useState("");

  const [description, setDescription] = useState("");
  const [budget, setBudget] = useState("");
  const [selectedOption, setSelectedOption] = useState("Fleksibel");
  const [isSpecificTime, setIsSpecificTime] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [image, setImage] = useState(null);

  // Placering
  const [picked, setPicked] = useState(null); // { lat, lng, label }
  const [address, setAddress] = useState("");

  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

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

        const nextBoats = Array.isArray(boatsArr) ? boatsArr : [];
        setBoats(nextBoats);
        if (!boatId && nextBoats.length > 0) setBoatId(nextBoats[0].id);

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
  }, []); // kun mount

  /* Refresh boats når man kommer tilbage (efter BoatForm) */
  useFocusEffect(
    useCallback(() => {
      let alive = true;
      (async () => {
        try {
          const ownerId = auth.currentUser?.uid;
          if (!ownerId) return;

          const boatsArr = await getBoats(ownerId);
          if (!alive) return;

          const nextBoats = Array.isArray(boatsArr) ? boatsArr : [];
          setBoats(nextBoats);

          // behold valgt båd hvis den stadig findes, ellers vælg første
          if (nextBoats.length > 0) {
            const stillExists = nextBoats.some((b) => b.id === boatId);
            if (!boatId || !stillExists) setBoatId(nextBoats[0].id);
          } else {
            setBoatId("");
          }
        } catch (err) {
          console.error("Fejl ved refresh af både:", err);
        }
      })();

      return () => {
        alive = false;
      };
    }, [boatId])
  );

  /* MapPicker return */
  useEffect(() => {
    const pl = route?.params?.pickedLocation;
    if (pl?.lat && pl?.lng) {
      setPicked(pl);
      if (pl?.label) setAddress(pl.label);
    }
  }, [route?.params?.pickedLocation]);

  /* Leaves (services) */
  const leaves = useMemo(() => {
    const raw = flattenLeaves(catalog);
    // hvis catalog allerede er flad {id,name} uden children, vil flattenLeaves stadig virke
    return raw.sort((a, b) => a.name.localeCompare(b.name, "da"));
  }, [catalog]);

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

  /* Geocode adresse */
  const geocodeAddress = useCallback(async () => {
    if (!address.trim()) return Alert.alert("Adresse mangler", "Skriv en adresse.");
    try {
      const res = await Location.geocodeAsync(address.trim());
      if (!res?.length) {
        return Alert.alert(
          "Ikke fundet",
          "Kunne ikke finde adressen. Vælg på kortet i stedet."
        );
      }
      const { latitude, longitude } = res[0];
      setPicked({ lat: latitude, lng: longitude, label: address.trim() });
      Alert.alert("OK", "Placering sat ud fra adressen.");
    } catch {
      Alert.alert("Fejl", "Kunne ikke slå adressen op. Vælg på kortet.");
    }
  }, [address]);

  const openMap = useCallback(() => {
    const start = picked ? { lat: picked.lat, lng: picked.lng } : undefined;
    navigation.navigate("MapPicker", { start, returnTo: "NewRequest" });
  }, [navigation, picked]);

  /* Dato */
  const onChangeDate = (event, selectedDate) => {
    if (selectedDate) setDate(selectedDate);
    if (Platform.OS !== "ios") setShowDatePicker(false);
  };

  /* Billeder */
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
    return await getDownloadURL(storageRef);
  }

  /* Validation */
  const validateStep = (idx) => {
    if (idx === 0) return !!picked && !!boatId;
    if (idx === 1) return !!serviceType;
    if (idx === 2) return !!budget && (selectedOption === "Fleksibel" || !!date);
    return true;
  };

  const next = () => {
    if (!validateStep(step)) {
      if (step === 0) return Alert.alert("Tjek trin 1", "Vælg placering og båd.");
      if (step === 1) return Alert.alert("Tjek trin 2", "Vælg en service.");
      if (step === 2) return Alert.alert("Tjek trin 3", "Angiv budget og evt. dato.");
    }
    if (step < steps.length - 1) setStep(step + 1);
  };

  const prev = () => {
    if (step > 0) setStep(step - 1);
  };

  const jumpBackTo = (idx) => {
    if (idx < step) setStep(idx);
  };

  /* Submit */
  const handleSave = async () => {
    if (!boatId) return Alert.alert("Fejl", "Vælg en båd først.");
    if (!serviceType) return Alert.alert("Fejl", "Vælg en service.");
    if (!budget) return Alert.alert("Fejl", "Indtast et budget.");
    if (!picked?.lat || !picked?.lng) {
      return Alert.alert("Vælg placering", "Vælg en placering (adresse eller kort).");
    }

    try {
      setSubmitting(true);

      const ownerId = auth.currentUser?.uid;
      if (!ownerId) throw new Error("Ikke logget ind.");

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
        service_name: serviceName || null,
        description: description?.trim() || "",
        budget: parseInt(budget, 10),
        deadline: selectedOption === "Fleksibel" ? "flexible" : Timestamp.fromDate(date),
        deadlineType: selectedOption,
        specificTime: isSpecificTime ? selectedTime : null,
        status: "open",
        imageUrl: imageUrl || null,
        location,
      });

      Alert.alert("Succes", "Opgave oprettet!", [
        {
          text: "OK",
          onPress: () => navigation.navigate("OwnerRoot", { screen: "Requests" }),
        },
      ]);
    } catch (err) {
      console.error("Fejl ved oprettelse af request:", err);
      Alert.alert("Fejl", "Kunne ikke oprette opgaven.");
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" />
      </View>
    );
  }

  const canPrev = step > 0;
  const canNext = step < steps.length - 1;

  return (
    <KeyboardAvoidingView
      style={styles.screen}
      behavior={Platform.OS === "ios" ? "padding" : undefined}
      keyboardVerticalOffset={Platform.OS === "ios" ? 84 : 0}
    >
      <ScrollView
        ref={scrollRef}
        style={styles.container}
        contentContainerStyle={styles.scrollContent}
        keyboardShouldPersistTaps="handled"
      >
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

        {/* STEP 1 */}
        {step === 0 && (
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
                <TouchableOpacity
                  onPress={geocodeAddress}
                  style={[styles.outlineBtn, styles.btnBig]}
                >
                  <Text style={styles.outlineBtnText}>Brug adressen</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={openMap}
                  style={[styles.primaryBtn, styles.btnBig]}
                >
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

              {boats.length === 0 ? (
                <Text style={styles.pickedLabel}>
                  Du har ingen både endnu. Opret en båd først.
                </Text>
              ) : (
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
              )}
            </View>
          </>
        )}

        {/* STEP 2 */}
        {step === 1 && (
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
                [
                  "Motorservice",
                  "Bundmaling",
                  "Vinteropbevaring",
                  "Polering & voks",
                  "Riggerservice",
                  "El-arbejde",
                  "Reparationer",
                ].map((name) => {
                  const id = name
                    .toLowerCase()
                    .replace(/\s|&/g, "")
                    .replace("ø", "oe")
                    .replace("æ", "ae")
                    .replace("å", "aa");
                  const active = serviceType === id;
                  return (
                    <TouchableOpacity
                      key={id}
                      onPress={() => {
                        setServiceType(id);
                        setServiceName(name);
                      }}
                      style={[styles.selectButton, active && styles.selectButtonSelected]}
                    >
                      <Text
                        style={[
                          styles.selectButtonText,
                          active && styles.selectButtonTextSelected,
                        ]}
                      >
                        {name}
                      </Text>
                    </TouchableOpacity>
                  );
                })}
            </View>
          </View>
        )}

        {/* STEP 3 */}
        {step === 2 && (
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
                      setShowDatePicker(option !== "Fleksibel");
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

        {/* STEP 4 */}
        {step === 3 && (
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

            <TouchableOpacity
              style={styles.submitButton}
              onPress={handleSave}
              disabled={submitting}
              activeOpacity={0.9}
            >
              <Text style={styles.submitButtonText}>
                {submitting ? "Gemmer..." : "Gem opgave"}
              </Text>
            </TouchableOpacity>
          </>
        )}
      </ScrollView>

      {/* Sticky wizard navigation */}
      <View style={styles.wizardNav}>
        <TouchableOpacity
          onPress={prev}
          disabled={!canPrev || submitting}
          style={[styles.wizardBtn, (!canPrev || submitting) && styles.wizardBtnDisabled]}
        >
          <Text style={styles.wizardBtnText}>Tilbage</Text>
        </TouchableOpacity>

        {canNext ? (
          <TouchableOpacity
            onPress={next}
            style={[
              styles.wizardBtn,
              styles.wizardBtnPrimary,
              (!validateStep(step) || submitting) && styles.wizardBtnDisabled,
            ]}
            disabled={!validateStep(step) || submitting}
          >
            <Text style={[styles.wizardBtnText, styles.wizardBtnTextPrimary]}>
              Næste
            </Text>
          </TouchableOpacity>
        ) : null}
      </View>
    </KeyboardAvoidingView>
  );
}
