// app.config.js
require("dotenv").config();

module.exports = {
  name: "HarborHub",
  slug: "harborhub",
  scheme: "harborhub",
  owner: "gustavdegn",
  version: "1.0.0",
  orientation: "portrait",
  userInterfaceStyle: "light",
  icon: "./assets/logo.png",
  splash: {
    image: "./assets/logo.png",
    resizeMode: "contain",
    backgroundColor: "#ffffff",
  },
  assetBundlePatterns: ["**/*"],

  ios: {
    bundleIdentifier: "com.gustavdegn.harborhub",
    buildNumber: "1.0.0",
    supportsTablet: true,
    infoPlist: {
      NSLocationWhenInUseUsageDescription:
        "HarborHub bruger din placering til at sætte opgavens position.",
      UIBackgroundModes: ["remote-notification", "remote-notification"],
      ITSAppUsesNonExemptEncryption: false,
    },
  },

  android: {
    package: "com.gustavdegn.harborhub",
    versionCode: 1,
    permissions: [
      "ACCESS_COARSE_LOCATION",
      "ACCESS_FINE_LOCATION",
      "POST_NOTIFICATIONS",
    ],
    adaptiveIcon: {
      foregroundImage: "./assets/logo.png",
      backgroundColor: "#FFFFFF",
    },
  },

  notification: {
    icon: "./assets/logo.png",
    color: "#0B6EEF",
  },

  web: {
    favicon: "./assets/logo.png",
  },

  plugins: [
    "expo-notifications",
    [
      "@criipto/verify-expo",
      {
        androidAppLinks: [], 
      },
    ],
    [
      "sentry-expo",
      {
        organization: process.env.SENTRY_ORG,
        project: process.env.SENTRY_PROJECT || "harborhub",
      },
    ],
  ],

  extra: {
    EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY:
      process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,

    EXPO_PUBLIC_CRIIPTO_DOMAIN: process.env.EXPO_PUBLIC_CRIIPTO_DOMAIN,
    EXPO_PUBLIC_CRIIPTO_CLIENT_ID: process.env.EXPO_PUBLIC_CRIIPTO_CLIENT_ID,

    EXPO_PUBLIC_FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN:
      process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    EXPO_PUBLIC_FIREBASE_PROJECT_ID:
      process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET:
      process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID:
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    EXPO_PUBLIC_FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID:
      process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,

    EXPO_PUBLIC_SENTRY_DSN: process.env.EXPO_PUBLIC_SENTRY_DSN,
    EXPO_PUBLIC_SENTRY_ENV:
      process.env.EXPO_PUBLIC_SENTRY_ENV || (process.env.NODE_ENV === "production" ? "production" : "development"),

    eas: {
      projectId: "02ce5b94-a91d-415e-9f67-20d7006f114c",
    },
  },
};
