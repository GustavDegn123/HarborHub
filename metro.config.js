// metro.config.js (Expo/React Native)
const { getDefaultConfig } = require('expo/metro-config');

const config = getDefaultConfig(__dirname);

// Tell Metro to ignore the Firebase Cloud Functions folder so RN doesn't try to bundle it
// (works without importing exclusionList/blacklist helpers)
config.resolver.blockList = new RegExp(
  [
    'functions\\/.*',              // ignore everything under functions/
    'functions\\/node_modules\\/.*'
  ].join('|')
);

module.exports = config;