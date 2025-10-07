import React, { useCallback, useMemo, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import MapView, { Marker, PROVIDER_DEFAULT } from "react-native-maps";
import * as Location from "expo-location";
import styles from "../../styles/shared/mapPickerStyles";

export default function MapPickerScreen({ navigation, route }) {
  const start = route?.params?.start;

  const [region, setRegion] = useState({
    latitude: start?.lat ?? 55.6761,
    longitude: start?.lng ?? 12.5683,
    latitudeDelta: 0.05,
    longitudeDelta: 0.05,
  });
  const [pin, setPin] = useState(start ? { latitude: start.lat, longitude: start.lng } : null);
  const [reverseLoading, setReverseLoading] = useState(false);
  const [addr, setAddr] = useState("");

  const reverse = useCallback(async (latitude, longitude) => {
    setReverseLoading(true);
    try {
      const results = await Location.reverseGeocodeAsync({ latitude, longitude });
      if (results?.length) {
        const a = results[0];
        const label = [a.name, a.street, a.postalCode, a.city].filter(Boolean).join(", ");
        setAddr(label || "Ukendt adresse");
      } else setAddr("Ukendt adresse");
    } catch {
      setAddr("Ukendt adresse");
    } finally {
      setReverseLoading(false);
    }
  }, []);

  const onLongPress = useCallback(
    async (e) => {
      const { latitude, longitude } = e.nativeEvent.coordinate;
      setPin({ latitude, longitude });
      await reverse(latitude, longitude);
    },
    [reverse]
  );

  const useMyLocation = useCallback(async () => {
    try {
      const { status } = await Location.requestForegroundPermissionsAsync();
      if (status !== "granted") {
        return Alert.alert("Ingen tilladelse", "Giv adgang til placering for at bruge denne funktion.");
      }
      const pos = await Location.getCurrentPositionAsync({ accuracy: Location.Accuracy.Balanced });
      const { latitude, longitude } = pos.coords;
      setRegion((r) => ({ ...r, latitude, longitude }));
      setPin({ latitude, longitude });
      await reverse(latitude, longitude);
    } catch (e) {
      Alert.alert("Fejl", "Kunne ikke hente din position.");
    }
  }, [reverse]);

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

      {/* Top-right floating button */}
      <View style={styles.fabWrap}>
        <TouchableOpacity onPress={useMyLocation} style={styles.fab}>
          <Text style={styles.fabText}>Min position</Text>
        </TouchableOpacity>
      </View>

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

        <TouchableOpacity
          onPress={onConfirm}
          disabled={!confirmEnabled}
          style={[styles.btn, { opacity: confirmEnabled ? 1 : 0.5 }]}
        >
          <Text style={styles.btnText}>Bekræft placering</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
