// screens/StaffScreen.tsx
import React, { useEffect, useState } from "react";
import {
  View, Text, TouchableOpacity, ActivityIndicator,
  TextInput, Modal, ScrollView, Alert,
} from "react-native";
import { useNavigation, useRoute } from "@react-navigation/native";
import { api, Transaction } from "../api";
import { colors, t } from "../theme";

export default function StaffScreen() {
  const navigation = useNavigation<any>();
  const route      = useRoute<any>();
  const { cardId } = route.params as { cardId: string };

  const [points,       setPoints]       = useState<number | null>(null);
  const [loading,      setLoading]      = useState(true);
  const [feedback,     setFeedback]     = useState({ msg: "", color: colors.accent });
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [showHistory,  setShowHistory]  = useState(false);
  const [modal,        setModal]        = useState<{ action: string; title: string } | null>(null);
  const [inputVal,     setInputVal]     = useState("");

  useEffect(() => { refresh(); }, []);

  async function refresh() {
    setLoading(true);
    try {
      const d = await api.viewCard(cardId);
      setPoints(d.points);
    } catch(e: any) {
      flash(e.message, colors.danger);
    } finally {
      setLoading(false);
    }
  }

  function flash(msg: string, color = colors.accent) {
    setFeedback({ msg, color });
    setTimeout(() => setFeedback({ msg: "", color: colors.accent }), 3000);
  }

  async function runAction(action: string, n: number) {
    try {
      let d: any;
      if      (action === "add")    d = await api.addPoints(cardId, n);
      else if (action === "remove") d = await api.removePoints(cardId, n);
      else if (action === "set")    d = await api.setPoints(cardId, n);
      setPoints(d.points);
      const verbs: Record<string,string> = { add: `Added ${n}`, remove: `Removed ${n}`, set: `Set to ${n}` };
      flash(`✓ ${verbs[action]}`);
    } catch(e: any) {
      flash(e.message, colors.danger);
    }
  }

  async function doReset() {
    Alert.alert("Confirm Reset", "Reset balance to 0?", [
      { text: "Cancel", style: "cancel" },
      { text: "Reset", style: "destructive", onPress: async () => {
        try {
          await api.setPoints(cardId, 0);
          setPoints(0);
          flash("✓ Reset to 0", colors.danger);
        } catch(e: any) {
          flash(e.message, colors.danger);
        }
      }},
    ]);
  }

  async function loadHistory() {
    try {
      const d = await api.getTransactions(cardId);
      setTransactions(d.transactions);
      setShowHistory(true);
    } catch(e: any) {
      flash(e.message, colors.danger);
    }
  }

  function confirmModal() {
    const n = parseInt(inputVal);
    if (isNaN(n) || n < 0) return;
    setModal(null);
    setInputVal("");
    runAction(modal!.action, n);
  }

  const actionBtns = [
    { label: "＋ 1 Point",   bg: colors.accent,   tc: "#0a0a14", onPress: () => runAction("add", 1) },
    { label: "＋ Custom",    bg: "#28c876",        tc: "#0a0a14", onPress: () => { setModal({ action: "add",    title: "Add Points"    }); setInputVal(""); } },
    { label: "－ Remove",    bg: "#2a2a3e",        tc: colors.text, onPress: () => { setModal({ action: "remove", title: "Remove Points" }); setInputVal(""); } },
    { label: "✎ Set Value",  bg: colors.purple,   tc: "#fff",    onPress: () => { setModal({ action: "set",    title: "Set Balance"   }); setInputVal(""); } },
    { label: "↺ Reset",      bg: colors.danger,   tc: "#fff",    onPress: doReset },
    { label: "⟳ Refresh",    bg: colors.inputBg,  tc: colors.sub, onPress: refresh },
  ];

  return (
    <View style={t.screen}>

      {/* Top bar */}
      <View style={[t.row, { marginBottom: 16, alignItems: "center" }]}>
        <TouchableOpacity
          style={{ backgroundColor: colors.inputBg, borderRadius: 8, paddingHorizontal: 14,
                   paddingVertical: 8, borderWidth: 1, borderColor: colors.border }}
          onPress={() => navigation.goBack()}
        >
          <Text style={{ color: colors.sub, fontSize: 13 }}>← Back</Text>
        </TouchableOpacity>
        <Text style={{ marginLeft: "auto", color: colors.accent,
                       fontFamily: "monospace", fontSize: 13 }}>#{cardId}</Text>
      </View>

      {/* Balance */}
      <View style={[t.card, { backgroundColor: colors.accent2, alignItems: "center",
                               paddingVertical: 28, borderColor: "transparent" }]}>
        <Text style={{ fontSize: 10, color: "rgba(200,255,225,0.7)", letterSpacing: 1.5,
                       textTransform: "uppercase", marginBottom: 6 }}>Balance</Text>
        {loading
          ? <ActivityIndicator color={colors.accent} size="large" />
          : <Text style={{ fontSize: 64, fontWeight: "700", color: "#fff", lineHeight: 72 }}>
              {points ?? "—"}
            </Text>
        }
        <Text style={{ fontSize: 13, color: "rgba(200,255,225,0.7)", marginTop: 4 }}>points</Text>
      </View>

      {/* Feedback */}
      {!!feedback.msg && (
        <Text style={{ color: feedback.color, fontSize: 13, textAlign: "center", marginBottom: 10 }}>
          {feedback.msg}
        </Text>
      )}

      {/* Action grid */}
      <View style={{ flexDirection: "row", flexWrap: "wrap", gap: 10, marginBottom: 14 }}>
        {actionBtns.map(btn => (
          <TouchableOpacity
            key={btn.label}
            style={[t.btn, { backgroundColor: btn.bg, flex: 1, minWidth: "45%",
                             borderWidth: btn.bg === colors.inputBg ? 1 : 0,
                             borderColor: colors.border }]}
            onPress={btn.onPress}
          >
            <Text style={[t.btnText, { color: btn.tc }]}>{btn.label}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* History button */}
      <TouchableOpacity
        style={[t.btn, { backgroundColor: colors.inputBg, borderWidth: 1, borderColor: colors.border }]}
        onPress={loadHistory}
      >
        <Text style={[t.btnText, { color: colors.sub }]}>📋 Transaction History</Text>
      </TouchableOpacity>

      {/* Custom amount modal */}
      <Modal visible={!!modal} transparent animationType="fade">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.7)",
                       justifyContent: "center", alignItems: "center" }}>
          <View style={[t.card, { width: "85%", marginBottom: 0 }]}>
            <Text style={[t.title, { fontSize: 16, marginBottom: 14 }]}>{modal?.title}</Text>
            <TextInput
              style={t.input}
              value={inputVal}
              onChangeText={setInputVal}
              keyboardType="number-pad"
              placeholder="0"
              placeholderTextColor={colors.sub}
              autoFocus
            />
            <View style={t.row}>
              <TouchableOpacity
                style={[t.btn, { flex: 1, backgroundColor: colors.inputBg,
                                 borderWidth: 1, borderColor: colors.border }]}
                onPress={() => setModal(null)}
              >
                <Text style={[t.btnText, { color: colors.sub }]}>Cancel</Text>
              </TouchableOpacity>
              <TouchableOpacity
                style={[t.btn, { flex: 1, backgroundColor: colors.accent }]}
                onPress={confirmModal}
              >
                <Text style={[t.btnText, { color: "#0a0a14" }]}>Confirm</Text>
              </TouchableOpacity>
            </View>
          </View>
        </View>
      </Modal>

      {/* History modal */}
      <Modal visible={showHistory} transparent animationType="slide">
        <View style={{ flex: 1, backgroundColor: "rgba(0,0,0,0.85)" }}>
          <View style={{ flex: 1, margin: 20, marginTop: 60 }}>
            <View style={[t.row, { marginBottom: 16, alignItems: "center" }]}>
              <Text style={[t.title, { fontSize: 18 }]}>Transaction History</Text>
              <TouchableOpacity
                style={{ marginLeft: "auto", backgroundColor: colors.inputBg,
                         borderRadius: 8, padding: 8, borderWidth: 1, borderColor: colors.border }}
                onPress={() => setShowHistory(false)}
              >
                <Text style={{ color: colors.sub }}>Close</Text>
              </TouchableOpacity>
            </View>
            <ScrollView>
              {transactions.length === 0
                ? <Text style={{ color: colors.sub, textAlign: "center", marginTop: 40 }}>No transactions yet.</Text>
                : transactions.map(tx => (
                  <View key={tx.sale_id} style={[t.card, { marginBottom: 8 }]}>
                    <View style={t.row}>
                      <Text style={{ color: tx.delta >= 0 ? colors.accent : colors.danger,
                                     fontWeight: "700", fontSize: 16 }}>
                        {tx.delta >= 0 ? `+${tx.delta}` : tx.delta}
                      </Text>
                      <Text style={{ marginLeft: "auto", color: colors.text,
                                     fontWeight: "600" }}>→ {tx.new_total} pts</Text>
                    </View>
                    <Text style={{ color: colors.sub, fontSize: 11, marginTop: 4 }}>
                      {new Date(tx.date).toLocaleString()}
                    </Text>
                  </View>
                ))
              }
            </ScrollView>
          </View>
        </View>
      </Modal>

    </View>
  );
}
