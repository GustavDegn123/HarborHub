// /services/authService.js
import { auth, db } from "../firebase";
import {
  createUserWithEmailAndPassword,
  signInWithCredential,
  GoogleAuthProvider,
  FacebookAuthProvider,
  signOut,
  sendPasswordResetEmail,   // 👈 tilføjet
} from "firebase/auth";
import {
  doc,
  setDoc,
  getDoc,
  serverTimestamp,
} from "firebase/firestore";

/**
 * Helper: Sørger for at subprofilen (owners/providers) findes.
 */
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
      active: false,
      created_at: serverTimestamp(),
    });
  }
}

/**
 * Opret bruger
 */
export async function signUpUser(email, password, name, role, phone, location) {
  const cred = await createUserWithEmailAndPassword(auth, email, password);
  const user = cred.user;

  const userData = {
    user_id: user.uid,
    name,
    email,
    phone: phone || null,
    role,
    location: location || null,
    created_at: serverTimestamp(),
    updated_at: serverTimestamp(),
  };

  await setDoc(doc(db, "users", user.uid), userData);
  await ensureSubProfile(user.uid, role);

  return userData;
}

/**
 * Login med Google
 */
export async function firebaseGoogleLogin(idToken) {
  const credential = GoogleAuthProvider.credential(idToken);
  const result = await signInWithCredential(auth, credential);
  const user = result.user;
  const uid = user.uid;

  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
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

  return user;
}

export async function firebaseFacebookLogin(accessToken) {
  const credential = FacebookAuthProvider.credential(accessToken);
  const result = await signInWithCredential(auth, credential);
  const user = result.user;
  const uid = user.uid;

  const userRef = doc(db, "users", uid);
  const userSnap = await getDoc(userRef);

  if (!userSnap.exists()) {
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

  return user;
}

/**
 * Hent/Opdater rolle
 */
export async function getUserRole(uid) {
  const snap = await getDoc(doc(db, "users", uid));
  return snap.exists() ? snap.data().role : null;
}

export async function updateUserRole(uid, nextRole) {
  await setDoc(
    doc(db, "users", uid),
    { role: nextRole, updated_at: serverTimestamp() },
    { merge: true }
  );
  await ensureSubProfile(uid, nextRole);
}

/**
 * Log ud
 */
export async function logout() {
  return await signOut(auth);
}

/**
 * Helpers
 */
export function getCurrentUser() {
  return auth.currentUser;
}

export async function getUserData(uid) {
  const ref = doc(db, "users", uid);
  const snap = await getDoc(ref);
  return snap.exists() ? { id: snap.id, ...snap.data() } : null;
}

export async function sendPasswordReset(email) {
  return await sendPasswordResetEmail(auth, email);
}
