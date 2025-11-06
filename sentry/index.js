// /sentry/index.js
// Robust, lazy Sentry loader. If Sentry can't load, we fall back to no-ops
// so the app never crashes during startup.

function fakeSentry() {
  const noop = () => {};
  return {
    init: noop,
    captureException: console.error, // still log to console in dev
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
  // Delay the require so if the package has an issue, we can catch it.
  const mod = require("sentry-expo");
  // sentry-expo exports both CJS and ESM in various toolchains;
  // normalize to the actual object.
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
