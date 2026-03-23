// screens/PinEntryScreen.tsx
import React, { useState } from "react";
import { View, Text, TextInput, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { colors, t } from "../theme";

interface Props {
  onSuccess: () => void;
  onCancel:  () => void;
}

export default function PinEntryScreen({ onSuccess, onCancel }: Props) {
  const [pin, setPin]   = useState("");
  const [error, setError] = useState("");

  async function verify() {
    const stored = await AsyncStorage.getItem("staff_pin");
    if (pin === stored) {
      onSuccess();
    } else {
      setError("Incorrect PIN.");
      setPin("");
    }
  }

  return (
    <View style={[t.screen, { justifyContent: "center" }]}>
      <Text style={[t.title, { textAlign: "center" }]}>Staff Login</Text>
      <Text style={[t.subtitle, { textAlign: "center", marginBottom: 32 }]}>
        Enter your 4-digit PIN
      </Text>

      <View style={t.card}>
        <Text style={t.label}>PIN</Text>
        <TextInput
          style={t.input}
          value={pin}
          onChangeText={setPin}
          keyboardType="number-pad"
          maxLength={4}
          secureTextEntry
          placeholder="••••"
          placeholderTextColor={colors.sub}
          autoFocus
        />
        {!!error && <Text style={t.errorText}>{error}</Text>}

        <View style={t.row}>
          <TouchableOpacity
            style={[t.btn, { flex: 1, backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]}
            onPress={onCancel}
          >
            <Text style={[t.btnText, { color: colors.sub }]}>Cancel</Text>
          </TouchableOpacity>
          <TouchableOpacity
            style={[t.btn, { flex: 1, backgroundColor: colors.accent }]}
            onPress={verify}
          >
            <Text style={[t.btnText, { color: "#0a0a14" }]}>Unlock</Text>
          </TouchableOpacity>
        </View>
      </View>
    </View>
  );
}
