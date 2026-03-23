// screens/CustomerScreen.tsx
import React, { useEffect, useState } from "react";
import { View, Text, TouchableOpacity, ActivityIndicator } from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { api } from "../api";
import { colors, t } from "../theme";

export default function CustomerScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { cardId } = route.params as { cardId: string };

  const [points,  setPoints]  = useState<number | null>(null);
  const [loading, setLoading] = useState(true);
  const [error,   setError]   = useState("");

  useEffect(() => {
    api.viewCard(cardId)
      .then(d => setPoints(d.points))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false));
  }, []);

  return (
    <View style={[t.screen, { justifyContent: "center" }]}>

      {/* Balance card */}
      <View style={[t.card, {
        backgroundColor: colors.accent2,
        alignItems: "center",
        paddingVertical: 40,
        borderColor: "transparent",
      }]}>
        <Text style={{ fontSize: 11, fontWeight: "600", color: "rgba(200,255,225,0.7)",
                       letterSpacing: 1.5, textTransform: "uppercase", marginBottom: 8 }}>
          Your Balance
        </Text>

        {loading
          ? <ActivityIndicator size="large" color={colors.accent} />
          : error
          ? <Text style={t.errorText}>{error}</Text>
          : <Text style={{ fontSize: 80, fontWeight: "700", color: "#fff", lineHeight: 88 }}>
              {points}
            </Text>
        }

        <Text style={{ fontSize: 14, color: "rgba(200,255,225,0.7)", marginTop: 4 }}>points</Text>
        <Text style={{ fontSize: 11, color: "rgba(200,255,225,0.5)", marginTop: 12 }}>
          #{cardId}
        </Text>
      </View>

      <TouchableOpacity
        style={[t.btn, { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]}
        onPress={() => navigation.goBack()}
      >
        <Text style={[t.btnText, { color: colors.sub }]}>← Back</Text>
      </TouchableOpacity>

    </View>
  );
}
