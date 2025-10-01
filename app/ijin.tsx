// app/ijin.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  ScrollView,
  Alert,
  Platform,
  StatusBar,
  ToastAndroid,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import * as Notifications from "expo-notifications";

const C = {
  bg: "#ffffff",
  text: "#0f172a",
  sub: "#475569",
  border: "#e5e7eb",
  pill: "#f3f4f6",
  brand: "#42909b",
  brandDim: "#77c3cc",
};

// ✅ pakai /ijins (jamak)
const API_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:8000/api/ijins"
    : "http://localhost:8000/api/ijins";

// Helper: format tanggal ISO YYYY-MM-DD
function toISODate(d: Date) {
  const y = d.getFullYear();
  const m = `${d.getMonth() + 1}`.padStart(2, "0");
  const day = `${d.getDate()}`.padStart(2, "0");
  return `${y}-${m}-${day}`;
}

// --- ganti blok setNotificationHandler lama ---
Notifications.setNotificationHandler({
  handleNotification: async () => ({
    // tampilkan banner saat app foreground
    shouldShowBanner: true,
    shouldShowList: true,
    shouldPlaySound: false,
    shouldSetBadge: false,
  }),
});

export default function IjinScreen() {
  const [nama, setNama] = useState("");
  const [unit, setUnit] = useState("");
  const [tanggal, setTanggal] = useState("");
  const [keterangan, setKeterangan] = useState("");
  const [loading, setLoading] = useState(false);

  // Minta izin notifikasi + channel Android
  useEffect(() => {
    (async () => {
      // ijin
      const { status } = await Notifications.getPermissionsAsync();
      if (status !== "granted") {
        await Notifications.requestPermissionsAsync();
      }
      // channel untuk Android
      if (Platform.OS === "android") {
        await Notifications.setNotificationChannelAsync("default", {
          name: "default",
          importance: Notifications.AndroidImportance.MAX,
        });
      }
    })();
  }, []);

  // Auto-isi tanggal hari ini (ISO)
  useEffect(() => {
    setTanggal(toISODate(new Date()));
  }, []);

  const isUnitNumeric = useMemo(
    () => unit.trim() !== "" && !Number.isNaN(Number(unit)),
    [unit]
  );

  const fireSuccessNotification = async (payload: {
    nama: string;
    tanggal: string;
  }) => {
    // Notifikasi sistem (Expo)
    try {
      await Notifications.scheduleNotificationAsync({
        content: {
          title: "Izin terkirim ✅",
          body: `${payload.nama} • ${payload.tanggal}`,
        },
        trigger: null, // segera tampil
      });
    } catch {
      // Fallback toast Android kalau module/izin gagal
      if (Platform.OS === "android") {
        ToastAndroid.show("Izin terkirim", ToastAndroid.SHORT);
      }
    }
  };

  const handleSubmit = async () => {
    if (!nama || !unit || !tanggal || !keterangan) {
      Alert.alert("Lengkapi Data", "Semua field wajib diisi.");
      return;
    }

    try {
      setLoading(true);

      // Payload fleksibel
      const payload: Record<string, any> = {
        nama: nama.trim(),
        tanggal: tanggal.trim(), // ISO
        keterangan: keterangan.trim(),
      };
      if (isUnitNumeric) {
        payload.unit_id = Number(unit);
      } else {
        payload.unit = unit.trim();
      }

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const j = JSON.parse(text);
          msg += j?.pesan ? ` – ${j.pesan}` : "";
          if (j?.errors) {
            const firstErr =
              (Array.isArray(Object.values(j.errors)) &&
                (Object.values(j.errors) as any[]).flat?.()[0]) ||
              JSON.stringify(j.errors);
            msg += firstErr ? `\n${firstErr}` : "";
          }
        } catch {
          msg += ` – ${text}`;
        }
        throw new Error(msg);
      }

      // Notifikasi & alert sukses
      await fireSuccessNotification({ nama, tanggal });
      Alert.alert("Berhasil", "Pengajuan izin telah dikirim.");

      // (opsional) reset form
      setKeterangan("");
      setUnit("");
      setNama("");
      setTanggal(toISODate(new Date()));

      // Kembali ke layar sebelumnya
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
            placeholder="Unit (isi ID atau nama)"
            placeholderTextColor={C.sub}
            value={unit}
            onChangeText={setUnit}
            style={s.input}
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
