import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  TouchableOpacity,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { useRoute, useNavigation } from "@react-navigation/native";
import { auth } from "../../firebase";
import { listenMessages, sendMessage, startChat } from "../../services/chatService";
import styles from "../../styles/shared/chatScreenStyles";

/* ===== Helpers ===== */
function toDateMaybe(v) {
  if (!v) return null;
  if (typeof v?.toDate === "function") {
    const d = v.toDate();
    return isNaN(d) ? null : d;
  }
  if (typeof v === "object" && typeof v.seconds === "number") {
    const ms = v.seconds * 1000 + Math.floor((v.nanoseconds || 0) / 1e6);
    const d = new Date(ms);
    return isNaN(d) ? null : d;
  }
  if (typeof v === "number") {
    const ms = v < 1e12 ? v * 1000 : v;
    const d = new Date(ms);
    return isNaN(d) ? null : d;
  }
  if (typeof v === "string") {
    const d = new Date(v);
    return isNaN(d) ? null : d;
  }
  if (v instanceof Date) return isNaN(v) ? null : v;
  return null;
}

function timeLabel(ts) {
  const d = toDateMaybe(ts);
  if (!d) return "";
  return new Intl.DateTimeFormat("da-DK", { hour: "2-digit", minute: "2-digit" }).format(d);
}

/* ===== Component ===== */
export default function ChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const me = auth.currentUser;
  const myId = me?.uid || null;

  const { chatId: chatIdFromRoute, jobId, ownerId, providerId, otherName } = route.params || {};

  const [chatId, setChatId] = useState(chatIdFromRoute || null);
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(true);
  const [text, setText] = useState("");
  const flatRef = useRef(null);

  useEffect(() => {
    if (otherName) navigation.setOptions({ title: otherName });
  }, [otherName, navigation]);

  useEffect(() => {
    let unsub = null;
    let cancelled = false;

    async function ensureChatAndListen() {
      try {
        setPending(true);
        let id = chatIdFromRoute;

        if (!id) {
          if (!jobId || !ownerId || !providerId) {
            throw new Error("Mangler chatId eller (jobId, ownerId, providerId).");
          }
          id = await startChat(jobId, ownerId, providerId);
        }

        if (cancelled) return;
        setChatId(id);

        unsub = listenMessages(id, (rows) => {
          setMessages(rows);
          setPending(false);
          setTimeout(() => {
            try {
              flatRef.current?.scrollToEnd?.({ animated: true });
            } catch {}
          }, 50);
        });
      } catch (e) {
        console.log("Chat init fejl:", e);
        setPending(false);
      }
    }

    ensureChatAndListen();
    return () => {
      cancelled = true;
      if (typeof unsub === "function") unsub();
    };
  }, [chatIdFromRoute, jobId, ownerId, providerId]);

  async function onSend() {
    if (!chatId || !myId) return;
    const trimmed = text.trim();
    if (!trimmed) return;
    try {
      setText("");
      await sendMessage(chatId, myId, trimmed);
    } catch (e) {
      console.log("Send fejl:", e);
    }
  }

  const renderItem = ({ item }) => {
    const mine = item.senderId === myId;
    return (
      <View style={[styles.msgRow, mine ? styles.msgRowMine : styles.msgRowTheirs]}>
        <View
          style={[
            styles.bubble,
            mine ? styles.bubbleMine : styles.bubbleTheirs,
            mine ? styles.bubbleCornerMine : styles.bubbleCornerTheirs,
          ]}
        >
          <Text style={[styles.bubbleText, mine && styles.bubbleTextMine]}>{item.text}</Text>
          <Text style={[styles.time, mine && styles.timeMine]}>{timeLabel(item.createdAt)}</Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={styles.safe}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        {/* Messages */}
        <View style={styles.flex1}>
          {pending ? (
            <View style={styles.center}>
              <ActivityIndicator />
              <Text style={styles.centerText}>Henter beskeder…</Text>
            </View>
          ) : (
            <FlatList
              ref={flatRef}
              data={messages}
              keyExtractor={(it) => it.id}
              renderItem={renderItem}
              contentContainerStyle={styles.listContent}
              onContentSizeChange={() => flatRef.current?.scrollToEnd?.({ animated: true })}
            />
          )}
        </View>

        {/* Composer */}
        <View style={styles.composer}>
          <TextInput
            style={styles.input}
            placeholder="Skriv en besked…"
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity
            onPress={onSend}
            disabled={!text.trim()}
            style={[styles.sendBtn, !text.trim() && styles.sendBtnDisabled]}
          >
            <Text style={styles.sendBtnText}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
