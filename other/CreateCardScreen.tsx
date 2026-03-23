// screens/CreateCardScreen.tsx
import React, { useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator, Alert } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { api } from "../api";
import { writeNfcTag, cleanupNfc } from "../nfc";
import { colors, t } from "../theme";

type Step = "idle" | "registering" | "registered" | "writing" | "done" | "error";

export default function CreateCardScreen() {
  const navigation = useNavigation<any>();
  const [step,   setStep]   = useState<Step>("idle");
  const [cardId, setCardId] = useState("");
  const [error,  setError]  = useState("");

  async function createAndWrite() {
    setStep("registering");
    setError("");
    try {
      // 1. Register card on server
      const d = await api.createCard();
      const newId: string = d.card_id;
      setCardId(newId);
      setStep("registered");

      // 2. Write ID to NFC tag
      setStep("writing");
      await writeNfcTag(newId);
      setStep("done");
    } catch(e: any) {
      setError(e.message ?? "Something went wrong.");
      setStep("error");
      cleanupNfc();
    }
  }

  const statusText: Record<Step, string> = {
    idle:        "Tap the button to create a new card.",
    registering: "Registering card with server…",
    registered:  `Card ${cardId} registered!\nNow hold a blank NFC tag to the back of your phone.`,
    writing:     "Writing to NFC tag…",
    done:        `✓ Card ${cardId} is ready!\nBalance starts at 0 points.`,
    error:       error,
  };

  const statusColor: Record<Step, string> = {
    idle:        colors.sub,
    registering: colors.sub,
    registered:  colors.warning,
    writing:     colors.warning,
    done:        colors.accent,
    error:       colors.danger,
  };

  return (
    <View style={[t.screen, { justifyContent: "space-between" }]}>

      <View style={{ marginTop: 20 }}>
        <Text style={t.title}>Create New Card</Text>
        <Text style={t.subtitle}>Generates a card ID, registers it, then writes it to a blank NFC tag.</Text>
      </View>

      {/* Status card */}
      <View style={[t.card, { alignItems: "center", paddingVertical: 40 }]}>
        {(step === "registering" || step === "writing") && (
          <ActivityIndicator size="large" color={colors.accent} style={{ marginBottom: 16 }} />
        )}

        {step === "done" && (
          <Text style={{ fontSize: 60, marginBottom: 16 }}>✅</Text>
        )}

        {cardId && step !== "idle" && (
          <Text style={{ fontFamily: "monospace", fontSize: 22, fontWeight: "700",
                         color: colors.accent, marginBottom: 12 }}>
            #{cardId}
          </Text>
        )}

        <Text style={{ color: statusColor[step], fontSize: 14, textAlign: "center", lineHeight: 22 }}>
          {statusText[step]}
        </Text>
      </View>

      {/* Buttons */}
      <View style={{ gap: 10, paddingBottom: 10 }}>
        {(step === "idle" || step === "error" || step === "done") && (
          <TouchableOpacity
            style={[t.btn, { backgroundColor: colors.accent }]}
            onPress={createAndWrite}
          >
            <Text style={[t.btnText, { color: "#0a0a14" }]}>
              {step === "done" ? "Create Another" : "＋ Create Card"}
            </Text>
          </TouchableOpacity>
        )}

        <TouchableOpacity
          style={[t.btn, { backgroundColor: colors.inputBg,
                           borderWidth: 1, borderColor: colors.border }]}
          onPress={() => navigation.goBack()}
        >
          <Text style={[t.btnText, { color: colors.sub }]}>← Back</Text>
        </TouchableOpacity>
      </View>

    </View>
  );
}
