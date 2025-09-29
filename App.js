// App.js
import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { getUserRole } from "./services/authService";

/* Stripe (TEST MODE) */
import { StripeProvider } from "@stripe/stripe-react-native";
// Holder appen i test mode. Skift til true når du engang går live.
const USE_LIVE = false;
const PUBLISHABLE_KEY_TEST =
  "pk_test_51QHuaaB0CErNDJE4ynjiWbGaWXNnvYXNxJ5OMynlLn6VYtcKXQQSmw63VFPQLgn9lwFDtiHlt6X7U9h4fZZ4RAHT00cLmY19DV";
const PUBLISHABLE_KEY_LIVE = "pk_live_xxx_replace_me_later"; // placeholder
const STRIPE_PUBLISHABLE_KEY = USE_LIVE ? PUBLISHABLE_KEY_LIVE : PUBLISHABLE_KEY_TEST;

/* Boat owner screens */
import OwnerHomeScreen from "./components/boatowners/OwnerHomeScreen";
import BoatFormScreen from "./components/boatowners/BoatFormScreen";
import RequestsScreen from "./components/boatowners/RequestsScreen";
import NewRequestScreen from "./components/boatowners/NewRequestScreen";
import RequestsWithBidsScreen from "./components/boatowners/RequestsWithBidsScreen";
import RequestBidsScreen from "./components/boatowners/RequestBidsScreen";
import BoatProfileScreen from "./components/boatowners/BoatProfileScreen";
import OwnerAssignedScreen from "./components/boatowners/OwnerAssignedScreen"; // 👈 NY
import LeaveReviewScreen from "./components/boatowners/LeaveReviewScreen"; // 👈 NY (anmeldelser)
/* Betaling */
import OwnerCheckoutScreen from "./components/payments/OwnerCheckoutScreen"; // 👈 NY

/* Provider (mechanic) screens */
import ProviderHomeScreen from "./components/mechanics/ProviderHomeScreen";
import AssignedJobsScreen from "./components/mechanics/AssignedJobsScreen";
import StartTakingJobs from "./components/mechanics/StartTakingJobs";
import ChooseWorkScreen from "./components/mechanics/ChooseWorkScreen";
import JobsFeedScreen from "./components/mechanics/JobsFeedScreen";
import JobDetailScreen from "./components/mechanics/JobDetailScreen";
import ProviderProfileScreen from "./components/mechanics/ProviderProfileScreen";
import ProviderCalendarScreen from "./components/mechanics/ProviderCalendarScreen";

/* Shared */
import MapPickerScreen from "./components/shared/MapPickerScreen";
import LoginScreen from "./components/shared/LoginScreen";
import SignUpScreen from "./components/shared/SignUpScreen";
import PasswordResetScreen from "./components/shared/PasswordResetScreen";
import ChatScreen from "./components/shared/ChatScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null); // { ...firebaseUser, role }

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      try {
        if (firebaseUser) {
          const role = await getUserRole(firebaseUser.uid);
          setUser({ ...firebaseUser, role: role || null });
        } else {
          setUser(null);
        }
      } catch (err) {
        console.error("Fejl ved hentning af rolle:", err);
        setUser(firebaseUser ? { ...firebaseUser, role: null } : null);
      } finally {
        setInitializing(false);
      }
    });
    return unsubscribe;
  }, []);

  if (initializing) {
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <StripeProvider
      publishableKey={STRIPE_PUBLISHABLE_KEY}
      merchantIdentifier="merchant.com.harborhub.test" // påkrævet for Apple Pay (kan være vilkårlig i test)
    >
      <NavigationContainer>
        <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
          {user ? (
            user.role === "owner" ? (
              /* -------- OWNER STACK -------- */
              <>
                <Stack.Screen
                  name="OwnerHome"
                  component={OwnerHomeScreen}
                  options={{ title: "HarborHub" }}
                />
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
                  name="RequestsWithBids"
                  component={RequestsWithBidsScreen}
                  options={{ title: "Bud på mine opgaver" }}
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
                {/* Mine igangværende opgaver */}
                <Stack.Screen
                  name="OwnerAssigned"
                  component={OwnerAssignedScreen}
                  options={{ title: "Mine igangværende opgaver" }}
                />
                {/* Betaling (TEST) */}
                <Stack.Screen
                  name="OwnerCheckout"
                  component={OwnerCheckoutScreen}
                  options={{ title: "Betaling (TEST)" }}
                />
                {/* Giv anmeldelse */}
                <Stack.Screen
                  name="LeaveReview"
                  component={LeaveReviewScreen}
                  options={{ title: "Giv anmeldelse" }}
                />
                {/* Chat */}
                <Stack.Screen
                  name="Chat"
                  component={ChatScreen}
                  options={{ title: "Chat" }}
                />
              </>
            ) : (
              /* -------- PROVIDER STACK -------- */
              <>
                <Stack.Screen
                  name="ProviderHome"
                  component={ProviderHomeScreen}
                  options={{ title: "HarborHub" }}
                />
                <Stack.Screen
                  name="AssignedJobs"
                  component={AssignedJobsScreen}
                  options={{ title: "Mine opgaver" }}
                />
                <Stack.Screen
                  name="StartTakingJobs"
                  component={StartTakingJobs}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="ChooseWork"
                  component={ChooseWorkScreen}
                  options={{ headerShown: false }}
                />
                <Stack.Screen
                  name="JobsFeed"
                  component={JobsFeedScreen}
                  options={{ title: "Tilgængelige opgaver" }}
                />
                <Stack.Screen
                  name="JobDetail"
                  component={JobDetailScreen}
                  options={{ title: "Jobdetaljer" }}
                />
                <Stack.Screen
                  name="MapPicker"
                  component={MapPickerScreen}
                  options={{ title: "Vælg placering" }}
                />
                <Stack.Screen
                  name="ProviderProfile"
                  component={ProviderProfileScreen}
                  options={{ title: "Min profil" }}
                />
                <Stack.Screen
                  name="ProviderCalendar"
                  component={ProviderCalendarScreen}
                  options={{ title: "Kalender" }}
                />
                {/* Chat */}
                <Stack.Screen
                  name="Chat"
                  component={ChatScreen}
                  options={{ title: "Chat" }}
                />
              </>
            )
          ) : (
            /* -------- AUTH STACK -------- */
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
  );
}