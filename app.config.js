// app.config.js
// Load .env in local dev (EAS sets env on the build server)
require("dotenv").config();

/**
 * Note on env:
 * - Put PUBLIC values in .env (prefixed with EXPO_PUBLIC_) so they are available in the client bundle.
 * - Never put server-only secrets here (Stripe secret, OpenAI secret, etc.). Keep those in Cloud Functions / Secret Manager.
 */

module.exports = {
  // ---- App identity & basics ----
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

  // ---- iOS ----
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

  // ---- Android ----
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

  // ---- Notifications (app icon color etc.) ----
  notification: {
    icon: "./assets/logo.png",
    color: "#0B6EEF",
  },

  // ---- Web (if/when you use it) ----
  web: {
    favicon: "./assets/logo.png",
  },

  // ---- Plugins ----
  plugins: [
    "expo-notifications",
    [
      "@criipto/verify-expo",
      {
        androidAppLinks: [], // add if/when you configure Android App Links
      },
    ],
  ],

  // ---- Public runtime config (read via Constants.expoConfig?.extra) ----
  extra: {
    // Stripe (Publishable key only — safe to be public, but don’t hardcode in git)
    STRIPE_PUBLISHABLE_KEY: process.env.EXPO_PUBLIC_STRIPE_PUBLISHABLE_KEY,

    // Criipto (MitID)
    CRIIPTO_DOMAIN: process.env.EXPO_PUBLIC_CRIIPTO_DOMAIN,
    CRIIPTO_CLIENT_ID: process.env.EXPO_PUBLIC_CRIIPTO_CLIENT_ID,

    // Firebase (web client config — not secret, still don’t hardcode in git)
    FIREBASE_API_KEY: process.env.EXPO_PUBLIC_FIREBASE_API_KEY,
    FIREBASE_AUTH_DOMAIN: process.env.EXPO_PUBLIC_FIREBASE_AUTH_DOMAIN,
    FIREBASE_PROJECT_ID: process.env.EXPO_PUBLIC_FIREBASE_PROJECT_ID,
    FIREBASE_STORAGE_BUCKET: process.env.EXPO_PUBLIC_FIREBASE_STORAGE_BUCKET,
    FIREBASE_MESSAGING_SENDER_ID:
      process.env.EXPO_PUBLIC_FIREBASE_MESSAGING_SENDER_ID,
    FIREBASE_APP_ID: process.env.EXPO_PUBLIC_FIREBASE_APP_ID,
    FIREBASE_MEASUREMENT_ID: process.env.EXPO_PUBLIC_FIREBASE_MEASUREMENT_ID,

    // Google OAuth client IDs (optional)
    GOOGLE_EXPO_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_EXPO_CLIENT_ID,
    GOOGLE_IOS_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_IOS_CLIENT_ID,
    GOOGLE_ANDROID_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_ANDROID_CLIENT_ID,
    GOOGLE_WEB_CLIENT_ID: process.env.EXPO_PUBLIC_GOOGLE_WEB_CLIENT_ID,

    // Facebook (public app id for expo-auth-session)
    FACEBOOK_APP_ID:
      process.env.EXPO_PUBLIC_FACEBOOK_APP_ID || "1214898343801009",

    // EAS Project
    eas: {
      projectId: "02ce5b94-a91d-415e-9f67-20d7006f114c",
    },
  },
};
