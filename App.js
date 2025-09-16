import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "./components/HomeScreen"; // Provider home
import OwnerHomeScreen from "./components/OwnerHomeScreen"; // Owner home
import LoginScreen from "./components/LoginScreen";
import SignUpScreen from "./components/SignUpScreen";
import StartTakingJobs from "./components/StartTakingJobs";
import ChooseWorkScreen from "./components/ChooseWorkScreen";
import JobsFeedScreen from "./components/JobsFeedScreen";

const MapPickerScreen = require("./components/MapPickerScreen").default;

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";
import { getUserRole } from "./services/authService";

const Stack = createNativeStackNavigator();

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (firebaseUser) => {
      if (firebaseUser) {
        try {
          const role = await getUserRole(firebaseUser.uid);
          setUser({ ...firebaseUser, role });
        } catch (err) {
          console.error("Fejl ved hentning af rolle:", err);
          setUser({ ...firebaseUser, role: null });
        }
      } else {
        setUser(null);
      }
      setInitializing(false);
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
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShadowVisible: false }}>
        {user ? (
          user.role === "owner" ? (
            // --- OWNER STACK ---
            <>
              <Stack.Screen
                name="OwnerHome"
                component={OwnerHomeScreen}
                options={{ title: "Mine både" }}
              />
              <Stack.Screen
                name="MapPicker"
                component={MapPickerScreen}
                options={{ title: "Vælg placering" }}
              />
            </>
          ) : (
            // --- PROVIDER STACK ---
            <>
              <Stack.Screen
                name="Home"
                component={HomeScreen}
                options={{ title: "HarborHub" }}
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
                name="MapPicker"
                component={MapPickerScreen}
                options={{ title: "Vælg placering" }}
              />
            </>
          )
        ) : (
          // --- AUTH STACK ---
          <>
            <Stack.Screen
              name="Login"
              component={LoginScreen}
              options={{ title: "Log ind" }}
            />
            <Stack.Screen
              name="SignUp"
              component={SignUpScreen}
              options={{ title: "Opret konto" }}
            />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
