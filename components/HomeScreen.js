import { View, Text, TouchableOpacity } from "react-native";
import { signOut } from "firebase/auth";
import { auth } from "../firebase";
import React from "react";

// styles
import styles from "../styles/homeStyles";

const HomeScreen = () => {
  const handleLogout = async () => {
    try {
      await signOut(auth);
      console.log("User logged out");
    } catch (error) {
      console.error("Logout error: ", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.text}>Velkommen til HarborHub 🚤</Text>

      <TouchableOpacity style={styles.button} onPress={handleLogout}>
        <Text style={styles.buttonText}>Log ud</Text>
      </TouchableOpacity>
    </View>
  );
};

export default HomeScreen;
