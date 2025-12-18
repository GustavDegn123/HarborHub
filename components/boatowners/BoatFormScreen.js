import React, { useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  Switch,
  ActivityIndicator,
  Modal,
  Pressable,
} from "react-native";
import { addBoat } from "../../services/boatsService";
import { auth } from "../../firebase";
import styles from "../../styles/boatowners/boatFormStyles";

export default function BoatFormScreen({ navigation }) {
  const [name, setName] = useState("");
  const [model, setModel] = useState("");
  const [type, setType] = useState("sailboat");
  const [length, setLength] = useState("");
  const [width, setWidth] = useState("");
  const [draft, setDraft] = useState("");
  const [year, setYear] = useState("");
  const [avgSpeed, setAvgSpeed] = useState("");
  const [fuelConsumption, setFuelConsumption] = useState("");
  const [freeHarbor, setFreeHarbor] = useState(false);

  const [saving, setSaving] = useState(false);
  const [successVisible, setSuccessVisible] = useState(false);

  const resetForm = () => {
    setName("");
    setModel("");
    setType("sailboat");
    setLength("");
    setWidth("");
    setDraft("");
    setYear("");
    setAvgSpeed("");
    setFuelConsumption("");
    setFreeHarbor(false);
  };

  const handleSave = async () => {
    const ownerId = auth.currentUser?.uid;
    if (!ownerId) return;

    if (!name.trim()) {
      return;
    }

    try {
      setSaving(true);

      await addBoat(ownerId, {
        name: name.trim(),
        model: model.trim(),
        type,
        length: parseFloat(length) || 0,
        width: parseFloat(width) || 0,
        draft: parseFloat(draft) || 0,
        year: parseInt(year, 10) || null,
        avgSpeed: parseFloat(avgSpeed) || 0,
        fuelConsumption: parseFloat(fuelConsumption) || 0,
        freeHarbor,
      });

      setSuccessVisible(true);
    } catch (e) {
      console.error("Fejl ved oprettelse af båd:", e);
      // Vi bruger stadig native her ved fejl (det er fint)
      alert(e?.message || "Kunne ikke gemme båden. Prøv igen.");
    } finally {
      setSaving(false);
    }
  };

  const closeAndGoBack = () => {
    setSuccessVisible(false);
    navigation.goBack();
  };

  const addAnother = () => {
    setSuccessVisible(false);
    resetForm();
  };

  return (
    <>
      <ScrollView
        contentContainerStyle={styles.container}
        keyboardShouldPersistTaps="handled"
      >
        <Text style={styles.title}>Tilføj en båd</Text>

        <TextInput
          style={styles.input}
          placeholder="Bådnavn"
          value={name}
          onChangeText={setName}
          editable={!saving}
        />
        <TextInput
          style={styles.input}
          placeholder="Model"
          value={model}
          onChangeText={setModel}
          editable={!saving}
        />

        <View style={styles.row}>
          <TouchableOpacity
            style={[
              styles.typeBtn,
              type === "sailboat" ? styles.typeBtnActive : styles.typeBtnInactive,
            ]}
            onPress={() => setType("sailboat")}
            disabled={saving}
            accessibilityRole="button"
            accessibilityState={{ selected: type === "sailboat" }}
          >
            <Text
              style={[
                styles.typeBtnText,
                type === "sailboat"
                  ? styles.typeBtnTextActive
                  : styles.typeBtnTextInactive,
              ]}
            >
              Sejlbåd
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.typeBtn,
              type === "motorboat" ? styles.typeBtnActive : styles.typeBtnInactive,
            ]}
            onPress={() => setType("motorboat")}
            disabled={saving}
            accessibilityRole="button"
            accessibilityState={{ selected: type === "motorboat" }}
          >
            <Text
              style={[
                styles.typeBtnText,
                type === "motorboat"
                  ? styles.typeBtnTextActive
                  : styles.typeBtnTextInactive,
              ]}
            >
              Motorbåd
            </Text>
          </TouchableOpacity>
        </View>

        <TextInput
          style={styles.input}
          placeholder="Længde (m)"
          keyboardType="numeric"
          value={length}
          onChangeText={setLength}
          editable={!saving}
        />
        <TextInput
          style={styles.input}
          placeholder="Bredde (m)"
          keyboardType="numeric"
          value={width}
          onChangeText={setWidth}
          editable={!saving}
        />
        <TextInput
          style={styles.input}
          placeholder="Dybgang (m)"
          keyboardType="numeric"
          value={draft}
          onChangeText={setDraft}
          editable={!saving}
        />
        <TextInput
          style={styles.input}
          placeholder="Årgang"
          keyboardType="numeric"
          value={year}
          onChangeText={setYear}
          editable={!saving}
        />
        <TextInput
          style={styles.input}
          placeholder="Gennemsnitsfart (knob)"
          keyboardType="numeric"
          value={avgSpeed}
          onChangeText={setAvgSpeed}
          editable={!saving}
        />
        <TextInput
          style={styles.input}
          placeholder="Brændstofforbrug (L/t)"
          keyboardType="numeric"
          value={fuelConsumption}
          onChangeText={setFuelConsumption}
          editable={!saving}
        />

        <View style={styles.row}>
          <Text style={{ flex: 1 }}>Frihavns mærke?</Text>
          <Switch value={freeHarbor} onValueChange={setFreeHarbor} disabled={saving} />
        </View>

        <TouchableOpacity
          style={[styles.saveBtn, saving && styles.saveBtnDisabled]}
          onPress={handleSave}
          disabled={saving}
          activeOpacity={0.9}
        >
          {saving ? (
            <View style={styles.saveBtnInner}>
              <ActivityIndicator />
              <Text style={styles.saveBtnText}>Gemmer…</Text>
            </View>
          ) : (
            <Text style={styles.saveBtnText}>Gem båd</Text>
          )}
        </TouchableOpacity>
      </ScrollView>

      {/* ✅ Success modal */}
      <Modal
        visible={successVisible}
        transparent
        animationType="fade"
        onRequestClose={closeAndGoBack}
      >
        <Pressable style={styles.modalBackdrop} onPress={closeAndGoBack}>
          <Pressable style={styles.modalCard} onPress={() => {}}>
            <View style={styles.modalBadge}>
              <Text style={styles.modalBadgeText}>✓</Text>
            </View>

            <Text style={styles.modalTitle}>Båd gemt</Text>
            <Text style={styles.modalSubtitle}>
              {name?.trim()
                ? `“${name.trim()}” er tilføjet til din konto.`
                : "Din båd er tilføjet til din konto."}
            </Text>

            <View style={styles.modalBtnRow}>
              <TouchableOpacity
                style={styles.modalSecondaryBtn}
                onPress={addAnother}
                activeOpacity={0.9}
              >
                <Text style={styles.modalSecondaryText}>Tilføj en mere</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.modalPrimaryBtn}
                onPress={closeAndGoBack}
                activeOpacity={0.9}
              >
                <Text style={styles.modalPrimaryText}>Fortsæt</Text>
              </TouchableOpacity>
            </View>
          </Pressable>
        </Pressable>
      </Modal>
    </>
  );
}
