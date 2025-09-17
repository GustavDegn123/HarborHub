import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert } from "react-native";
import { getAuth } from "firebase/auth";
import { db } from "../../firebase";
import { collection, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";
import styles from "../../styles/mechanics/chooseWorkStyles";

const FALLBACK_SERVICES = [
  { id: "motorservice", name: "Motorservice" },
  { id: "bundmaling", name: "Bundmaling" },
  { id: "vinteropbevaring", name: "Vinteropbevaring" },
  { id: "polering", name: "Polering & voks" },
  { id: "riggerservice", name: "Riggerservice" },
  { id: "elarbejde", name: "El-arbejde" },
  { id: "reparation", name: "Reparationer" },
];

export default function ChooseWorkScreen({ navigation }) {
  const auth = getAuth();
  const user = auth.currentUser;
  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState(FALLBACK_SERVICES);
  const [mode, setMode] = useState(null);
  const [selected, setSelected] = useState({});

  useEffect(() => {
    let cancel = false;
    (async () => {
      try {
        const snap = await getDocs(collection(db, "services"));
        if (!cancel && !snap.empty) {
          const arr = snap.docs.map(d => ({ id: d.id, ...(d.data()||{}), name: d.data()?.name || d.id }));
          setServices(arr);
        }
      } catch {} 
      finally { if (!cancel) setLoading(false); }
    })();
    return () => { cancel = true; };
  }, []);

  const selectedCount = useMemo(() => Object.values(selected).filter(Boolean).length, [selected]);
  const toggle = (id) => setSelected(prev => ({ ...prev, [id]: !prev[id] }));

  const chooseSuggestions = () => {
    const popular = ["motorservice", "bundmaling", "vinteropbevaring"];
    const pre = {};
    popular.forEach(id => pre[id] = true);
    setSelected(pre);
    setMode("suggest");
  };

  const chooseFromList = () => setMode("list");

  const onDone = async () => {
    if (!user) return Alert.alert("Ikke logget ind", "Log ind først.");
    const chosen = Object.keys(selected).filter(k => selected[k]);
    if (chosen.length === 0) return Alert.alert("Vælg mindst én ydelse", "Vælg fra liste eller brug forslag.");
    try {
      await setDoc(
        doc(db, "providers", user.uid),
        { services: chosen, updatedAt: serverTimestamp() },
        { merge: true }
      );
      navigation.reset({ index: 0, routes: [{ name: "JobsFeed" }] });
    } catch (e) {
      Alert.alert("Fejl ved gem", e?.message ?? "Noget gik galt.");
    }
  };

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Henter ydelser...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Arbejde</Text>
      <Text style={styles.title}>Hvilke opgaver kan du udføre?</Text>

      <TouchableOpacity onPress={chooseSuggestions} style={styles.suggestionButton}>
        <Text style={styles.suggestionButtonText}>Få forslag</Text>
      </TouchableOpacity>

      <Text style={styles.orText}>eller</Text>

      <TouchableOpacity onPress={chooseFromList} style={styles.listButton}>
        <Text style={styles.listButtonText}>Vælg fra liste</Text>
      </TouchableOpacity>

      {mode === "list" && (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          contentContainerStyle={styles.listContent}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => toggle(item.id)}
              style={[
                styles.serviceItem,
                selected[item.id] ? styles.serviceItemSelected : styles.serviceItemUnselected,
              ]}
            >
              <Text style={styles.serviceItemText}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {mode && (
        <Text style={styles.selectedInfo}>
          {selectedCount === 0 ? "Ingen valgt" : `${selectedCount} valgt`}
        </Text>
      )}

      <View style={styles.spacer} />

      <TouchableOpacity
        onPress={onDone}
        style={[styles.doneButton, mode ? styles.doneButtonEnabled : styles.doneButtonDisabled]}
        disabled={!mode}
      >
        <Text style={styles.doneButtonText}>Færdig</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.replace("ProviderHome")} style={styles.cancelButton}>
        <Text style={styles.cancelButtonText}>Jeg ønsker ikke at tjene penge</Text>
      </TouchableOpacity>
    </View>
  );
}
