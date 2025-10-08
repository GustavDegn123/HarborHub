// App.js
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import * as Linking from "expo-linking";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import * as Notifications from "expo-notifications";
import Constants from "expo-constants";

/* Firebase */
import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { getUserRole } from "./services/authService";

/* Stripe (TEST) */
import { StripeProvider } from "@stripe/stripe-react-native";

/* Criipto */
import { CriiptoVerifyProvider } from "@criipto/verify-expo";

/* Owner screens */
import BoatFormScreen from "./components/boatowners/BoatFormScreen";
import RequestsScreen from "./components/boatowners/RequestsScreen";
import NewRequestScreen from "./components/boatowners/NewRequestScreen";
import RequestBidsScreen from "./components/boatowners/RequestBidsScreen";
import BoatProfileScreen from "./components/boatowners/BoatProfileScreen";
import OwnerAssignedScreen from "./components/boatowners/OwnerAssignedScreen";
import LeaveReviewScreen from "./components/boatowners/LeaveReviewScreen";
import OwnerHistoryScreen from "./components/boatowners/OwnerHistoryScreen";
import OwnerTabs from "./components/boatowners/OwnerTabs";
import ChatBotScreen from "./components/boatowners/ChatBotScreen";

/* Payments */
import OwnerCheckoutScreen from "./components/payments/OwnerCheckoutScreen";

/* Provider (mechanic) screens */
import AssignedJobsScreen from "./components/mechanics/AssignedJobsScreen";
import StartTakingJobs from "./components/mechanics/StartTakingJobs";
import ChooseWorkScreen from "./components/mechanics/ChooseWorkScreen";
import JobsFeedScreen from "./components/mechanics/JobsFeedScreen";
import JobDetailScreen from "./components/mechanics/JobDetailScreen";
import ProviderProfileScreen from "./components/mechanics/ProviderProfileScreen";
import ProviderCalendarScreen from "./components/mechanics/ProviderCalendarScreen";
import ProviderTabs from "./components/mechanics/ProviderTabs";

/* Shared */
import MapPickerScreen from "./components/shared/MapPickerScreen";
import LoginScreen from "./components/shared/LoginScreen";
import SignUpScreen from "./components/shared/SignUpScreen";
import PasswordResetScreen from "./components/shared/PasswordResetScreen";
import ChatScreen from "./components/shared/ChatScreen";
import VerifyEmailScreen from "./components/shared/VerifyEmailScreen";

/* Notifications utils + navigation ref */
import {
  ensureAndroidChannel,
  askNotificationPermission,
  attachNotificationTapListener,
} from "./utils/notifications";
import { navigationRef } from "./navigation/navRef";

/* ---- env/extra ---- */
const extra = Constants.expoConfig?.extra ?? {};
const STRIPE_PUBLISHABLE_KEY = extra.STRIPE_PUBLISHABLE_KEY;
const CRIIPTO_DOMAIN = extra.CRIIPTO_DOMAIN;
const CRIIPTO_CLIENT_ID = extra.CRIIPTO_CLIENT_ID;

const Stack = createNativeStackNavigator();

const linking = {
  prefixes: [Linking.createURL("/"), "harborhub://"],
};

