import React, { useState, useEffect } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { useRouter } from "expo-router";

const COLORS = {
  bg: "#ffffff",
  card: "#f3f4f6",
  text: "#0f172a",
  sub: "#475569",
  brand: "#0ea5a3",
  border: "#e5e7eb",
};

export default function PresensiDatang() {
  const router = useRouter();
  const [nama, setNama] = useState("");
  const [unit, setUnit] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [waktu, setWaktu] = useState("");

  useEffect(() => {
    const now = new Date();
    setTanggal(now.toLocaleDateString("id-ID"));
    setWaktu(now.toLocaleTimeString("id-ID", { hour: "2-digit", minute: "2-digit" }));
  }, []);

  const handleSubmit = () => {
    Alert.alert("Berhasil", "Presensi Datang dicatat!");
    router.back();
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Presensi Datang</Text>
      </View>

      <View style={styles.form}>
        <TextInput placeholder="Nama" value={nama} onChangeText={setNama} style={styles.input} />
        <TextInput placeholder="Unit" value={unit} onChangeText={setUnit} style={styles.input} />
        <TextInput value={tanggal} editable={false} style={styles.input} />
        <TextInput value={waktu} editable={false} style={styles.input} />
        <TouchableOpacity style={styles.submitBtn} onPress={handleSubmit}>
          <Text style={styles.submitText}>Submit</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    padding: 16,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  form: { padding: 16 },
  input: { backgroundColor: COLORS.card, marginBottom: 12, padding: 12, borderRadius: 12 },
  submitBtn: { backgroundColor: COLORS.brand, padding: 14, borderRadius: 12, alignItems: "center" },
  submitText: { color: "#fff", fontWeight: "700" },
});
