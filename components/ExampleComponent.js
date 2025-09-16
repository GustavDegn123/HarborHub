import React from "react";
import { View, Text, StyleSheet } from "react-native";

export default function ExampleComponent() {
  return (
    <View style={styles.container}>
      <Text>This is a reusable component 🚀</Text>
    </View>
  );
}

const styles = StyleSheet.create({
  container: {
    padding: 10,
    backgroundColor: "#f5f5f5",
    borderRadius: 8,
    marginVertical: 5,
  },
});
