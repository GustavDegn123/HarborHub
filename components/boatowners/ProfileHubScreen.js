// /components/boatowners/ProfileHubScreen.js
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  Pressable,
  Alert,
  Image,
  Platform,
  ActionSheetIOS,
  Linking,
  TouchableOpacity,
  ScrollView,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { useBottomTabBarHeight } from "@react-navigation/bottom-tabs";
import * as ImagePicker from "expo-image-picker";
import { updateProfile } from "firebase/auth";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";

import DeleteAccountSection from "../shared/DeleteAccountSection";
import { logout } from "../../services/authService";
import { auth, storage } from "../../firebase";
import styles, { colors } from "../../styles/boatowners/profileHubStyles";

/* Link-konstanter */
const SUPPORT_URL = "https://www.harborhub.me/";
const PRIVACY_URL = "https://www.harborhub.me/privacy.html";
const TERMS_URL = "https://www.harborhub.me/terms.html";
const SUPPORT_EMAIL = "support@harborhub.me";

export default function ProfileHubScreen({ navigation }) {
  const user = auth.currentUser;

  const insets = useSafeAreaInsets();
  const tabBarHeight = useBottomTabBarHeight();

  const [uploading, setUploading] = useState(false);

  // ✅ Lokal “reactive” avatar state så UI opdaterer med det samme
  const [photoURL, setPhotoURL] = useState(user?.photoURL || null);

  const go = (route) => navigation.navigate(route);

  const initials = useMemo(() => {
    const name = user?.displayName || "";
    const parts = name.trim().split(/\s+/).slice(0, 2);
    if (!parts.length) return "🙂";
    return parts.map((p) => p[0]?.toUpperCase() || "").join("");
  }, [user?.displayName]);

  // ---- Upload helpers ----
  function uriToBlob(uri) {
    return new Promise((resolve, reject) => {
      const xhr = new XMLHttpRequest();
      xhr.onload = () => resolve(xhr.response);
      xhr.onerror = () => reject(new TypeError("Netværksrequest fejlede."));
      xhr.responseType = "blob";
      xhr.open("GET", uri, true);
      xhr.send(null);
    });
  }

  function guessExtFromUri(uri) {
    try {
      const clean = String(uri || "").split("?")[0];
      const m = clean.match(/\.([a-zA-Z0-9]+)$/);
      const ext = (m?.[1] || "jpg").toLowerCase();
      // begræns til typiske billedtyper
      if (!["jpg", "jpeg", "png", "webp"].includes(ext)) return "jpg";
      return ext === "jpeg" ? "jpg" : ext;
    } catch {
      return "jpg";
    }
  }

  async function uploadAvatarAsync(localUri) {
    if (!user?.uid) throw new Error("Ikke logget ind.");
    const uid = user.uid;

    const ext = guessExtFromUri(localUri);
    const contentType = `image/${ext === "jpg" ? "jpeg" : ext}`;

    const storageRef = ref(storage, `profiles/${uid}/avatar.${ext}`);
    const blob = await uriToBlob(localUri);
    await uploadBytes(storageRef, blob, { contentType });

    const url = await getDownloadURL(storageRef);
    return url;
  }

  async function pickFromLibrary() {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert(
        "Tilladelse mangler",
        "Giv adgang til billeder for at uploade et profilfoto."
      );
      return null;
    }
    const res = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      allowsEditing: true,
      aspect: [1, 1],
      quality: 0.85,
    });
    if (res.canceled) return null;
    return res.assets?.[0]?.uri || null;
  }

  async function takePhoto() {
    const perm = await ImagePicker.requestCameraPermissionsAsync();
    if (!perm.granted) {
      Alert.alert("Tilladelse kræves", "Du skal give adgang til kameraet.");
      return null;
    }
    const res = await ImagePicker.launchCameraAsync({
      allowsEditing: true,
      quality: 0.85,
      aspect: [1, 1],
    });
    if (res.canceled) return null;
    return res.assets?.[0]?.uri || null;
  }

  async function handlePickAvatar() {
    if (!user?.uid) {
      Alert.alert("Ikke logget ind", "Log ind for at ændre profilbillede.");
      return;
    }

    try {
      const chooseAndHandle = async (source) => {
        const uri = source === "camera" ? await takePhoto() : await pickFromLibrary();
        if (!uri) return;

        // ✅ Vis billedet med det samme (lokal preview)
        const previous = photoURL;
        setPhotoURL(uri);

        setUploading(true);

        try {
          const url = await uploadAvatarAsync(uri);

          // cache-bust så Image opdaterer med det samme
          const bust = `${url}${url.includes("?") ? "&" : "?"}t=${Date.now()}`;

          // Opdatér auth-profil (så det også er “rigtigt” efter genstart/login)
          await updateProfile(auth.currentUser, { photoURL: bust });

          // ✅ Opdatér UI-state til endelig URL (ikke kun local file://)
          setPhotoURL(bust);

          Alert.alert("Profilbillede opdateret", "Dit profilbillede er gemt.");
        } catch (e) {
          // Hvis upload fejler: rull tilbage til forrige billede
          setPhotoURL(previous || null);
          throw e;
        } finally {
          setUploading(false);
        }
      };

      if (Platform.OS === "ios") {
        ActionSheetIOS.showActionSheetWithOptions(
          { options: ["Tag billede", "Vælg fra arkiv", "Annullér"], cancelButtonIndex: 2 },
          (btn) => {
            if (btn === 0) chooseAndHandle("camera");
            else if (btn === 1) chooseAndHandle("library");
          }
        );
      } else {
        Alert.alert(
          "Vælg kilde",
          undefined,
          [
            { text: "Tag billede", onPress: () => chooseAndHandle("camera") },
            { text: "Vælg fra arkiv", onPress: () => chooseAndHandle("library") },
            { text: "Annullér", style: "cancel" },
          ],
          { cancelable: true }
        );
      }
    } catch (e) {
      console.error(e);
      Alert.alert("Fejl", e?.message || "Kunne ikke opdatere profilbilledet.");
      setUploading(false);
    }
  }

  const handleLogout = async () => {
    try {
      await logout();
      Alert.alert("Logget ud", "Du er nu logget ud.");
    } catch (err) {
      console.error("Fejl ved log ud:", err);
      Alert.alert("Fejl", "Kunne ikke logge ud, prøv igen.");
    }
  };

  const bottomPad = tabBarHeight + insets.bottom + 16;
  const openURL = (url) => Linking.openURL(url);

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView
        contentContainerStyle={[styles.body, { paddingBottom: bottomPad }]}
        keyboardShouldPersistTaps="handled"
      >
        {/* Hero */}
        <View style={styles.hero}>
          <Pressable
            onPress={handlePickAvatar}
            disabled={uploading}
            style={({ pressed }) => [
              styles.avatar,
              pressed && styles.avatarPressed,
            ]}
          >
            {photoURL ? (
              // ✅ key tvinger remount når URL ændrer sig (løser caching/stale rendering)
              <Image key={photoURL} source={{ uri: photoURL }} style={styles.avatarImg} />
            ) : (
              <Text style={styles.avatarInitials}>{initials}</Text>
            )}

            <View style={styles.avatarEditBadge}>
              <View style={styles.avatarEditCircle}>
                <Ionicons name="camera" size={13} color={colors.primary} />
              </View>
            </View>
          </Pressable>

          <View style={styles.heroTextWrap}>
            <Text style={styles.heroTitle}>Min profil</Text>
            <Text style={styles.heroSub}>
              {user?.displayName || "Bådejer"}
              {user?.email ? ` • ${user.email}` : ""}
            </Text>
            <Text style={styles.heroHint}>
              Tryk på billedet for at {photoURL ? "skifte" : "tilføje"} profilbillede
              {uploading ? " – uploader…" : ""}
            </Text>
          </View>
        </View>

        {/* Menu-kort */}
        <View style={styles.card}>
          <MenuItem icon="boat-outline" label="Tilføj båd" onPress={() => go("BoatForm")} />
          <Separator />
          <MenuItem icon="person-circle-outline" label="Personlige detaljer" onPress={() => go("BoatProfile")} />
          <Separator />
          <MenuItem icon="checkmark-done-outline" label="Afsluttede opgaver" onPress={() => go("OwnerHistory")} />
          <Separator />
          <MenuItem icon="chatbubble-ellipses-outline" label="Chatbot" onPress={() => go("ChatBot")} />
        </View>

        {/* Hjælp & juridisk */}
        <View style={[styles.card, styles.cardSpacer]}>
          <Text style={styles.helpTitle}>Hjælp & juridisk</Text>
          <View style={styles.supportRow}>
            <TouchableOpacity onPress={() => openURL(SUPPORT_URL)} style={styles.supportBtn}>
              <Text style={styles.supportBtnText}>Support</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openURL(PRIVACY_URL)} style={styles.supportBtn}>
              <Text style={styles.supportBtnText}>Privatliv</Text>
            </TouchableOpacity>
            <TouchableOpacity onPress={() => openURL(TERMS_URL)} style={styles.supportBtn}>
              <Text style={styles.supportBtnText}>Vilkår</Text>
            </TouchableOpacity>
          </View>

          <Pressable onPress={() => openURL(`mailto:${SUPPORT_EMAIL}`)} style={styles.supportEmailLink}>
            <Text style={styles.supportEmailText}>Skriv til {SUPPORT_EMAIL}</Text>
          </Pressable>
        </View>

        {/* Log ud */}
        <View style={styles.logoutCard}>
          <Pressable
            onPress={handleLogout}
            style={({ pressed }) => [
              styles.logoutGhost,
              pressed && styles.logoutGhostPressed,
            ]}
          >
            <Ionicons name="log-out-outline" size={18} color={colors.danger} />
            <Text style={styles.logoutGhostText}>Log ud</Text>
          </Pressable>
        </View>

        {/* Slet konto */}
        <DeleteAccountSection style={styles.deleteSection} />
      </ScrollView>
    </SafeAreaView>
  );
}

/* --- Underkomponenter --- */
function MenuItem({ icon, label, onPress }) {
  return (
    <Pressable
      onPress={onPress}
      android_ripple={{ color: "#e2e8f0" }}
      style={({ pressed }) => [styles.itemRow, pressed && styles.itemRowPressed]}
    >
      <View style={styles.itemIconWrap}>
        <Ionicons name={icon} size={18} color={colors.primary} />
      </View>
      <Text style={styles.itemLabel}>{label}</Text>
      <Ionicons name="chevron-forward" size={18} color={colors.iconMuted} style={styles.itemChevron} />
    </Pressable>
  );
}
function Separator() {
  return <View style={styles.separator} />;
}
