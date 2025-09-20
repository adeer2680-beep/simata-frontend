// app/ijin.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const C = {
  bg: "#ffffff",
  text: "#0f172a",
  sub: "#475569",
  border: "#e5e7eb",
  pill: "#f3f4f6",
  brand: "#0ea5a3",
  brandDim: "#86e6e3",
};

const API_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:8000/api/ijin" // Android emulator
    : "http://localhost:8000/api/ijin"; // Web/iOS sim

export default function IjinScreen() {
  const [nama, setNama] = useState("");
  const [unit, setUnit] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [loading, setLoading] = useState(false);

  // Auto-isi tanggal hari ini (format ID)
  useEffect(() => {
    const now = new Date();
    setTanggal(
      now.toLocaleDateString("id-ID", {
        year: "numeric",
        month: "2-digit",
        day: "2-digit",
      })
    );
  }, []);

  const handleSubmit = async () => {
    if (!nama || !unit || !tanggal || !keterangan) {
      Alert.alert("Lengkapi Data", "Semua field wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      // Kirim ke backend — sesuaikan field dengan backend kamu
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          nama,
          unit,
          tanggal,     // kalau backend butuh ISO, kirim new Date().toISOString().slice(0,10)
          keterangan,
        }),
      });

      if (!res.ok) {
        const body = await res.text();
        throw new Error(`HTTP ${res.status} ${body}`);
      }

      Alert.alert("Berhasil", "Pengajuan izin telah dikirim.");
      router.back();
    } catch (e: any) {
      console.error(e);
      Alert.alert("Gagal", e?.message ?? "Tidak bisa mengirim data.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Ijin</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Nama */}
        <View style={s.pill}>
          <TextInput
            placeholder="Nama"
            placeholderTextColor={C.sub}
            value={nama}
            onChangeText={setNama}
            style={s.input}
          />
        </View>

        {/* Unit */}
        <View style={s.pill}>
          <TextInput
            placeholder="Unit"
            placeholderTextColor={C.sub}
            value={unit}
            onChangeText={setUnit}
            style={s.input}
          />
        </View>

        {/* Tanggal */}
        <View style={s.pill}>
          <TextInput
            placeholder="Tanggal"
            placeholderTextColor={C.sub}
            value={tanggal}
            onChangeText={setTanggal}
            style={s.input}
          />
        </View>

        {/* Keterangan */}
        <View style={s.pill}>
          <TextInput
            placeholder="Keterangan"
            placeholderTextColor={C.sub}
            value={keterangan}
            onChangeText={setKeterangan}
            style={[s.input, { height: 100, textAlignVertical: "top" }]}
            multiline
          />
        </View>

        {/* Submit */}
        <TouchableOpacity
          onPress={handleSubmit}
          disabled={loading}
          style={[s.submitBtn, loading && { backgroundColor: C.brandDim }]}
        >
          <Text style={s.submitText}>{loading ? "Mengirim..." : "Submit"}</Text>
        </TouchableOpacity>

        <View style={{ height: 24 }} />
      </ScrollView>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
    backgroundColor: C.bg,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.text },

  pill: {
    backgroundColor: C.pill,
    borderRadius: 999,
    paddingHorizontal: 18,
    paddingVertical: 10,
    marginBottom: 12,
  },
  input: {
    color: C.text,
    fontSize: 14,
  },

  submitBtn: {
    backgroundColor: C.brand,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 8,
  },
  submitText: { color: "#fff", fontWeight: "700" },
});
