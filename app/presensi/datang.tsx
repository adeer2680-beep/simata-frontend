import React, { useEffect, useMemo, useState } from "react";
import { View, Text, TextInput, TouchableOpacity, StyleSheet, Alert, KeyboardAvoidingView, Platform, ScrollView } from "react-native";
import { Stack, useLocalSearchParams } from "expo-router";

const COLORS = {
  bg: "#ffffff",
  soft: "#eef4ff",
  card: "#f3f4f6",
  text: "#0f172a",
  sub: "#475569",
  brand: "#0ea5a3",
  border: "#e5e7eb",
};

const fmtDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(d.getDate()).padStart(2, "0")}`;
const fmtTime = (d = new Date()) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(2, "0")}`;

export default function PresensiDatang() {
  const { jenis: jenisParam } = useLocalSearchParams<{ jenis?: string }>();

  const [jenis, setJenis] = useState(jenisParam ?? "");
  const [nama, setNama] = useState("");
  const [unit, setUnit] = useState("");
  const [tanggal, setTanggal] = useState(fmtDate());
  const [waktu, setWaktu] = useState(fmtTime());
  const [jarak, setJarak] = useState("");

  // segarkan waktu ketika screen dibuka
  useEffect(() => {
    const id = setInterval(() => setWaktu(fmtTime()), 30_000);
    return () => clearInterval(id);
  }, []);

  const canSubmit = useMemo(() => jenis && nama && unit && tanggal && waktu, [jenis, nama, unit, tanggal, waktu]);

  const onSubmit = () => {
    if (!canSubmit) {
      Alert.alert("Lengkapi Data", "Harap isi Jenis, Nama, Unit, Tanggal, dan Waktu.");
      return;
    }
    // TODO: ganti Alert ini dengan request ke backend kamu
    Alert.alert("Presensi Datang", JSON.stringify({ jenis, nama, unit, tanggal, waktu, jarak }, null, 2));
  };

  return (
    <>
      <Stack.Screen options={{ title: "Presensi Datang" }} />
      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1, backgroundColor: COLORS.bg }}>
        <ScrollView contentContainerStyle={styles.container}>
          <Field label="Jenis Presensi">
            <TextInput value={jenis} onChangeText={setJenis} placeholder="Jenis Presensi" style={styles.input} placeholderTextColor={COLORS.sub} />
          </Field>

          <Field label="Nama">
            <TextInput value={nama} onChangeText={setNama} placeholder="Nama lengkap" style={styles.input} placeholderTextColor={COLORS.sub} />
          </Field>

          <Field label="Unit">
            <TextInput value={unit} onChangeText={setUnit} placeholder="Unit/Bagian" style={styles.input} placeholderTextColor={COLORS.sub} />
          </Field>

          <Field label="Tanggal">
            <TextInput value={tanggal} onChangeText={setTanggal} placeholder="YYYY-MM-DD" style={styles.input} placeholderTextColor={COLORS.sub} />
          </Field>

          <Field label="Waktu">
            <TextInput value={waktu} onChangeText={setWaktu} placeholder="HH:MM" style={styles.input} placeholderTextColor={COLORS.sub} />
          </Field>

          <Field label="Jarak (opsional)">
            <TextInput
              value={jarak}
              onChangeText={setJarak}
              placeholder="Jarak ke sekolah (km)"
              keyboardType="decimal-pad"
              style={styles.input}
              placeholderTextColor={COLORS.sub}
            />
          </Field>

          <TouchableOpacity style={[styles.button, !canSubmit && { opacity: 0.6 }]} activeOpacity={0.85} onPress={onSubmit}>
            <Text style={styles.buttonText}>Submit</Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.pill}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14 },
  fieldWrap: { gap: 8 },
  fieldLabel: { fontSize: 12, color: COLORS.sub, fontWeight: "600", marginLeft: 6 },
  pill: {
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: { fontSize: 16, color: COLORS.text },
  button: {
    marginTop: 8,
    backgroundColor: COLORS.brand,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
