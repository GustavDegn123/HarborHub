import React, { useEffect, useState } from "react";
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
import { auth, storage } from "../../firebase";
import { Timestamp } from "firebase/firestore";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

// services
import { getBoats } from "../../services/boatsService";
import { addRequest } from "../../services/requestsService";

// styles
import styles from "../../styles/boatowners/newRequestStyles";

export default function NewRequestScreen({ navigation }) {
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

  // billede
  const [image, setImage] = useState(null);

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

  const onChangeDate = (event, selectedDate) => {
    const currentDate = selectedDate || date;
    setShowDatePicker(Platform.OS === "ios");
    setDate(currentDate);
  };

  // helper: konverter file:// til blob
  async function uriToBlob(uri) {
    return await new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = function () {
        resolve(xhr.response);
      };
      xhr.onerror = function () {
        reject(new TypeError("Netværksrequest fejlede."));
      };
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });
  }

  // vælg billede fra galleri
  const pickImage = async () => {
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      quality: 0.8,
    });
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // tag billede med kamera
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
    if (!result.canceled) {
      setImage(result.assets[0].uri);
    }
  };

  // upload til Firebase Storage
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
    if (!boatId) {
      Alert.alert("Fejl", "Vælg en båd først.");
      return;
    }
    if (!budget) {
      Alert.alert("Fejl", "Indtast et budget.");
      return;
    }

    try {
      const ownerId = auth.currentUser.uid;
      let imageUrl = null;

      if (image) {
        imageUrl = await uploadImageAsync(image, ownerId);
      }

      await addRequest(ownerId, boatId, {
        service_type: serviceType,
        description,
        budget: parseInt(budget, 10),
        deadline:
          selectedOption === "Fleksibel"
            ? "flexible"
            : Timestamp.fromDate(date),
        deadlineType: selectedOption,
        specificTime: isSpecificTime ? selectedTime : null,
        status: "open",
        imageUrl: imageUrl || null, // 👈 gemmes konsekvent som imageUrl
      });

      Alert.alert("Succes", "Opgave oprettet!");
      navigation.goBack();
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
    <ScrollView style={styles.container} contentContainerStyle={{ paddingBottom: 30 }}>
      <Text style={styles.header}>Opret ny serviceopgave</Text>

      {/* --- Vælg båd --- */}
      <Text style={styles.label}>Vælg båd:</Text>
      <View style={styles.buttonGrid}>
        {boats.map((b) => (
          <TouchableOpacity
            key={b.id}
            style={[
              styles.selectButton,
              boatId === b.id && styles.selectButtonSelected,
            ]}
            onPress={() => setBoatId(b.id)}
          >
            <Text
              style={[
                styles.selectButtonText,
                boatId === b.id && styles.selectButtonTextSelected,
              ]}
            >
              {b.name}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* --- Service type --- */}
      <Text style={styles.label}>Service type:</Text>
      <View style={styles.buttonGrid}>
        {[
          "Bundmaling",
          "Vinteropbevaring",
          "Reparation",
          "Elarbejde",
          "Riggerservice",
          "Polering",
        ].map((type) => (
          <TouchableOpacity
            key={type}
            style={[
              styles.selectButton,
              serviceType === type.toLowerCase() &&
                styles.selectButtonSelected,
            ]}
            onPress={() => setServiceType(type.toLowerCase())}
          >
            <Text
              style={[
                styles.selectButtonText,
                serviceType === type.toLowerCase() &&
                  styles.selectButtonTextSelected,
              ]}
            >
              {type}
            </Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* --- Budget --- */}
      <Text style={styles.label}>Budget (DKK):</Text>
      <TextInput
        style={styles.input}
        keyboardType="numeric"
        placeholder="Indtast budget"
        value={budget}
        onChangeText={setBudget}
      />

      {/* --- Hvornår --- */}
      <Text style={styles.label}>Hvornår skal det ordnes?</Text>
      <View style={styles.optionRow}>
        {["På Dato", "Før Dato", "Fleksibel"].map((option) => (
          <TouchableOpacity
            key={option}
            style={[
              styles.optionButton,
              selectedOption === option && styles.optionButtonSelected,
            ]}
            onPress={() => {
              setSelectedOption(option);
              if (option === "På Dato" || option === "Før Dato") {
                setShowDatePicker(true);
              }
            }}
          >
            <Text
              style={[
                styles.optionText,
                selectedOption === option && styles.optionTextSelected,
              ]}
            >
              {option}
            </Text>
          </TouchableOpacity>
        ))}
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
        <Text style={{ marginTop: 10, fontWeight: "600" }}>
          {selectedOption === "Før Dato" ? "Senest: " : "Dato: "}
          {date.toLocaleDateString()}
        </Text>
      )}

      {/* --- Specifikt tidsrum --- */}
      <View style={styles.checkboxContainer}>
        <Checkbox
          value={isSpecificTime}
          onValueChange={setIsSpecificTime}
          color={isSpecificTime ? "#1f5c7d" : undefined}
          style={{ marginRight: 8 }}
        />
        <Text style={styles.checkboxLabel}>
          Det skal være et specifikt tidsrum
        </Text>
      </View>

      {isSpecificTime && (
        <View style={styles.timeRow}>
          {[
            { label: "Morgen", sub: "Før 10" },
            { label: "Middag", sub: "10-14" },
            { label: "Eftermiddag", sub: "14-18" },
            { label: "Aften", sub: "Efter 18" },
          ].map((t) => (
            <TouchableOpacity
              key={t.label}
              style={[
                styles.timeButton,
                selectedTime === t.label && styles.timeButtonSelected,
              ]}
              onPress={() => setSelectedTime(t.label)}
            >
              <Text style={styles.timeLabel}>{t.label}</Text>
              <Text style={styles.timeSub}>{t.sub}</Text>
            </TouchableOpacity>
          ))}
        </View>
      )}

      {/* --- Beskrivelse --- */}
      <TextInput
        style={styles.input}
        placeholder="Beskriv opgaven"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      {/* --- Billede --- */}
      <Text style={styles.label}>Tilføj billede:</Text>
      <View style={{ flexDirection: "row", gap: 10, marginBottom: 15 }}>
        <TouchableOpacity style={styles.selectButton} onPress={pickImage}>
          <Text style={styles.selectButtonText}>Fra galleri</Text>
        </TouchableOpacity>
        <TouchableOpacity style={styles.selectButton} onPress={takePhoto}>
          <Text style={styles.selectButtonText}>Tag billede</Text>
        </TouchableOpacity>
      </View>

      {image && (
        <View style={{ alignItems: "center", marginBottom: 15 }}>
          <Image
            source={{ uri: image }}
            style={{ width: 200, height: 200, borderRadius: 8 }}
          />
          <Text style={{ marginTop: 5 }}>Billede valgt</Text>
        </View>
      )}

      {/* --- Gem --- */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
        <Text style={styles.submitButtonText}>Gem opgave</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}