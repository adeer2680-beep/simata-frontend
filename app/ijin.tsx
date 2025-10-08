// app/ijin.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  Alert, Platform, StatusBar, ToastAndroid, KeyboardAvoidingView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";
import AsyncStorage from "@react-native-async-storage/async-storage";

const C = {
  bg: "#ffffff",
  text: "#0f172a",
  sub: "#475569",
  border: "#e5e7eb",
  pill: "#f3f4f6",
  brand: "#42909b",
  brandDim: "#77c3cc",
} as const;

// ====== API BASE (sesuaikan dengan environment kamu) ======
// Emulator Android: 10.0.2.2 -> host komputer
// Device fisik: GANTI ke IP LAN laptop kamu, mis. "192.168.1.10"
const HOST =
  Platform.OS === "android"
    ? "10.0.2.2"   // emulator Android
    : "localhost"; // iOS simulator / Mac

const API_URL = `http://${HOST}:8000/api/ijins`;

// Helper: YYYY-MM-DD
function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const day = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// Notifikasi (foreground)
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function IjinScreen() {
  const [nama, setNama] = useState("");
  const [unitId, setUnitId] = useState(""); // ← WAJIB angka (exists:units,id)
  const [tanggal, setTanggal] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [loading, setLoading] = useState(false);

  // Minta izin notifikasi + channel Android
  useEffect(() => {
    (async () => {
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") await Notifications.requestPermissionsAsync();
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
        });
      }
    })();
  }, []);

  // Auto-isi tanggal hari ini
  useEffect(() => {
    setTanggal(toISODate(new Date()));
  }, []);

  // 🔹 Auto-isi dari user yang sudah login (auth.user)
  useEffect(() => {
    (async () => {
      try {
        const raw = await AsyncStorage.getItem("auth.user");
        if (!raw) return;
        const u = JSON.parse(raw);
        setNama(u?.nama ?? u?.username ?? "");
        if (u?.unit_id != null) setUnitId(String(u.unit_id));
      } catch {}
    })();
  }, []);

  const unitIsValidNumber = useMemo(() => {
    if (!unitId.trim()) return false;
    const n = Number(unitId);
    return Number.isInteger(n) && n > 0;
  }, [unitId]);

  const fireSuccessNotification = async (p: { nama: string; tanggal: string }) => {
    try {
      await Notifications.scheduleNotificationAsync({
        content: { title: "Izin terkirim ✅", body: `${p.nama} • ${p.tanggal}` },
        trigger: null,
      });
    } catch {
      if (Platform.OS === "android") {
        ToastAndroid.show("Izin terkirim", ToastAndroid.SHORT);
      }
    }
  };

  const handleSubmit = async () => {
    if (!nama.trim() || !unitIsValidNumber || !tanggal.trim()) {
      Alert.alert("Lengkapi Data", "Nama, Unit ID (angka), dan Tanggal wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      // Sertakan token jika rute diproteksi sanctum/passport
      const token = (await AsyncStorage.getItem("auth.token")) ?? "";

      const payload = {
        nama: nama.trim(),
        unit_id: Number(unitId),     // ✅ sesuai validator backend
        tanggal: tanggal.trim(),     // ✅ 'date'
        keterangan: keterangan.trim() || null, // ✅ nullable
      };

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });

      const raw = await res.text();
      console.log("[IJIN][POST]", res.status, raw); // DEBUG: lihat di Metro log

      if (!res.ok) {
        if (res.status === 422) {
          try {
            const j = JSON.parse(raw);
            const msgs = j?.errors
              ? (Object.values(j.errors) as string[][]).flat().join("\n")
              : j?.message || "Validasi gagal (422).";
            throw new Error(msgs);
          } catch {
            throw new Error("Validasi gagal (422).");
          }
        }
        throw new Error(`HTTP ${res.status} – ${raw}`);
      }

      await fireSuccessNotification({ nama, tanggal });
      Alert.alert("Berhasil", "Pengajuan izin telah dikirim.");

      // Reset form
      setNama("");
      setUnitId("");
      setKeterangan("");
      setTanggal(toISODate(new Date()));

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
      <StatusBar barStyle="light-content" backgroundColor={C.brand} />

      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Izin</Text>
      </View>

      <KeyboardAvoidingView behavior={Platform.OS === "ios" ? "padding" : undefined} style={{ flex: 1 }}>
        <ScrollView
          contentContainerStyle={{ padding: 16 }}
          keyboardShouldPersistTaps="handled"   // ⬅️ tombol submit tetap klik saat keyboard terbuka
        >
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

          {/* Unit ID (HARUS angka) */}
          <View style={s.pill}>
            <TextInput
              placeholder="Unit ID (angka, contoh: 1)"
              placeholderTextColor={C.sub}
              value={unitId}
              onChangeText={setUnitId}
              style={s.input}
              keyboardType="number-pad"
            />
          </View>

          {/* Tanggal */}
          <View style={s.pill}>
            <TextInput
              placeholder="Tanggal (YYYY-MM-DD)"
              placeholderTextColor={C.sub}
              value={tanggal}
              onChangeText={setTanggal}
              style={s.input}
            />
          </View>

          {/* Keterangan (opsional) */}
          <View style={s.pill}>
            <TextInput
              placeholder="Keterangan (opsional)"
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
            style={[
              s.submitBtn,
              (!nama.trim() || !unitIsValidNumber || !tanggal.trim() || loading) && { backgroundColor: C.brandDim },
            ]}
          >
            <Text style={s.submitText}>{loading ? "Mengirim..." : "Submit"}</Text>
          </TouchableOpacity>

          <View style={{ height: 24 }} />
        </ScrollView>
      </KeyboardAvoidingView>
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
    backgroundColor: C.brand,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: "#fff", flex: 1 },

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
