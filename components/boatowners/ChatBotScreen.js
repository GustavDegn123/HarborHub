// components/boatowners/ChatBotScreen.js
import React, { useState, useRef } from "react";
import {
  View,
  Text,
  FlatList,
  TextInput,
  Pressable,
  ActivityIndicator,
  KeyboardAvoidingView,
  Platform,
} from "react-native";
import { SafeAreaView, useSafeAreaInsets } from "react-native-safe-area-context";
import { Ionicons } from "@expo/vector-icons";
import { app } from "../../firebase"; // virker nu fordi app eksporteres

// Prod cloud function (brug dit projekt-id fra app.options)
const CHAT_ENDPOINT = `https://us-central1-${app.options.projectId}.cloudfunctions.net/chat`;
// Til emulator på iOS-simulator:
// const CHAT_ENDPOINT = `http://127.0.0.1:5001/${app.options.projectId}/us-central1/chat`;

export default function ChatBotScreen() {
  const [messages, setMessages] = useState([
    {
      id: "sys-1",
      role: "assistant",
      content: "Hej! Jeg er din HarborHub-hjælper. Hvad kan jeg hjælpe med?",
    },
  ]);
  const [input, setInput] = useState("");
  const [loading, setLoading] = useState(false);
  const insets = useSafeAreaInsets();
  const listRef = useRef(null);

  const send = async () => {
    const text = input.trim();
    if (!text || loading) return;
    const userMsg = { id: String(Date.now()), role: "user", content: text };
    setMessages((m) => [...m, userMsg]);
    setInput("");
    setLoading(true);

    try {
      const resp = await fetch(CHAT_ENDPOINT, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          messages: [
            {
              role: "system",
              content:
                "Du er en hjælpsom assistent for HarborHub. Svar kort og på dansk.",
            },
            ...messages.map(({ role, content }) => ({ role, content })),
            { role: "user", content: text },
          ],
        }),
      });

      if (!resp.ok) {
        throw new Error(`HTTP ${resp.status}`);
      }

      const data = await resp.json();
      const reply =
        data?.reply?.content ??
        data?.reply?.message?.content ??
        "Beklager, der skete en fejl.";
      setMessages((m) => [
        ...m,
        { id: "ai-" + Date.now(), role: "assistant", content: reply },
      ]);
    } catch (e) {
      setMessages((m) => [
        ...m,
        {
          id: "err-" + Date.now(),
          role: "assistant",
          content: "Fejl ved forespørgsel.",
        },
      ]);
      console.warn("Chat error:", e);
    } finally {
      setLoading(false);
      setTimeout(() => listRef.current?.scrollToEnd({ animated: true }), 50);
    }
  };

  const renderItem = ({ item }) => {
    const isUser = item.role === "user";
    return (
      <View
        style={{
          alignSelf: isUser ? "flex-end" : "flex-start",
          backgroundColor: isUser ? "#0A84FF" : "#F3F4F6",
          paddingVertical: 10,
          paddingHorizontal: 14,
          borderRadius: 16,
          marginVertical: 6,
          maxWidth: "82%",
        }}
      >
        <Text style={{ color: isUser ? "#fff" : "#111827" }}>
          {item.content}
        </Text>
      </View>
    );
  };

  const composerBottom = (insets.bottom || 0) + 12;
  const listPaddingBottom = (insets.bottom || 0) + 90;

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <KeyboardAvoidingView
        style={{ flex: 1 }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={{ padding: 16, paddingBottom: listPaddingBottom }}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd({ animated: true })
          }
        />

        {/* Composer */}
        <View
          style={{
            position: "absolute",
            left: 12,
            right: 12,
            bottom: composerBottom,
            backgroundColor: "#fff",
            borderRadius: 24,
            borderWidth: 1,
            borderColor: "#E5E7EB",
            flexDirection: "row",
            alignItems: "center",
            paddingHorizontal: 12,
            paddingVertical: 6,
            shadowColor: "#000",
            shadowOpacity: 0.08,
            shadowRadius: 8,
            shadowOffset: { width: 0, height: 3 },
            elevation: 4,
          }}
        >
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Skriv en besked…"
            placeholderTextColor="#667085"
            style={{ flex: 1, padding: 10 }}
            multiline
          />
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Pressable onPress={send} hitSlop={8}>
              <Ionicons name="send" size={22} color="#0A84FF" />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}