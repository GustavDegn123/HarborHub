// /services/authService.js
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Helper: Sørger for at subprofilen (owners/providers) findes.
 * Laves kun hvis den mangler.
 */
async function ensureSubProfile(uid, role) {
  if (role !== "owner" && role !== "provider") return;

  const col = role === "owner" ? "owners" : "providers";
  const ref = doc(db, col, uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return; // allerede oprettet

  if (role === "owner") {
    await setDoc(ref, {
      boats: [], // tom liste til at starte med
      preferred_harbor: null,
      created_at: serverTimestamp(),
    });
  } else {
    await setDoc(ref, {
      company_name: null,
      vat_number: null,
      service_area: null,
      services: [], // fx ["motorservice", "vinteropbevaring"]
      active: false,
      created_at: serverTimestamp(),
    });
  }
}

/**
 * Opret bruger med email/password
 * Gemmer i `users` og opretter subprofil i `owners` eller `providers`.
 */
export async function signUpUser(email, password, name, role, phone, location) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  const userData = {
    user_id: user.uid,
    name,
    email,
    phone: phone || null,
    role, // "owner" | "provider"
    location: location || null,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };

  // Gem i superklasse
  await setDoc(doc(db, "users", user.uid), userData);
  // Sørg for subprofil
  await ensureSubProfile(user.uid, role);

  return userData; // så din SignUpScreen kan bruge .email fx
}

/**
 * Login med Google (Expo AuthSession giver et id_token)
 */
export async function firebaseGoogleLogin(idToken) {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  const user = result.user;
  const uid = user.uid;

  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Default rolle til nye Google-logins
    const defaultRole = "provider";

    await setDoc(userRef, {
      user_id: uid,
      name: user.displayName || null,
      email: user.email || null,
      phone: user.phoneNumber || null,
      role: defaultRole,
      location: null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    await ensureSubProfile(uid, defaultRole);
  }

  return user; // så LoginScreen stadig kan sige user.email
}

/**
 * Hent brugerens rolle fra `users/{uid}`
 */
export async function getUserRole(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data().role : null;
}

/**
 * Opdater brugerens rolle (fx hvis du vil give mulighed for at skifte)
 */
export async function updateUserRole(uid, nextRole) {
  await setDoc(
    doc(db, "users", uid),
    { role: nextRole, updated_at: serverTimestamp() },
    { merge: true }
  );
  await ensureSubProfile(uid, nextRole);
}
