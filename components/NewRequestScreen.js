// /components/NewRequestScreen.js
import React, { useEffect, useState } from "react";
import { Picker } from "@react-native-picker/picker";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  Alert,
  ActivityIndicator,
  Platform,
} from "react-native";
import Checkbox from "expo-checkbox";
import DateTimePicker from "@react-native-community/datetimepicker";
import { auth, db } from "../firebase";
import { collection, getDocs, Timestamp } from "firebase/firestore";
import { addRequest } from "../services/requestsService";
import styles from "../styles/newRequestStyles";

export default function NewRequestScreen({ navigation }) {
  const [boats, setBoats] = useState([]);
  const [boatId, setBoatId] = useState("");
  const [serviceType, setServiceType] = useState("bundmaling");
  const [description, setDescription] = useState("");

  const [selectedOption, setSelectedOption] = useState("Fleksibel");
  const [isSpecificTime, setIsSpecificTime] = useState(false);
  const [selectedTime, setSelectedTime] = useState("");
  const [date, setDate] = useState(new Date());
  const [showDatePicker, setShowDatePicker] = useState(false);

  const [loading, setLoading] = useState(true);

  // Hent både fra Firestore
  useEffect(() => {
    const loadBoats = async () => {
      try {
        const ownerId = auth.currentUser.uid;
        const ref = collection(db, "owners", ownerId, "boats");
        const snap = await getDocs(ref);
        const data = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
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

  // Gem request
  const handleSave = async () => {
    if (!boatId) {
      Alert.alert("Fejl", "Vælg en båd først.");
      return;
    }
    try {
      const ownerId = auth.currentUser.uid;
      await addRequest(ownerId, boatId, {
        service_type: serviceType,
        description,
        option: selectedOption,
        date: Timestamp.fromDate(date),
        specificTime: isSpecificTime ? selectedTime : null,
        status: "open",
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
    <View style={styles.container}>
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
        serviceType === type.toLowerCase() && styles.selectButtonSelected,
      ]}
      onPress={() => setServiceType(type.toLowerCase())}
    >
      <Text
        style={[
          styles.selectButtonText,
          serviceType === type.toLowerCase() && styles.selectButtonTextSelected,
        ]}
      >
        {type}
      </Text>
    </TouchableOpacity>
  ))}
</View>


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
        <DateTimePicker value={date} mode="date" display="default" onChange={onChangeDate} />
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
        <Text style={styles.checkboxLabel}>Det skal være et specifikt tidsrum</Text>
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

      {/* --- Gem --- */}
      <TouchableOpacity style={styles.submitButton} onPress={handleSave}>
        <Text style={styles.submitButtonText}>Gem opgave</Text>
      </TouchableOpacity>
    </View>
  );
}
