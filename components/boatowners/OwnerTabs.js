import React from "react";
import { SafeAreaView } from "react-native-safe-area-context";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import { Ionicons } from "@expo/vector-icons";

import RequestsScreen from "./RequestsScreen";
import OwnerAssignedScreen from "./OwnerAssignedScreen";
import NewRequestScreen from "./NewRequestScreen";
import ProfileHubScreen from "./ProfileHubScreen";

const Tab = createBottomTabNavigator();

const withSafeArea =
  (Comp) =>
  (props) =>
    (
      <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
        <Comp {...props} />
      </SafeAreaView>
    );

const RequestsSA = withSafeArea(RequestsScreen);
const OwnerAssignedSA = withSafeArea(OwnerAssignedScreen);
const NewRequestSA = withSafeArea(NewRequestScreen);
const ProfileHubSA = withSafeArea(ProfileHubScreen);

export default function OwnerTabs() {
  return (
    <Tab.Navigator
      initialRouteName="NewRequest"
      screenOptions={{
        headerShown: false,
        tabBarActiveTintColor: "#0B5FA5",
        tabBarInactiveTintColor: "#9aa0a6",
        tabBarLabelStyle: { fontSize: 11, marginTop: 2 },
        tabBarItemStyle: { paddingVertical: 4 },
        tabBarStyle: { height: 80, paddingBottom: 12, paddingTop: 6 },
        tabBarHideOnKeyboard: true,
      }}
    >
      {/* 1) Ny opgave */}
      <Tab.Screen
        name="NewRequest"
        component={NewRequestSA}
        options={{
          title: "Ny opgave",
          tabBarLabel: "Ny",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "add-circle" : "add-circle-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* 2) Requests */}
      <Tab.Screen
        name="Requests"
        component={RequestsSA}
        options={{
          title: "Requests",
          tabBarLabel: "Requests",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "clipboard" : "clipboard-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
      {/* 4) Igangværende */}
      <Tab.Screen
        name="OwnerAssigned"
        component={OwnerAssignedSA}
        options={{
          title: "Igangværende",
          tabBarLabel: "Igangv.",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "time" : "time-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />

      {/* 5) Profil (egen side) */}
      <Tab.Screen
        name="ProfileHub"
        component={ProfileHubSA}
        options={{
          title: "Min profil",
          tabBarLabel: "Profil",
          tabBarIcon: ({ focused, color, size }) => (
            <Ionicons
              name={focused ? "person-circle" : "person-circle-outline"}
              size={size}
              color={color}
            />
          ),
        }}
      />
    </Tab.Navigator>
  );
}