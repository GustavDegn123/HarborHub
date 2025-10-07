// components/mechanics/ProviderTabs.js
import React from "react";
import { Text } from "react-native";
import { createBottomTabNavigator } from "@react-navigation/bottom-tabs";
import Ionicons from "@expo/vector-icons/Ionicons";
import { useSafeAreaInsets } from "react-native-safe-area-context";

// Skærme
import StartTakingJobs from "./StartTakingJobs";
import JobsFeedScreen from "./JobsFeedScreen";
import AssignedJobsScreen from "./AssignedJobsScreen";
import ProviderProfileScreen from "./ProviderProfileScreen";

const Tab = createBottomTabNavigator();

const COLORS = {
  bg: "#FFFFFF",
  border: "#E5E7EB",
  shadow: "rgba(0,0,0,0.12)",
  icon: "#111827",
  labelActive: "#0A84FF",
  labelInactive: "#9CA3AF",
};

export default function ProviderTabs() {
  const insets = useSafeAreaInsets();

  const makeLabel = (text) => ({ focused }) => (
    <Text
      style={{
        fontSize: 12,
        fontWeight: focused ? "700" : "600",
        color: focused ? COLORS.labelActive : COLORS.labelInactive,
        marginTop: 2,
      }}
      numberOfLines={1}
    >
      {text}
    </Text>
  );

  const renderIcon = (name) => ({ size }) => (
    <Ionicons name={name} size={size} color={COLORS.icon} />
  );

  return (
    <Tab.Navigator
      // ← GØR “Bliv udbyder” til første skærm
      initialRouteName="StartTakingJobs"
      sceneContainerStyle={{ paddingBottom: (insets.bottom || 0) + 65 }}
      // Ingen fast headerTitle — hver screen bruger sin egen "title"
      screenOptions={{
        headerTitleAlign: "center",
        tabBarHideOnKeyboard: true,
        tabBarStyle: {
          position: "absolute",
          left: 16,
          right: 16,
          bottom: (insets.bottom || 0) - 12,
          height: 70,
          paddingTop: 8,
          paddingBottom: 10,
          borderRadius: 20,
          backgroundColor: COLORS.bg,
          borderWidth: 1,
          borderColor: COLORS.border,
          shadowColor: COLORS.shadow,
          shadowOffset: { width: 0, height: 6 },
          shadowOpacity: 0.12,
          shadowRadius: 12,
          elevation: 8,
        },
        tabBarItemStyle: { paddingVertical: 4 },
        tabBarIconStyle: { marginTop: 2 },
        tabBarAllowFontScaling: false,
      }}
    >
      {/* Rækkefølge ændret: Bliv udbyder → Find job → Mine opgaver → Min profil */}
      <Tab.Screen
        name="StartTakingJobs"
        component={StartTakingJobs}
        options={{
          title: "Bliv udbyder",
          tabBarLabel: makeLabel("Bliv udbyder"),
          tabBarIcon: renderIcon("construct-outline"),
        }}
      />
      <Tab.Screen
        name="JobsFeed"
        component={JobsFeedScreen}
        options={{
          title: "Find job",
          tabBarLabel: makeLabel("Find job"),
          tabBarIcon: renderIcon("list-outline"),
        }}
      />
      <Tab.Screen
        name="AssignedJobs"
        component={AssignedJobsScreen}
        options={{
          title: "Mine opgaver",
          tabBarLabel: makeLabel("Mine opgaver"),
          tabBarIcon: renderIcon("briefcase-outline"),
        }}
      />
      <Tab.Screen
        name="ProviderProfile"
        component={ProviderProfileScreen}
        options={{
          title: "Min profil",
          tabBarLabel: makeLabel("Min profil"),
          tabBarIcon: renderIcon("person-outline"),
        }}
      />
    </Tab.Navigator>
  );
}
