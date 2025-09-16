import React, { useEffect, useState } from "react";
import { ActivityIndicator, View } from "react-native";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";

import HomeScreen from "./components/HomeScreen";
import LoginScreen from "./components/LoginScreen";
import SignUpScreen from "./components/SignUpScreen";
import StartTakingJobs from "./components/StartTakingJobs";
import ChooseWorkScreen from "./components/ChooseWorkScreen";
import JobsFeedScreen from "./components/JobsFeedScreen";

// MapPicker via require for at undgå import-cache issues
const MapPickerScreen = require("./components/MapPickerScreen").default;

import { onAuthStateChanged } from "firebase/auth";
import { auth } from "./firebase";

const Stack = createNativeStackNavigator();

export default function App() {
  const [initializing, setInitializing] = useState(true);
  const [user, setUser] = useState(null);

  // Lyt til Firebase auth state
  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, (firebaseUser) => {
      setUser(firebaseUser ?? null);
      setInitializing(false);
    });
    return unsubscribe;
  }, []);

  // Loader mens vi venter på Firebase
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
        ) : (
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
