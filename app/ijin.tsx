// app/ijin.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput, ScrollView,
  Alert, Platform, StatusBar, KeyboardAvoidingView, ActivityIndicator,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

/**
 * ====== KONFIG API ======
 * - ANDROID EMULATOR => 10.0.2.2
 * - DEVICE FISIK / iOS SIMULATOR => pakai IP LAN laptop kamu
 */
const LAN_IP = "192.168.43.182"; // ganti sesuai IP LAN kamu
const USE_ANDROID_EMULATOR = true;

const HOST =
  Platform.OS === "android"
    ? (USE_ANDROID_EMULATOR ? "10.0.2.2" : LAN_IP)
    : LAN_IP;

const API_BASE = `http://10.29.82.182/aplikasi_simata/public/api`;
const IJIN_URL = `${API_BASE}/ijins`;

const C = {
  bg: "#ffffff",
  text: "#0f172a",
  sub: "#6b7280",
  pill: "#f3f4f6",
  border: "#e5e7eb",
  brand: "#42909b",
  brandDim: "#a9d5db",
  danger: "#ef4444",
} as const;

const toISODate = (d = new Date()) => {
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, "0");
  const dd = String(d.getDate()).padStart(2, "0");
  return `${y}-${m}-${dd}`;
};

type IjinItem = {
  id: number;
  unit_id: number;
  tanggal: string;
  keterangan: string | null;
  created_at?: string;
  updated_at?: string;
};

function safeJson(text: string) {
  try {
    return JSON.parse(text);
  } catch {
    return null;
  }
}