export default function App() {
  const [initializing, setInitializing] = useState(true);
  // shape: null | { ...firebaseUser, role?: 'owner'|'provider'|null, needsVerification?: boolean }
  const [user, setUser] = useState(null);

  // Auth state + email verification + rolle
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (!firebaseUser) {
          setUser(null);
          return;
        }

        // Sørg for friske claims
        await firebaseUser.reload();

        const providerId = firebaseUser.providerData?.[0]?.providerId || "password";
        const needsVerification =
          providerId === "password" && firebaseUser.emailVerified !== true;

        if (needsVerification) {
          // Vis VerifyEmail-screen; hent ikke rolle endnu (regler kan blokere).
          setUser({ ...firebaseUser, role: null, needsVerification: true });
        } else {
          // Verified (eller social login) -> hent rolle
          const role = await getUserRole(firebaseUser.uid);
          setUser({ ...firebaseUser, role: role || null, needsVerification: false });
        }
      } catch (err) {
        console.error("Auth bootstrap fejl:", err);
        setUser(firebaseUser ? { ...firebaseUser, role: null } : null);
      } finally {
        setInitializing(false);
      }
    });
    return unsubscribe;
  }, []);

  // Notifikationer: kanal, permissions, tap-listener
  useEffect(() => {
    ensureAndroidChannel();
    askNotificationPermission();

    const removeTap = attachNotificationTapListener();
    const subReceived = Notifications.addNotificationReceivedListener(() => {});
    const subResponse = Notifications.addNotificationResponseReceivedListener(() => {});
    return () => {
      removeTap?.();
      subReceived.remove();
      subResponse.remove();
    };
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <CriiptoVerifyProvider domain={CRIIPTO_DOMAIN} clientID={CRIIPTO_CLIENT_ID}>
      <StripeProvider
        publishableKey={STRIPE_PUBLISHABLE_KEY}
        merchantIdentifier="merchant.com.harborhub.test"
      >
        <NavigationContainer linking={linking} ref={navigationRef}>
          <Stack.Navigator
            screenOptions={{
              headerShadowVisible: false,
              headerBackTitleVisible: false,
            }}
          >
            {user ? (
              user.needsVerification ? (
                // Password-bruger uden verified e-mail
                <Stack.Screen
                  name="VerifyEmail"
                  component={VerifyEmailScreen}
                  options={{ title: "Bekræft e-mail" }}
                />
              ) : user.role === "owner" ? (
                <>
                  {/* OWNER ROOT (tabs) */}
                  <Stack.Screen
                    name="OwnerRoot"
                    component={OwnerTabs}
                    options={{ headerShown: false }}
                  />
                  {/* Owner stack-sider */}
                  <Stack.Screen
                    name="BoatForm"
                    component={BoatFormScreen}
                    options={{ title: "Tilføj båd" }}
                  />
                  <Stack.Screen
                    name="MapPicker"
                    component={MapPickerScreen}
                    options={{ title: "Vælg placering" }}
                  />
                  <Stack.Screen
                    name="Requests"
                    component={RequestsScreen}
                    options={{ title: "Mine service requests" }}
                  />
                  <Stack.Screen
                    name="NewRequest"
                    component={NewRequestScreen}
                    options={{ title: "Opret ny opgave" }}
                  />
                  <Stack.Screen
                    name="ChatBot"
                    component={ChatBotScreen}
                    options={{ title: "Chatbot" }}
                  />
                  <Stack.Screen
                    name="RequestBids"
                    component={RequestBidsScreen}
                    options={{ title: "Bud på opgaven" }}
                  />
                  <Stack.Screen
                    name="BoatProfile"
                    component={BoatProfileScreen}
                    options={{ title: "Min profil" }}
                  />
                  <Stack.Screen
                    name="OwnerAssigned"
                    component={OwnerAssignedScreen}
                    options={{ title: "Mine igangværende opgaver" }}
                  />
                  <Stack.Screen
                    name="OwnerHistory"
                    component={OwnerHistoryScreen}
                    options={{ title: "Afsluttede opgaver" }}
                  />
                  <Stack.Screen
                    name="JobDetail"
                    component={JobDetailScreen}
                    options={{ title: "Jobdetaljer" }}
                  />
                  <Stack.Screen
                    name="OwnerCheckout"
                    component={OwnerCheckoutScreen}
                    options={{ title: "Betaling (TEST)" }}
                  />
                  <Stack.Screen
                    name="LeaveReview"
                    component={LeaveReviewScreen}
                    options={{ title: "Giv anmeldelse" }}
                  />
                  <Stack.Screen
                    name="Chat"
                    component={ChatScreen}
                    options={{ title: "Chat" }}
                  />
                </>
              ) : (
                <>
                  {/* PROVIDER ROOT (tabs) */}
                  <Stack.Screen
                    name="ProviderRoot"
                    component={ProviderTabs}
                    options={{ headerShown: false }}
                  />
                  {/* Provider stack-sider */}
                  <Stack.Screen
                    name="JobDetail"
                    component={JobDetailScreen}
                    options={{ title: "Jobdetaljer" }}
                  />
                  <Stack.Screen
                    name="ProviderCalendar"
                    component={ProviderCalendarScreen}
                    options={{ title: "Kalender" }}
                  />
                  <Stack.Screen
                    name="MapPicker"
                    component={MapPickerScreen}
                    options={{ title: "Vælg placering" }}
                  />
                  <Stack.Screen
                    name="ChooseWork"
                    component={ChooseWorkScreen}
                    options={{ headerShown: false }}
                  />
                  <Stack.Screen
                    name="Chat"
                    component={ChatScreen}
                    options={{ title: "Chat" }}
                  />
                </>
              )
            ) : (
              <>
                <Stack.Screen
                  name="LoginScreen"
                  component={LoginScreen}
                  options={{ title: "Log ind" }}
                />
                <Stack.Screen
                  name="SignUp"
                  component={SignUpScreen}
                  options={{ title: "Opret konto" }}
                />
                <Stack.Screen
                  name="PasswordReset"
                  component={PasswordResetScreen}
                  options={{ title: "Nulstil kodeord" }}
                />
              </>
            )}
          </Stack.Navigator>
        </NavigationContainer>
      </StripeProvider>
    </CriiptoVerifyProvider>
  );
}
