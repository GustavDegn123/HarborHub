import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, ScrollView, Switch } from "react-native";
import { addBoat } from "../services/boatsService";
import { auth } from "../firebase";

export default function BoatFormScreen({ navigation }) {
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [type, setType] = useState("sailboat"); // "sailboat" | "motorboat"
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
    navigation.goBack(); // tilbage til OwnerHomeScreen fx
  };

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.title}>Tilføj en båd</Text>

      <TextInput style={styles.input} placeholder="Bådnavn" value={name} onChangeText={setName} />
      <TextInput style={styles.input} placeholder="Model" value={model} onChangeText={setModel} />

      <View style={styles.row}>
        <TouchableOpacity
          style={[styles.typeBtn, type === "sailboat" && styles.typeBtnActive]}
          onPress={() => setType("sailboat")}
        >
          <Text style={styles.typeBtnText}>Sejlbåd</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[styles.typeBtn, type === "motorboat" && styles.typeBtnActive]}
          onPress={() => setType("motorboat")}
        >
          <Text style={styles.typeBtnText}>Motorbåd</Text>
        </TouchableOpacity>
      </View>

      <TextInput style={styles.input} placeholder="Længde (m)" keyboardType="numeric" value={length} onChangeText={setLength} />
      <TextInput style={styles.input} placeholder="Bredde (m)" keyboardType="numeric" value={width} onChangeText={setWidth} />
      <TextInput style={styles.input} placeholder="Dybgang (m)" keyboardType="numeric" value={draft} onChangeText={setDraft} />
      <TextInput style={styles.input} placeholder="Årgang" keyboardType="numeric" value={year} onChangeText={setYear} />
      <TextInput style={styles.input} placeholder="Gennemsnitsfart (knob)" keyboardType="numeric" value={avgSpeed} onChangeText={setAvgSpeed} />
      <TextInput style={styles.input} placeholder="Brændstofforbrug (L/t)" keyboardType="numeric" value={fuelConsumption} onChangeText={setFuelConsumption} />

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

const styles = StyleSheet.create({
  container: { padding: 20 },
  title: { fontSize: 22, fontWeight: "700", marginBottom: 20 },
  input: { borderWidth: 1, borderColor: "#ccc", padding: 12, borderRadius: 8, marginBottom: 12 },
  row: { flexDirection: "row", alignItems: "center", marginBottom: 12 },
  typeBtn: { flex: 1, padding: 12, borderWidth: 1, borderColor: "#ccc", borderRadius: 8, alignItems: "center" },
  typeBtnActive: { backgroundColor: "#1f5c7d", borderColor: "#1f5c7d" },
  typeBtnText: { color: "white" },
  saveBtn: { backgroundColor: "#1f5c7d", padding: 16, borderRadius: 10, alignItems: "center", marginTop: 20 },
  saveBtnText: { color: "white", fontWeight: "700" },
});
