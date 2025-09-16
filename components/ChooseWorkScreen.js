import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert } from "react-native";
import { getAuth } from "firebase/auth";
import { db } from "../firebase";
import { collection, getDocs, doc, setDoc, serverTimestamp } from "firebase/firestore";

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
      await setDoc(doc(db, "providers", user.uid), { services: chosen, updatedAt: serverTimestamp() }, { merge: true });
      navigation.reset({ index: 0, routes: [{ name: "JobsFeed" }] });
    } catch (e) {
      Alert.alert("Fejl ved gem", e?.message ?? "Noget gik galt.");
    }
  };

  if (loading) {
    return (
      <View style={{ flex:1, alignItems:"center", justifyContent:"center" }}>
        <ActivityIndicator />
        <Text style={{ marginTop:8, color:"#4b5563" }}>Henter ydelser...</Text>
      </View>
    );
  }

  return (
    <View style={{ flex:1, backgroundColor:"#fff", paddingHorizontal:20, paddingTop: 16 }}>
      <Text style={{ textAlign:"center", fontSize:16, color:"#194b63", fontWeight:"600", marginBottom: 8 }}>Arbejde</Text>
      <Text style={{ fontSize:20, fontWeight:"700", marginTop: 8, marginBottom: 16 }}>Hvilke opgaver kan du udføre?</Text>

      <TouchableOpacity onPress={chooseSuggestions} style={{ backgroundColor:"#e8f0f4", paddingVertical:14, alignItems:"center", borderRadius:16, marginBottom:12 }}>
        <Text style={{ fontWeight:"700", color:"#1f5c7d" }}>Få forslag</Text>
      </TouchableOpacity>

      <Text style={{ textAlign:"center", color:"#6b7280", marginBottom:12 }}>eller</Text>

      <TouchableOpacity onPress={chooseFromList} style={{ backgroundColor:"#e8f0f4", paddingVertical:14, alignItems:"center", borderRadius:16, marginBottom:16 }}>
        <Text style={{ fontWeight:"700", color:"#1f5c7d" }}>Vælg fra liste</Text>
      </TouchableOpacity>

      {mode === "list" && (
        <FlatList
          data={services}
          keyExtractor={(item) => item.id}
          contentContainerStyle={{ paddingVertical:6 }}
          renderItem={({ item }) => (
            <TouchableOpacity
              onPress={() => toggle(item.id)}
              style={{
                paddingVertical:12,
                paddingHorizontal:14,
                marginVertical:6,
                borderRadius:12,
                borderWidth:1,
                borderColor: selected[item.id] ? "#1f5c7d" : "#d1d5db",
                backgroundColor: selected[item.id] ? "#eff6fb" : "#fff",
              }}
            >
              <Text style={{ fontSize:16 }}>{item.name}</Text>
            </TouchableOpacity>
          )}
        />
      )}

      {mode && (
        <Text style={{ textAlign:"center", color:"#6b7280", marginTop:8 }}>
          {selectedCount === 0 ? "Ingen valgt" : `${selectedCount} valgt`}
        </Text>
      )}

      <View style={{ flex:1 }} />

      <TouchableOpacity
        onPress={onDone}
        style={{ backgroundColor: mode ? "#1f5c7d" : "#93c5fd", paddingVertical:16, alignItems:"center", borderRadius:24, marginBottom: 10 }}
        disabled={!mode}
      >
        <Text style={{ color:"#fff", fontWeight:"700", fontSize:16 }}>Færdig</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.replace("Home")} style={{ alignItems:"center", marginBottom:16 }}>
        <Text style={{ color:"#1f5c7d" }}>Jeg ønsker ikke at tjene penge</Text>
      </TouchableOpacity>
    </View>
  );
}
