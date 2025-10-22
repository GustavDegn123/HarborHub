// services/accountService.js
import { app, auth } from "../firebase";
import { deleteUser } from "firebase/auth";

/** Kald HTTP Cloud Function (EU) med ID token i Authorization header. */
export async function requestServerDeleteUserData() {
  const user = auth.currentUser;
  if (!user) throw new Error("Ikke logget ind.");

  const token = await user.getIdToken();
  const projectId = app.options.projectId;
  const url = `https://europe-west1-${projectId}.cloudfunctions.net/deleteUserData`;

  const res = await fetch(url, {
    method: "POST",
    headers: {
      "Content-Type": "application/json",
      Authorization: `Bearer ${token}`,
    },
    body: "{}",
  });

  // Vi forventer ALTID 200 + JSON fra serveren
  const text = await res.text();
  let payload = {};
  try { payload = text ? JSON.parse(text) : {}; } catch { payload = { ok: false, raw: text }; }

  // Hvis funktionen blev kaldt forkert og ikke returnerer 200, så kast en fejl
  if (!res.ok) {
    const msg = (payload && (payload.error || payload.message)) || text || `HTTP ${res.status}`;
    throw new Error(msg);
  }

  // Returnér payload (kan indeholde warnings/progress)
  return payload;
}

/** Slet Firebase Auth-brugeren (kræver recent login). */
export async function deleteAuthAccount() {
  const user = auth.currentUser;
  if (!user) throw new Error("Ikke logget ind.");
  try {
    await deleteUser(user);
    return true;
  } catch (e) {
    if (e?.code === "auth/requires-recent-login") {
      const err = new Error(
        "Af sikkerhedshensyn skal du logge ind igen for at slette kontoen."
      );
      err.code = e.code;
      throw err;
    }
    throw e;
  }
}
