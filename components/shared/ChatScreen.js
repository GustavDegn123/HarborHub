// /components/shared/ChatScreen.js
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
import {
  listenMessages,
  sendMessage,
  startChat,
} from "../../services/chatService";

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
  return new Intl.DateTimeFormat("da-DK", {
    hour: "2-digit",
    minute: "2-digit",
  }).format(d);
}

/* ===== Component ===== */
export default function ChatScreen() {
  const route = useRoute();
  const navigation = useNavigation();
  const me = auth.currentUser;
  const myId = me?.uid || null;

  // Forventede param-muligheder:
  // - { chatId }
  // - ELLER: { jobId, ownerId, providerId, otherName? }
  const { chatId: chatIdFromRoute, jobId, ownerId, providerId, otherName } =
    route.params || {};

  const [chatId, setChatId] = useState(chatIdFromRoute || null);
  const [messages, setMessages] = useState([]);
  const [pending, setPending] = useState(true);
  const [text, setText] = useState("");
  const flatRef = useRef(null);

  // Sæt header-title hvis vi har navn
  useEffect(() => {
    if (otherName) {
      navigation.setOptions({ title: otherName });
    }
  }, [otherName, navigation]);

  // Initier chat og start live-lytning
  useEffect(() => {
    let unsub = null;
    let cancelled = false;

    async function ensureChatAndListen() {
      try {
        setPending(true);
        let id = chatIdFromRoute;

        if (!id) {
          if (!jobId || !ownerId || !providerId) {
            throw new Error(
              "Mangler chatId eller (jobId, ownerId, providerId)."
            );
          }
          id = await startChat(jobId, ownerId, providerId);
        }

        if (cancelled) return;
        setChatId(id);

        // Start live-lyt
        unsub = listenMessages(id, (rows) => {
          setMessages(rows);
          setPending(false);
          // Autoscroll når nye beskeder kommer
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
      // listenMessages opdaterer UI
    } catch (e) {
      console.log("Send fejl:", e);
    }
  }

  const renderItem = ({ item }) => {
    const mine = item.senderId === myId;
    return (
      <View
        style={{
          paddingVertical: 4,
          paddingHorizontal: 10,
          alignItems: mine ? "flex-end" : "flex-start",
        }}
      >
        <View
          style={{
            maxWidth: "80%",
            backgroundColor: mine ? "#0A84FF" : "#E5E7EB",
            paddingVertical: 8,
            paddingHorizontal: 12,
            borderRadius: 14,
            borderBottomRightRadius: mine ? 2 : 14,
            borderBottomLeftRadius: mine ? 14 : 2,
          }}
        >
          <Text
            style={{
              color: mine ? "white" : "#111827",
              fontSize: 16,
            }}
          >
            {item.text}
          </Text>
          <Text
            style={{
              color: mine ? "rgba(255,255,255,0.8)" : "#6B7280",
              fontSize: 10,
              marginTop: 4,
              alignSelf: "flex-end",
            }}
          >
            {timeLabel(item.createdAt)}
          </Text>
        </View>
      </View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "white" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        {/* Messages */}
        <View style={{ flex: 1 }}>
          {pending ? (
            <View
              style={{
                flex: 1,
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <ActivityIndicator />
              <Text style={{ marginTop: 8 }}>Henter beskeder…</Text>
            </View>
          ) : (
            <FlatList
              ref={flatRef}
              data={messages}
              keyExtractor={(it) => it.id}
              renderItem={renderItem}
              contentContainerStyle={{ paddingVertical: 10 }}
              onContentSizeChange={() =>
                flatRef.current?.scrollToEnd?.({ animated: true })
              }
            />
          )}
        </View>

        {/* Composer */}
        <View
          style={{
            flexDirection: "row",
            alignItems: "center",
            padding: 10,
            borderTopWidth: 1,
            borderTopColor: "#E5E7EB",
            gap: 8,
          }}
        >
          <TextInput
            style={{
              flex: 1,
              backgroundColor: "#F3F4F6",
              borderRadius: 20,
              paddingHorizontal: 14,
              paddingVertical: 10,
              fontSize: 16,
            }}
            placeholder="Skriv en besked…"
            value={text}
            onChangeText={setText}
            multiline
          />
          <TouchableOpacity
            onPress={onSend}
            disabled={!text.trim()}
            style={{
              backgroundColor: text.trim() ? "#0A84FF" : "#93C5FD",
              paddingVertical: 10,
              paddingHorizontal: 16,
              borderRadius: 18,
            }}
          >
            <Text style={{ color: "white", fontWeight: "600" }}>Send</Text>
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}