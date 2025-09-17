// components/boatowners/RequestBidsScreen.js
import React, { useEffect, useState } from "react";
import { View, Text, ScrollView, TouchableOpacity, Alert } from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { getBids, acceptBid, getProvider } from "../../services/requestsService";
import styles from "../../styles/boatowners/requestBidsStyles";

function DKK(n) {
  return typeof n === "number"
    ? new Intl.NumberFormat("da-DK", {
        style: "currency",
        currency: "DKK",
        maximumFractionDigits: 0,
      }).format(n)
    : "—";
}

export default function RequestBidsScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const { jobId } = route.params;

  const [bids, setBids] = useState([]);
  const [loading, setLoading] = useState(true);

  async function reload() {
    try {
      const list = await getBids(jobId);

      // Hent provider info til hvert bid
      const withProviders = await Promise.all(
        list.map(async (b) => {
          const provider = await getProvider(b.provider_id);
          return { ...b, provider };
        })
      );

      setBids(withProviders);
    } catch (e) {
      console.error("Kunne ikke hente bud:", e);
      Alert.alert("Fejl", "Kunne ikke hente bud.");
    } finally {
      setLoading(false);
    }
  }

  useEffect(() => {
    reload();
  }, [jobId]);

  async function onAccept(bidId) {
    try {
      await acceptBid(jobId, bidId);
      Alert.alert("Bud accepteret", "Opgaven er nu tildelt denne udbyder.");
      navigation.goBack();
    } catch (e) {
      Alert.alert("Fejl", "Kunne ikke acceptere bud. " + (e?.message || ""));
    }
  }

  if (loading) {
    return (
      <View style={styles.loader}>
        <Text style={styles.loaderText}>Henter bud…</Text>
      </View>
    );
  }

  return (
    <ScrollView style={styles.screen} contentContainerStyle={styles.container}>
      <Text style={styles.title}>Bud på opgaven</Text>

      {bids.length === 0 && (
        <Text style={styles.emptyText}>Ingen bud endnu</Text>
      )}

      {bids.map((b) => (
        <View key={b.id} style={styles.bidCard}>
          <Text style={styles.bidPrice}>{DKK(b.price)}</Text>
          {b.message ? <Text style={styles.bidMessage}>{b.message}</Text> : null}

          {b.provider ? (
            <View style={styles.providerBox}>
              <Text style={styles.providerName}>
                {b.provider.name || "Ukendt udbyder"}
              </Text>
              {b.provider.email && (
                <Text style={styles.providerEmail}>{b.provider.email}</Text>
              )}
            </View>
          ) : null}

          <TouchableOpacity
            style={styles.btnPrimary}
            onPress={() => onAccept(b.id)}
          >
            <Text style={styles.btnPrimaryText}>Accepter bud</Text>
          </TouchableOpacity>
        </View>
      ))}
    </ScrollView>
  );
}
