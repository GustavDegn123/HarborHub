import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
} from "react-native";
import { addBoat } from "../../services/boatsService";
import { auth } from "../../firebase";
import styles from "../../styles/boatowners/boatFormStyles";

export default function BoatFormScreen({ navigation }) {
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [type, setType] = useState("sailboat");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [draft, setDraft] = useState("");
  const [year, setYear] = useState("");
  const [avgSpeed, setAvgSpeed] = useState("");
  const [fuelConsumption, setFuelConsumption] = useState("");
  const [freeHarbor, setFreeHarbor] = useState(false);

  const handleSave = async () => {
    const ownerId = auth.currentUser.uid;
    await addBoat(ownerId, {
      name,
      model,
      type,
      length: parseFloat(length) || 0,
      width: parseFloat(width) || 0,
      draft: parseFloat(draft) || 0,
      year: parseInt(year) || null,
      avgSpeed: parseFloat(avgSpeed) || 0,
      fuelConsumption: parseFloat(fuelConsumption) || 0,
      freeHarbor,
    });
    navigation.goBack();
  };

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      keyboardShouldPersistTaps="handled"
    >
      <Text style={styles.title}>Tilføj en båd</Text>

      <TextInput
        style={styles.input}
        placeholder="Bådnavn"
        value={name}
        onChangeText={setName}
      />
      <TextInput
        style={styles.input}
        placeholder="Model"
        value={model}
        onChangeText={setModel}
      />

      <View style={styles.row}>
        <TouchableOpacity
          style={[
            styles.typeBtn,
            type === "sailboat" ? styles.typeBtnActive : styles.typeBtnInactive,
          ]}
          onPress={() => setType("sailboat")}
          accessibilityRole="button"
          accessibilityState={{ selected: type === "sailboat" }}
        >
          <Text
            style={[
              styles.typeBtnText,
              type === "sailboat"
                ? styles.typeBtnTextActive
                : styles.typeBtnTextInactive,
            ]}
          >
            Sejlbåd
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[
            styles.typeBtn,
            type === "motorboat" ? styles.typeBtnActive : styles.typeBtnInactive,
          ]}
          onPress={() => setType("motorboat")}
          accessibilityRole="button"
          accessibilityState={{ selected: type === "motorboat" }}
        >
          <Text
            style={[
              styles.typeBtnText,
              type === "motorboat"
                ? styles.typeBtnTextActive
                : styles.typeBtnTextInactive,
            ]}
          >
            Motorbåd
          </Text>
        </TouchableOpacity>
      </View>

      <TextInput
        style={styles.input}
        placeholder="Længde (m)"
        keyboardType="numeric"
        value={length}
        onChangeText={setLength}
      />
      <TextInput
        style={styles.input}
        placeholder="Bredde (m)"
        keyboardType="numeric"
        value={width}
        onChangeText={setWidth}
      />
      <TextInput
        style={styles.input}
        placeholder="Dybgang (m)"
        keyboardType="numeric"
        value={draft}
        onChangeText={setDraft}
      />
      <TextInput
        style={styles.input}
        placeholder="Årgang"
        keyboardType="numeric"
        value={year}
        onChangeText={setYear}
      />
      <TextInput
        style={styles.input}
        placeholder="Gennemsnitsfart (knob)"
        keyboardType="numeric"
        value={avgSpeed}
        onChangeText={setAvgSpeed}
      />
      <TextInput
        style={styles.input}
        placeholder="Brændstofforbrug (L/t)"
        keyboardType="numeric"
        value={fuelConsumption}
        onChangeText={setFuelConsumption}
      />

      <View style={styles.row}>
        <Text style={{ flex: 1 }}>Frihavns mærke?</Text>
        <Switch value={freeHarbor} onValueChange={setFreeHarbor} />
      </View>

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Gem båd</Text>
      </TouchableOpacity>
    </ScrollView>
  );
}