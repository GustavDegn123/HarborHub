import React, { useCallback, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, StyleSheet, ActivityIndicator, Alert } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";

export default function MapPickerScreen({ navigation, route }) {
  const start = route?.params?.start;
  const [region, setRegion] = useState(() => ({
    latitude: start?.lat ?? 55.6761,
    longitude: start?.lng ?? 12.5683,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  }));
  const [pin, setPin] = useState(start ? { latitude: start.lat, longitude: start.lng } : null);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [addr, setAddr] = useState("");

  const onLongPress = useCallback(async (e) => {
    const { latitude, longitude } = e.nativeEvent.coordinate;
    setPin({ latitude, longitude });
    setReverseLoading(true);
    try {
      const r = await Location.reverseGeocodeAsync({ latitude, longitude });
      let label = "";
      if (r?.length) {
        const a = r[0];
        label = [a.name, a.street, a.postalCode, a.city].filter(Boolean).join(", ");
      }
      setAddr(label || "Ukendt adresse");
    } catch {
      setAddr("Ukendt adresse");
    } finally {
      setReverseLoading(false);
    }
  }, []);

  const confirmEnabled = useMemo(() => !!pin, [pin]);

  const onConfirm = () => {
    if (!pin) {
      Alert.alert("Vælg et punkt", "Hold fingeren nede på kortet for at sætte en pin.");
      return;
    }
    navigation.navigate({
      name: route?.params?.returnTo ?? "StartTakingJobs",
      params: { pickedLocation: { lat: pin.latitude, lng: pin.longitude, label: addr } },
      merge: true,
    });
  };

  return (
    <View style={{ flex: 1 }}>
      <MapView
        style={{ flex: 1 }}
        provider={PROVIDER_DEFAULT}
        initialRegion={region}
        onRegionChangeComplete={setRegion}
        onLongPress={onLongPress}
      >
        {pin && <Marker coordinate={pin} />}
      </MapView>

      <View style={styles.panel}>
        {reverseLoading ? (
          <View style={styles.row}>
            <ActivityIndicator />
            <Text style={styles.addr}> Finder adresse...</Text>
          </View>
        ) : (
          <Text style={styles.addr} numberOfLines={2}>
            {addr || "Long-press på kortet for at sætte en pin"}
          </Text>
        )}

        <TouchableOpacity onPress={onConfirm} disabled={!confirmEnabled} style={[styles.btn, { opacity: confirmEnabled ? 1 : 0.5 }]}>
          <Text style={styles.btnText}>Bekræft placering</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  panel: { position: "absolute", left: 12, right: 12, bottom: 16, backgroundColor: "white", borderRadius: 14, padding: 12, shadowColor: "#000", shadowOpacity: 0.1, shadowRadius: 8, elevation: 3 },
  row: { flexDirection: "row", alignItems: "center" },
  addr: { color: "#374151", fontSize: 14, marginTop: 2 },
  btn: { marginTop: 10, backgroundColor: "#1f5c7d", paddingVertical: 12, alignItems: "center", borderRadius: 10 },
  btnText: { color: "white", fontWeight: "700" },
});
