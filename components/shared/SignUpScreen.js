import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import { signUpUser } from "../../services/authService";

// styles
import styles from "../../styles/shared/signUpStyles";

const SignUpScreen = ({ navigation }) => {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [name, setName] = useState("");
  const [role, setRole] = useState("owner"); // default = owner
  const [phone, setPhone] = useState("");
  const [location, setLocation] = useState("");

  const handleSignUp = async () => {
    try {
      const user = await signUpUser(email, password, name, role, phone, location);
      Alert.alert("Success", `User ${user.email} created as ${role}!`);
    } catch (error) {
      console.error(error);
      Alert.alert("Error", error.message);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Sign Up</Text>

      <TextInput
        style={styles.input}
        placeholder="Full Name"
        value={name}
        onChangeText={setName}
      />

      <TextInput
        style={styles.input}
        placeholder="Email"
        value={email}
        onChangeText={setEmail}
        keyboardType="email-address"
      />

      <TextInput
        style={styles.input}
        placeholder="Password"
        value={password}
        onChangeText={setPassword}
        secureTextEntry
      />

      <TextInput
        style={styles.input}
        placeholder="Phone Number"
        value={phone}
        onChangeText={setPhone}
        keyboardType="phone-pad"
      />

      <TextInput
        style={styles.input}
        placeholder="Location"
        value={location}
        onChangeText={setLocation}
      />

      {/* Role Selection */}
      <Text style={styles.label}>Choose your role:</Text>
      <View style={styles.roleContainer}>
        <TouchableOpacity
          style={[styles.roleButton, role === "owner" && styles.roleButtonActive]}
          onPress={() => setRole("owner")}
        >
          <Text style={[styles.roleText, role === "owner" && styles.roleTextActive]}>
            Boat Owner
          </Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={[styles.roleButton, role === "provider" && styles.roleButtonActive]}
          onPress={() => setRole("provider")}
        >
          <Text style={[styles.roleText, role === "provider" && styles.roleTextActive]}>
            Provider / Mechanic
          </Text>
        </TouchableOpacity>
      </View>

      <TouchableOpacity style={styles.button} onPress={handleSignUp}>
        <Text style={styles.buttonText}>Create Account</Text>
      </TouchableOpacity>

      <TouchableOpacity onPress={() => navigation.navigate("Login")}>
        <Text style={styles.link}>Har du allerede en konto? Log ind</Text>
      </TouchableOpacity>
    </View>
  );
};

export default SignUpScreen;
