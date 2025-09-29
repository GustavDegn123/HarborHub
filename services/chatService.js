// /services/chatService.js
import { db } from "../firebase";
import {
  collection,
  doc,
  addDoc,
  setDoc,
  getDoc,
  onSnapshot,
  query,
  orderBy,
  serverTimestamp,
  where,
} from "firebase/firestore";

/** Start chat (eller hent eksisterende) for en opgave */
export async function startChat(jobId, ownerId, providerId) {
  const chatId = `${jobId}_${ownerId}_${providerId}`;
  const ref = doc(db, "chats", chatId);

  const snap = await getDoc(ref);
  if (!snap.exists()) {
    await setDoc(ref, {
      jobId,
      participants: [ownerId, providerId],
      createdAt: serverTimestamp(),
      lastMessage: "",
      lastMessageAt: serverTimestamp(),
    });
  }
  return chatId;
}

/** Send en besked */
export async function sendMessage(chatId, senderId, text) {
  if (!chatId || !senderId || !text) return;
  const msgRef = collection(db, "chats", chatId, "messages");
  await addDoc(msgRef, {
    senderId,
    text,
    createdAt: serverTimestamp(),
  });

  // Opdater metadata på chat
  const chatRef = doc(db, "chats", chatId);
  await setDoc(
    chatRef,
    { lastMessage: text, lastMessageAt: serverTimestamp() },
    { merge: true }
  );
}

/** Lyt live til beskeder i en chat */
export function listenMessages(chatId, callback) {
  if (!chatId) return () => {};
  const q = query(
    collection(db, "chats", chatId, "messages"),
    orderBy("createdAt", "asc")
  );
  return onSnapshot(q, (snap) =>
    callback(snap.docs.map((d) => ({ id: d.id, ...d.data() })))
  );
}

/** Lyt live til alle chats hvor en bruger deltager */
export function listenUserChats(userId, callback) {
  if (!userId) return () => {};
  const qRef = query(
    collection(db, "chats"),
    where("participants", "array-contains", userId),
    orderBy("lastMessageAt", "desc")
  );
  return onSnapshot(qRef, (snap) => {
    const rows = snap.docs.map((d) => ({ id: d.id, ...d.data() }));
    callback(rows);
  });
}