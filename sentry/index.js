// /sentry/index.js
// Robust, lazy Sentry loader.
function fakeSentry() {
  const noop = () => {};
  return {
    init: noop,
    captureException: console.error,
    captureMessage: console.log,
    setTag: noop,
    Native: {
      captureException: console.error,
      captureMessage: console.log,
      setTag: noop,
    },
  };
}

let Sentry = fakeSentry();

try {
  const mod = require("sentry-expo");
  const S = mod?.default ?? mod;

  const dsn = process.env.EXPO_PUBLIC_SENTRY_DSN;
  if (!dsn) {
    console.warn("[Sentry] No DSN found (EXPO_PUBLIC_SENTRY_DSN). Sentry disabled.");
  } else {
    S.init({
      dsn,
      enableInExpoDevelopment: true,
      debug: __DEV__,
      tracesSampleRate: 0.1,
    });
    (S.Native?.setTag ?? S.setTag)?.("app.env", __DEV__ ? "dev" : "prod");
    Sentry = S;
  }
} catch (e) {
  console.warn("[Sentry] Disabled (load error):", e?.message);
}

export { Sentry };
