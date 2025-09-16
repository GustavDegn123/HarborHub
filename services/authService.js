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

/** Helper: opret subprofil i owners/providers hvis den ikke findes */
async function ensureSubProfile(uid, role) {
  if (role !== "owner" && role !== "provider") return;

  const col = role === "owner" ? "owners" : "providers";
  const ref = doc(db, col, uid);
  const snap = await getDoc(ref);
  if (snap.exists()) return;

  if (role === "owner") {
    await setDoc(ref, {
      boats: [],
      preferred_harbor: null,
      created_at: serverTimestamp(),
    });
  } else {
    await setDoc(ref, {
      company_name: null,
      vat_number: null,
      service_area: null,
      services: [],
      created_at: serverTimestamp(),
    });
  }
}

/** Opret bruger med email/password + base user doc + subprofil */
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

  // Base user
  await setDoc(doc(db, "users", user.uid), userData);
  // Subprofil
  await ensureSubProfile(user.uid, role);

  // Returner data der matcher din SignUpScreen (den bruger .email i alert)
  return userData;
}

/** Login med Google id_token (fra Expo AuthSession) */
export async function firebaseGoogleLogin(idToken) {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential); // auth-user

  const uid = result.user.uid;
  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
    // Førstegangs Google-login: vælg en fornuftig default rolle.
    // Du kan ændre denne default til "owner" hvis du foretrækker det.
    const defaultRole = "provider";

    await setDoc(userRef, {
      user_id: uid,
      name: result.user.displayName || null,
      email: result.user.email || null,
      phone: result.user.phoneNumber || null,
      role: defaultRole,
      location: null,
      created_at: serverTimestamp(),
      updated_at: serverTimestamp(),
    });

    await ensureSubProfile(uid, defaultRole);
  }

  // behold return-format så din LoginScreen stadig kan sige user.email
  return result.user;
}

/** Hent rolle til navigation */
export async function getUserRole(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data().role : null;
}

/** Skift rolle senere (valgfrit) */
export async function updateUserRole(uid, nextRole) {
  await setDoc(
    doc(db, "users", uid),
    { role: nextRole, updated_at: serverTimestamp() },
    { merge: true }
  );
  await ensureSubProfile(uid, nextRole);
}
