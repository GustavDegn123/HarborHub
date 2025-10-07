// utils/notifications.js
import * as Notifications from "expo-notifications";
import * as Device from "expo-device";
import { Platform, Alert } from "react-native";
import { navigate } from "../navigation/navRef";

// Vis notifikation i forgrunden
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowAlert: true,
    shouldPlaySound: true,
    shouldSetBadge: false,
  }),
});

export async function ensureAndroidChannel() {
  if (Platform.OS === "android") {
    await Notifications.setNotificationChannelAsync("default", {
      name: "Default",
      importance: Notifications.AndroidImportance.MAX,
      vibrationPattern: [0, 250, 250, 250],
      sound: "default",
      lightColor: "#FF231F7C",
    });
  }
}

export async function askNotificationPermission() {
  if (!Device.isDevice) return false;
  const { status: existing } = await Notifications.getPermissionsAsync();
  if (existing === "granted") return true;
  const { status } = await Notifications.requestPermissionsAsync();
  return status === "granted";
}

/**
 * Lokal test: send evt. med et jobId, så tap åbner den rigtige skærm.
 * Brug: scheduleLocalTest("ABC123")
 */
export async function scheduleLocalTest(jobId) {
  const ok = await askNotificationPermission();
  if (!ok) return Alert.alert("Tilladelse påkrævet", "Giv appen lov til notifikationer.");
  await ensureAndroidChannel();

  await Notifications.scheduleNotificationAsync({
    content: {
      title: "HarborHub",
      body: "Det her er en lokal testnotifikation 🚀",
      data: { screen: "RequestBids", jobId }, // <-- VIGTIGT
    },
    trigger: { seconds: 2 },
  });

  Alert.alert("Planlagt", "Notifikationen kommer om ~2 sek.");
}

/**
 * Lyt til tryk på notifikationer og navigér ud fra payload.
 * Håndterer både kørende app og “kold start”.
 */
export function attachNotificationTapListener() {
  const handler = (resp) => {
    const data = resp?.notification?.request?.content?.data || {};
    const screen = data?.screen;
    if (!screen) return;

    // Hvis RequestBids mangler jobId, så falder vi tilbage til oversigten
    if (screen === "RequestBids" && !data?.jobId) {
      navigate("Requests");
      return;
    }

    navigate(screen, data);
  };

  // Tap mens appen er åben/baggrund
  const sub = Notifications.addNotificationResponseReceivedListener(handler);

  // Tap fra “kold start”
  (async () => {
    const last = await Notifications.getLastNotificationResponseAsync();
    if (last) handler(last);
  })();

  return () => sub.remove();
}
