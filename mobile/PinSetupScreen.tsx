// screens/PinSetupScreen.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity, Alert } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, t } from "../theme";

export default function PinSetupScreen({ onComplete }: { onComplete: () => void }) {
  const [pin, setPin]     = useState("");
  const [confirm, setConfirm] = useState("");
  const [step, setStep]   = useState<"enter" | "confirm">("enter");
  const [error, setError] = useState("");

  function next() {
    if (pin.length !== 4) { setError("PIN must be 4 digits."); return; }
    setError("");
    setStep("confirm");
  }

  async function save() {
    if (confirm !== pin) {
      setError("PINs don't match. Try again.");
      setConfirm("");
      return;
    }
    await AsyncStorage.setItem("staff_pin", pin);
    onComplete();
  }

  return (
    <View style={[t.screen, { justifyContent: "center" }]}>
      <Text style={[t.title, { textAlign: "center", color: colors.accent }]}>◈ LoyaltyCard</Text>
      <Text style={[t.subtitle, { textAlign: "center", marginBottom: 32 }]}>
        {step === "enter" ? "Set a 4-digit staff PIN" : "Confirm your PIN"}
      </Text>

      <View style={t.card}>
        <Text style={t.label}>{step === "enter" ? "New PIN" : "Confirm PIN"}</Text>
        <TextInput
          style={t.input}
          value={step === "enter" ? pin : confirm}
          onChangeText={step === "enter" ? setPin : setConfirm}
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
          placeholder="••••"
          placeholderTextColor={colors.sub}
        />
        {!!error && <Text style={t.errorText}>{error}</Text>}
        <TouchableOpacity
          style={[t.btn, { backgroundColor: colors.accent }]}
          onPress={step === "enter" ? next : save}
        >
          <Text style={[t.btnText, { color: "#0a0a14" }]}>
            {step === "enter" ? "Next →" : "Save PIN"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}
