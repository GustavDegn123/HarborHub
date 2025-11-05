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
import { app } from "../../firebase";
import styles, { colors as chatColors } from "../../styles/boatowners/chatBotStyles";

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

      if (!resp.ok) throw new Error(`HTTP ${resp.status}`);

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
      setTimeout(() => listRef.current?.scrollToEnd?.({ animated: true }), 50);
    }
  };

  const renderItem = ({ item }) => {
    const isUser = item.role === "user";
    return (
      <View
        style={[
            styles.bubbleBase,
            isUser ? styles.bubbleUser : styles.bubbleAssistant,
        ]}
      >
        <Text style={[styles.bubbleText, isUser && styles.bubbleTextUser]}>
          {item.content}
        </Text>
      </View>
    );
  };

  const composerBottom = (insets.bottom || 0) + 12;
  const listPaddingBottom = (insets.bottom || 0) + 90;

  return (
    <SafeAreaView style={styles.root}>
      <KeyboardAvoidingView
        style={styles.flex1}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        keyboardVerticalOffset={Platform.OS === "ios" ? 64 : 0}
      >
        <FlatList
          ref={listRef}
          data={messages}
          keyExtractor={(it) => it.id}
          renderItem={renderItem}
          contentContainerStyle={[
            styles.listContent,
            { paddingBottom: listPaddingBottom },
          ]}
          onContentSizeChange={() =>
            listRef.current?.scrollToEnd?.({ animated: true })
          }
        />

        {/* Composer */}
        <View style={[styles.composer, { bottom: composerBottom }]}>
          <TextInput
            value={input}
            onChangeText={setInput}
            placeholder="Skriv en besked…"
            placeholderTextColor={chatColors.placeholder}
            style={styles.input}
            multiline
          />
          {loading ? (
            <ActivityIndicator />
          ) : (
            <Pressable onPress={send} hitSlop={8}>
              <Ionicons name="send" size={22} color={chatColors.primary} />
            </Pressable>
          )}
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}