export default function IjinScreen() {
  const [unit_id, setUnitId] = useState("");
  const [unitLabel, setUnitLabel] = useState<string>("");
  const [tanggal, setTanggal] = useState(toISODate());
  const [keterangan, setKeterangan] = useState("");
  const [loading, setLoading] = useState(false);
  const [listLoading, setListLoading] = useState(false);
  const [items, setItems] = useState<IjinItem[]>([]);

  const unitValid = useMemo(() => {
    if (!unit_id.trim()) return false;
    const n = Number(unit_id);
    return Number.isInteger(n) && n > 0;
  }, [unit_id]);

  // === Ambil unit dari sesi login
  const loadUnitFromSession = async () => {
    try {
      const userStr = await AsyncStorage.getItem("auth.user");
      if (!userStr) return;
      const user = JSON.parse(userStr);
      const uid = Number(user?.unit_id ?? 0);
      if (uid > 0) setUnitId(String(uid));
      if (user?.unit) setUnitLabel(String(user.unit));

      // tampilkan log sesi
      if (__DEV__) {
        const token = await AsyncStorage.getItem("auth.token");
        console.log("🔐 Sesi Login Ditemukan:");
        console.log({
          tokenPreview: token ? token.slice(0, 15) + "..." : null,
          user,
        });
      }
    } catch (e) {
      console.log("❌ Gagal parsing sesi login:", e);
    }
  };

  // === Ambil header auth
  const getAuthHeader = async (): Promise<Record<string, string>> => {
    const token = await AsyncStorage.getItem("auth.token");
    if (!token) {
      Alert.alert("Sesi Habis", "Silakan login ulang.");
      router.replace("/login");
      return {};
    }
    return {
      "Content-Type": "application/json",
      Accept: "application/json",
      Authorization: `Bearer ${token}`,
    };
  };

  // === GET daftar ijin
  const fetchList = async () => {
    try {
      setListLoading(true);
      const headers = await getAuthHeader();
      if (!headers.Authorization) return;

      const res = await fetch(IJIN_URL, { headers });
      const raw = await res.text();
      if (!res.ok) throw new Error(`GET /ijin ${res.status} ${raw}`);
      const data = safeJson(raw);
      const arr = Array.isArray(data) ? data : data?.data ?? [];
      setItems(arr);
      if (__DEV__) console.log("📦 Data ijin:", arr);
    } catch (e: any) {
      console.log("❌ Fetch list failed:", e?.message);
    } finally {
      setListLoading(false);
    }
  };

  useEffect(() => {
    loadUnitFromSession();
    fetchList();
  }, []);

  // === POST form ijin
  const handleSubmit = async () => {
    if (!unitValid || !tanggal.trim()) {
      Alert.alert("Lengkapi Data", "Unit ID dan Tanggal wajib diisi.");
      return;
    }

    const body = {
      unit_id: Number(unit_id),
      tanggal: tanggal.trim(),
      keterangan: keterangan.trim() || null,
    };

    try {
      setLoading(true);
      const headers = await getAuthHeader();
      if (!headers.Authorization) return;

      console.log("➡️ [KIRIM IJIN]");
      console.log("URL:", IJIN_URL);
      console.log("Headers:", headers);
      console.log("Body:", body);

      const res = await fetch(IJIN_URL, {
        method: "POST",
        headers,
        body: JSON.stringify(body),
      });

      const raw = await res.text();
      const j = safeJson(raw);

      console.log("⬅️ [RESP IJIN]");
      console.log("Status:", res.status);
      console.log("Respon Text:", raw);
      console.log("Respon JSON:", j);

      if (res.status === 401 || res.status === 403) {
        Alert.alert("Sesi Habis", "Silakan login ulang.");
        router.replace("/login");
        return;
      }

      if (res.status === 422) {
        const err = j?.errors
          ? Object.entries(j.errors)
              .map(([key, val]) => `${key}: ${(val as string[]).join(", ")}`)
              .join("\n")
          : j?.message || raw;
        Alert.alert("Validasi Gagal", err);
        console.log("⚠️ 422 Error:", err);
        return;
      }

      if (!res.ok) {
        Alert.alert("Gagal Simpan", j?.message || raw);
        console.log("❌ Error:", j?.message || raw);
        return;
      }

      console.log("✅ Ijin berhasil disimpan ke database!");
      Alert.alert("Berhasil", "Ijin berhasil dikirim.");
      setKeterangan("");
      setTanggal(toISODate());
      await fetchList();
      router.back();
    } catch (e: any) {
      console.log("❌ Network / Fetch error:", e?.message);
      Alert.alert("Gagal", e?.message ?? "Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.container}>
      <StatusBar backgroundColor={C.brand} barStyle="light-content" />
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ paddingRight: 8 }}>
          <Ionicons name="arrow-back" size={22} color="#fff" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Form Ijin</Text>
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={{ padding: 16 }} keyboardShouldPersistTaps="handled">
          {/* Unit ID */}
          <View style={s.pill}>
            <TextInput
              placeholder="Unit ID (otomatis dari akun)"
              placeholderTextColor={C.sub}
              keyboardType="number-pad"
              value={unit_id}
              onChangeText={setUnitId}
              style={s.input}
              editable={false}
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
          <View style={[s.pill, { borderRadius: 16 }]}>
            <TextInput
              placeholder="Keterangan"
              placeholderTextColor={C.sub}
              value={keterangan}
              onChangeText={setKeterangan}
              style={[s.input, { height: 100, textAlignVertical: "top" }]}
              multiline
            />
          </View>

          <TouchableOpacity
            onPress={handleSubmit}
            disabled={loading || !unitValid || !tanggal.trim()}
            style={[
              s.submitBtn,
              (!unitValid || !tanggal.trim() || loading) && { backgroundColor: C.brandDim },
            ]}
          >
            {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.submitText}>Kirim Ijin</Text>}
          </TouchableOpacity>

          {/* Riwayat ijin */}
          <View style={{ marginTop: 24 }}>
            <Text style={s.sectionTitle}>Riwayat Ijin Saya</Text>
            {listLoading ? (
              <ActivityIndicator />
            ) : items.length === 0 ? (
              <Text style={{ color: C.sub, marginTop: 8 }}>Belum ada data.</Text>
            ) : (
              items.map((it) => (
                <View key={it.id} style={s.card}>
                  <View style={{ flexDirection: "row", alignItems: "center" }}>
                    <Ionicons name="document-text-outline" size={18} color={C.text} />
                    <Text style={s.cardTitle}>  #{it.id} • Unit {it.unit_id}</Text>
                  </View>
                  <Text style={s.cardSub}>Tanggal: {it.tanggal}</Text>
                  {it.keterangan ? <Text style={s.cardSub}>Keterangan: {it.keterangan}</Text> : null}
                </View>
              ))
            )}
          </View>

          <View style={{ height: 32 }} />
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
    backgroundColor: C.brand,
    paddingHorizontal: 16,
    paddingVertical: 12,
  },
  headerTitle: { color: "#fff", fontSize: 16, fontWeight: "700" },
  pill: {
    backgroundColor: C.pill,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 10,
    marginBottom: 12,
  },
  input: { color: C.text, fontSize: 14 },
  submitBtn: {
    backgroundColor: C.brand,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
  },
  submitText: { color: "#fff", fontWeight: "700" },
  sectionTitle: { fontSize: 14, fontWeight: "700", color: C.text },
  card: {
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
    marginTop: 10,
  },
  cardTitle: { color: C.text, fontWeight: "700" },
  cardSub: { color: C.sub, marginTop: 4, fontSize: 12 },
});
