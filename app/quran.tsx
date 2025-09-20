// app/quran.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  FlatList, ActivityIndicator, RefreshControl, Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const COLORS = {
  bg: "#ffffff",
  text: "#0f172a",
  sub: "#475569",
  border: "#e5e7eb",
  card: "#f3f4f6",
  brand: "#0ea5a3",
};

type Surah = {
  nomor: number;
  namaLatin: string;
  arab: string;
  arti: string;
  ayat: number;
};

// ✅ Pakai endpoint yang benar dari routes/api.php
const API_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:8000/api/quran/surat"   // Android emulator
    : "http://localhost:8000/api/quran/surat"; // Web/iOS sim

function normalizeEquran(x: any): Surah {
  // Respon equran v2: { nomor, nama, namaLatin/nama_latin, arti, jumlahAyat/jumlah_ayat, asma? }
  const nomor =
    Number(x.nomor ?? x.number ?? x.id ?? 0) || 0;

  const namaLatin =
    String(x.namaLatin ?? x.nama_latin ?? x.nama ?? `Surah ${nomor}`);

  const arab =
    String(x.asma?.ar ?? x.namaArab ?? x.nama_arab ?? x.arabic ?? "");

  const arti =
    String(x.arti ?? x.meaning ?? "");

  const ayat =
    Number(x.jumlahAyat ?? x.jumlah_ayat ?? x.ayat ?? x.verses ?? 0) || 0;

  return { nomor, namaLatin, arab, arti, ayat };
}

export default function QuranScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<Surah[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(API_URL);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      // Controller kamu return response equran apa adanya:
      // { code: 200, message: "OK", data: [...] }
      const arr: any[] = Array.isArray(json?.data)
        ? json.data
        : Array.isArray(json) ? json : [];

      const mapped = arr.map(normalizeEquran).sort((a, b) => a.nomor - b.nomor);
      setData(mapped);
    } catch (e: any) {
      console.error("Fetch quran error:", e?.message ?? e);
      setError("Gagal memuat data Al-Qur'an. Tarik untuk refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => { load(); }, [load]);
  const onRefresh = useCallback(() => { setRefreshing(true); load(); }, [load]);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Al-Qur’an</Text>
      </View>

      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} size="large" color={COLORS.sub} />
      ) : error ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: "red", marginBottom: 8 }}>{error}</Text>
          <TouchableOpacity onPress={load} style={s.retryBtn}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(x) => String(x.nomor)}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          renderItem={({ item }) => (
            <View style={s.itemRow}>
              {/* Badge nomor */}
              <View style={s.badge}>
                <Text style={s.badgeText}>{item.nomor}</Text>
              </View>

              {/* Nama & arti */}
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{item.namaLatin}</Text>
                <Text style={s.subtitle}>
                  {item.arti || "Arti surah"}{item.ayat ? ` (${item.ayat})` : ""}
                </Text>
              </View>

              {/* Nama Arab */}
              <Text style={s.arab} numberOfLines={1}>
                {item.arab || "—"}
              </Text>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ padding: 16, color: COLORS.sub }}>Belum ada data surah.</Text>
          }
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },

  itemRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingVertical: 12,
    gap: 12,
  },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  badgeText: { fontWeight: "700", color: COLORS.text, fontSize: 12 },

  title: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  subtitle: { fontSize: 12, color: COLORS.sub, marginTop: 2 },

  arab: { color: COLORS.text, fontSize: 18, textAlign: "right", minWidth: 64 },

  separator: { height: 1, backgroundColor: COLORS.border },

  retryBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.brand,
  },
});
