// App.js
import React, { useEffect, useState } from "react";
import { NavigationContainer } from "@react-navigation/native";
import { createNativeStackNavigator } from "@react-navigation/native-stack";
import { onAuthStateChanged } from "firebase/auth";
import { ActivityIndicator, View } from "react-native";

import { auth } from "./firebase"; // vores firebase config
import LoginScreen from "./components/LoginScreen";
import SignUpScreen from "./components/SignUpScreen";
import HomeScreen from "./components/HomeScreen";

const Stack = createNativeStackNavigator();

export default function App() {
  const [user, setUser] = useState(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    // Lyt til login-status
    const unsubscribe = onAuthStateChanged(auth, (currentUser) => {
      setUser(currentUser);
      setLoading(false);
    });

    return unsubscribe; // rydder op i listener når komponent unmountes
  }, []);

  if (loading) {
    // Loader state mens vi tjekker login-status
    return (
      <View style={{ flex: 1, justifyContent: "center", alignItems: "center" }}>
        <ActivityIndicator size="large" color="#007bff" />
      </View>
    );
  }

  return (
    <NavigationContainer>
      <Stack.Navigator screenOptions={{ headerShown: false }}>
        {user ? (
          // Hvis bruger er logget ind → send til Home
          <Stack.Screen name="Home" component={HomeScreen} />
        ) : (
          // Ellers → Login/Signup flow
          <>
            <Stack.Screen name="Login" component={LoginScreen} />
            <Stack.Screen name="SignUp" component={SignUpScreen} />
          </>
        )}
      </Stack.Navigator>
    </NavigationContainer>
  );
}
