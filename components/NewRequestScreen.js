// /components/NewRequestScreen.js
import React, { useEffect, useState } from "react";
import { Picker } from "@react-native-picker/picker";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  ActivityIndicator,
} from "react-native";
import { auth, db } from "../firebase";
import { collection, getDocs } from "firebase/firestore";
import { addRequest } from "../services/requestsService";

export default function NewRequestScreen({ navigation }) {
  const [boats, setBoats] = useState([]);
  const [boatId, setBoatId] = useState("");
  const [serviceType, setServiceType] = useState("bundmaling");
  const [description, setDescription] = useState("");
  const [loading, setLoading] = useState(true);

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
      });
      Alert.alert("Success", "Opgave oprettet!");
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
      <Text style={styles.title}>Opret ny serviceopgave</Text>

      <Text>Vælg båd:</Text>
      <Picker selectedValue={boatId} onValueChange={(val) => setBoatId(val)}>
        <Picker.Item label="-- Vælg båd --" value="" />
        {boats.map((b) => (
          <Picker.Item key={b.id} label={b.name} value={b.id} />
        ))}
      </Picker>

      <Text>Service type:</Text>
      <Picker
        selectedValue={serviceType}
        onValueChange={(val) => setServiceType(val)}
      >
        <Picker.Item label="Bundmaling" value="bundmaling" />
        <Picker.Item label="Vinteropbevaring" value="vinteropbevaring" />
        <Picker.Item label="Reparation" value="reparation" />
        <Picker.Item label="Elarbejde" value="elarbejde" />
        <Picker.Item label="Riggerservice" value="riggerservice" />
        <Picker.Item label="Polering" value="polering" />
      </Picker>

      <TextInput
        style={styles.input}
        placeholder="Beskrivelse"
        value={description}
        onChangeText={setDescription}
        multiline
      />

      <TouchableOpacity style={styles.saveBtn} onPress={handleSave}>
        <Text style={styles.saveBtnText}>Gem opgave</Text>
      </TouchableOpacity>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, padding: 16 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 16 },
  input: {
    borderWidth: 1,
    borderColor: "#ccc",
    padding: 12,
    borderRadius: 8,
    marginVertical: 12,
  },
  saveBtn: {
    backgroundColor: "#1f5c7d",
    padding: 16,
    borderRadius: 10,
    alignItems: "center",
    marginTop: 20,
  },
  saveBtnText: { color: "white", fontWeight: "700" },
});
