// screens/HomeScreen.tsx
import React, { useState, useEffect } from "react";
import { View, Text, TouchableOpacity, Alert, ActivityIndicator } from "react-native";
import { useNavigation } from "@react-navigation/native";
import { initNfc, readNfcTag, cleanupNfc } from "../nfc";
import { colors, t } from "../theme";

interface Props {
  isStaff: boolean;
  onStaffPress: () => void;
  onLogout: () => void;
}

export default function HomeScreen({ isStaff, onStaffPress, onLogout }: Props) {
  const navigation = useNavigation<any>();
  const [scanning, setScanning] = useState(false);
  const [nfcAvailable, setNfcAvailable] = useState(true);

  useEffect(() => {
    initNfc().then(setNfcAvailable);
    return () => cleanupNfc();
  }, []);

  async function scan() {
    setScanning(true);
    try {
      const cardId = await readNfcTag();
      if (!cardId) {
        Alert.alert("No data", "Could not read card ID from tag.");
        return;
      }
      if (isStaff) {
        navigation.navigate("Staff", { cardId });
      } else {
        navigation.navigate("Customer", { cardId });
      }
    } catch (e: any) {
      if (!e.message?.includes("cancelled")) {
        Alert.alert("NFC Error", e.message ?? "Could not read tag.");
      }
    } finally {
      setScanning(false);
    }
  }

  return (
    <View style={[t.screen, { justifyContent: "space-between" }]}>

      {/* Header */}
      <View style={{ marginTop: 20 }}>
        <Text style={[t.title, { color: colors.accent, fontSize: 28 }]}>◈ LoyaltyCard</Text>
        <Text style={t.subtitle}>
          {isStaff ? "Staff mode — full management enabled" : "Tap a card to view balance"}
        </Text>
      </View>

      {/* Scan button */}
      <View style={{ alignItems: "center" }}>
        <TouchableOpacity
          onPress={scan}
          disabled={scanning || !nfcAvailable}
          style={{
            width: 200,
            height: 200,
            borderRadius: 100,
            backgroundColor: scanning ? colors.accent2 : colors.accent,
            alignItems: "center",
            justifyContent: "center",
            shadowColor: colors.accent,
            shadowOpacity: 0.4,
            shadowRadius: 30,
            elevation: 12,
          }}
        >
          {scanning
            ? <ActivityIndicator size="large" color="#fff" />
            : <Text style={{ fontSize: 60 }}>📡</Text>
          }
        </TouchableOpacity>
        <Text style={[t.subtitle, { marginTop: 20, textAlign: "center" }]}>
          {!nfcAvailable
            ? "NFC not available on this device"
            : scanning
            ? "Hold card to back of phone…"
            : "Tap to scan a card"}
        </Text>
      </View>

      {/* Bottom buttons */}
      <View style={{ gap: 10, paddingBottom: 10 }}>
        {isStaff && (
          <TouchableOpacity
            style={[t.btn, { backgroundColor: colors.accent }]}
            onPress={() => navigation.navigate("CreateCard")}
          >
            <Text style={[t.btnText, { color: "#0a0a14" }]}>＋ Create New Card</Text>
          </TouchableOpacity>
        )}

        {isStaff ? (
          <TouchableOpacity
            style={[t.btn, { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]}
            onPress={onLogout}
          >
            <Text style={[t.btnText, { color: colors.sub }]}>Lock Staff Mode</Text>
          </TouchableOpacity>
        ) : (
          <TouchableOpacity
            style={[t.btn, { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]}
            onPress={onStaffPress}
          >
            <Text style={[t.btnText, { color: colors.sub }]}>Staff Login</Text>
          </TouchableOpacity>
        )}
      </View>

    </View>
  );
}
