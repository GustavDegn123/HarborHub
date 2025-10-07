import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, TouchableOpacity, FlatList, ActivityIndicator, Alert } from "react-native";
import { getAuth } from "firebase/auth";

import styles from "../../styles/mechanics/chooseWorkStyles";
import { getAvailableServices, saveProviderServices } from "../../services/providersService";

const FALLBACK_SERVICES = [
  { id: "motorservice", name: "Motorservice" },
  { id: "bundmaling", name: "Bundmaling" },
  { id: "vinteropbevaring", name: "Vinteropbevaring" },
  { id: "polering", name: "Polering & voks" },
  { id: "riggerservice", name: "Riggerservice" },
  { id: "elarbejde", name: "El-arbejde" },
  { id: "reparation", name: "Reparationer" },
];

const RECOMMENDED = ["motorservice", "bundmaling", "vinteropbevaring"];

export default function ChooseWorkScreen({ navigation }) {
  const auth = getAuth();
  const user = auth.currentUser;

  const [loading, setLoading] = useState(true);
  const [services, setServices] = useState(FALLBACK_SERVICES);
  const [selected, setSelected] = useState({}); // id -> boolean
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        const arr = await getAvailableServices();
        const list = Array.isArray(arr) && arr.length > 0 ? arr : FALLBACK_SERVICES;
        list.sort((a, b) => a.name.localeCompare(b.name, "da"));
        if (!cancelled) setServices(list);
      } catch (err) {
        console.warn("Kunne ikke hente services, bruger fallback:", err);
        const list = [...FALLBACK_SERVICES].sort((a, b) => a.name.localeCompare(b.name, "da"));
        if (!cancelled) setServices(list);
      } finally {
        if (!cancelled) setLoading(false);
      }
    })();
    return () => { cancelled = true; };
  }, []);

  const selectedCount = useMemo(
    () => Object.values(selected).filter(Boolean).length,
    [selected]
  );

  const toggle = useCallback((id) => {
    setSelected((prev) => ({ ...prev, [id]: !prev[id] }));
  }, []);

  const setRecommended = useCallback(() => {
    const pre = {};
    for (const id of RECOMMENDED) pre[id] = true;
    setSelected(pre);
  }, []);

  const clearAll = useCallback(() => setSelected({}), []);

  const onDone = useCallback(async () => {
    if (!user) return Alert.alert("Ikke logget ind", "Log ind først.");
    const chosen = Object.keys(selected).filter((k) => selected[k]);
    if (chosen.length === 0) {
      return Alert.alert("Vælg mindst én ydelse", "Vælg fra listen eller brug ‘Anbefalet’.");
    }

    try {
      setSaving(true);
      await saveProviderServices(user.uid, chosen);
      // VIGTIGT: hop ind i tab-navigatoren og vælg JobsFeed
      navigation.reset({
        index: 0,
        routes: [
          {
            name: "ProviderRoot",
            params: {
              screen: "JobsFeed",
              params: { justCompletedOnboarding: true }, // valgfrit flag
            },
          },
        ],
      });
    } catch (e) {
      Alert.alert("Fejl ved gem", e?.message ?? "Noget gik galt.");
    } finally {
      setSaving(false);
    }
  }, [navigation, selected, user]);

  const onCancel = useCallback(() => {
    navigation.navigate("StartTakingJobs", { reset: true });
  }, [navigation]);

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator />
        <Text style={styles.loadingText}>Henter ydelser…</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Text style={styles.subtitle}>Arbejde</Text>
      <Text style={styles.title}>Hvilke opgaver kan du udføre?</Text>

      <View style={styles.quickRow}>
        <TouchableOpacity onPress={setRecommended} style={styles.quickBtn}>
          <Text style={styles.quickBtnText}>Anbefalet</Text>
        </TouchableOpacity>
        <TouchableOpacity onPress={clearAll} style={[styles.quickBtn, styles.quickBtnGhost]}>
          <Text style={[styles.quickBtnText, styles.quickBtnGhostText]}>Ryd alle</Text>
        </TouchableOpacity>
      </View>

      <FlatList
        data={services}
        keyExtractor={(item) => item.id}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => {
          const isOn = !!selected[item.id];
          return (
            <TouchableOpacity
              onPress={() => toggle(item.id)}
              style={[styles.serviceItem, isOn ? styles.serviceItemSelected : styles.serviceItemUnselected]}
            >
              <Text style={styles.serviceItemText}>{item.name}</Text>
              <Text style={[styles.serviceTick, isOn ? styles.serviceTickOn : styles.serviceTickOff]}>
                {isOn ? "✓" : "＋"}
              </Text>
            </TouchableOpacity>
          );
        }}
      />

      <Text style={styles.selectedInfo}>
        {selectedCount === 0 ? "Ingen valgt" : `${selectedCount} valgt`}
      </Text>

      <View style={styles.spacer} />

      <TouchableOpacity
        onPress={onDone}
        disabled={selectedCount === 0 || saving}
        style={[
          styles.doneButton,
          selectedCount === 0 || saving ? styles.doneButtonDisabled : styles.doneButtonEnabled,
        ]}
      >
        {saving ? <ActivityIndicator color="#fff" /> : <Text style={styles.doneButtonText}>Færdig</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={onCancel} style={styles.cancelButton} disabled={saving}>
        <Text style={styles.cancelButtonText}>Jeg ønsker ikke at tjene penge</Text>
      </TouchableOpacity>
    </View>
  );
}
