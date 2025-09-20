// app/doa.tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ActivityIndicator,
  RefreshControl,
  Platform,
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

type DoaItem = {
  id: number | string;
  judul: string;
  arab: string;
  latin: string;
  artinya: string;
};

// Sesuaikan host sesuai platform (Android emulator ≠ localhost)
const API_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:8000/api/doa"
    : "http://localhost:8000/api/doa";

export default function DoaHarianScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DoaItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(API_URL);
      // Debug ringan (boleh dihapus nanti)
      // console.log("[DOA] status:", res.status);

      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();

      // >>>> PARSING DISINI DIBUAT MATCH BACKEND KAMU <<<<
      // Backend kamu: { local: [...] }
      // Tetap dukung bentuk lain kalau suatu saat berubah
      let items: DoaItem[] = [];
      if (Array.isArray(json)) items = json;
      else if (Array.isArray(json?.local)) items = json.local;       // <— penting
      else if (Array.isArray(json?.data)) items = json.data;
      else if (Array.isArray(json?.results)) items = json.results;

      setData(items);
    } catch (e: any) {
      console.error("Fetch doa error:", e?.message ?? e);
      setError("Gagal memuat data doa. Tarik untuk refresh.");
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  }, []);

  useEffect(() => {
    load();
  }, [load]);

  const onRefresh = useCallback(() => {
    setRefreshing(true);
    load();
  }, [load]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color={COLORS.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Doa Harian</Text>
      </View>

      {/* Konten */}
      {loading ? (
        <ActivityIndicator style={{ marginTop: 20 }} size="large" color={COLORS.sub} />
      ) : error ? (
        <View style={{ padding: 16 }}>
          <Text style={{ color: "red", marginBottom: 8 }}>{error}</Text>
          <TouchableOpacity onPress={load} style={styles.retryBtn}>
            <Text style={{ color: "#fff", fontWeight: "700" }}>Coba Lagi</Text>
          </TouchableOpacity>
        </View>
      ) : (
        <FlatList
          data={data}
          keyExtractor={(item, i) => String(item.id ?? i)}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ItemSeparatorComponent={() => <View style={styles.separator} />}
          renderItem={({ item, index }) => (
            <View style={styles.itemWrap}>
              {/* nomor */}
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{index + 1}</Text>
              </View>

              {/* konten doa */}
              <View style={{ flex: 1 }}>
                <Text style={styles.title}>{item.judul}</Text>
                <Text style={styles.arab}>{item.arab}</Text>
                <Text style={styles.latin}>{item.latin}</Text>
                <Text style={styles.meaning}>{item.artinya}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ padding: 16, color: COLORS.sub }}>Belum ada data doa.</Text>
          }
        />
      )}
    </View>
  );
}

const styles = StyleSheet.create({
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

  itemWrap: { flexDirection: "row", paddingVertical: 14 },
  badge: {
    width: 28,
    height: 28,
    borderRadius: 6,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 12,
  },
  badgeText: { fontWeight: "700", color: COLORS.text, fontSize: 12 },

  title: { fontSize: 14, fontWeight: "700", color: COLORS.text, marginBottom: 6 },
  arab: { fontSize: 18, color: COLORS.text, textAlign: "right", marginBottom: 6, lineHeight: 28 },
  latin: { fontSize: 13, color: COLORS.sub, fontStyle: "italic", marginBottom: 4, lineHeight: 20 },
  meaning: { fontSize: 13, color: COLORS.text, lineHeight: 20 },

  separator: { height: 1, backgroundColor: COLORS.border },
  retryBtn: {
    alignSelf: "flex-start",
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    backgroundColor: COLORS.brand,
  },
});
