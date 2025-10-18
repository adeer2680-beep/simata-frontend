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
  SafeAreaView,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const COLORS = {
  brand: "#42909b",
  bg: "#ffffff",
  text: "#0f172a",
  sub: "#475569",
  border: "#e5e7eb",
  card: "#f3f4f6",
};

type DoaItem = {
  id: number | string;
  judul: string;
  arab: string;
  latin: string;
  artinya: string;
};

const API_BASE =
  Platform.OS === "android" ? "http://10.29.82.182/aplikasi_simata/public/api" : "http://localhost:8000/api";

const API_LIST = `${API_BASE}/doa`; // GET daftar doa

export default function DoaHarianScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DoaItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  const normalizeList = (json: any): DoaItem[] => {
    if (Array.isArray(json)) return json;
    if (Array.isArray(json?.data)) return json.data;
    if (Array.isArray(json?.results)) return json.results;
    if (Array.isArray(json?.local)) return json.local;
    return [];
  };

  const load = useCallback(async () => {
    setError(null);
    try {
      const res = await fetch(API_LIST);
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json = await res.json();
      setData(normalizeList(json));
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

  const Header = (
    <View style={s.header}>
      <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85} style={s.backBtn}>
        <Ionicons name="chevron-back" size={22} color="#000" />
      </TouchableOpacity>
      <Text style={s.headerTitle}>Doa Harian</Text>
      <View style={{ width: 38 }} />
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      {Header}

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
          keyExtractor={(item, i) => String(item.id ?? i)}
          contentContainerStyle={{ padding: 16 }}
          refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
          ItemSeparatorComponent={() => <View style={s.separator} />}
          renderItem={({ item, index }) => (
            <View style={s.itemWrap}>
              <View style={s.badge}>
                <Text style={s.badgeText}>{index + 1}</Text>
              </View>
              <View style={{ flex: 1 }}>
                <Text style={s.title}>{item.judul}</Text>
                <Text style={s.arab}>{item.arab}</Text>
                <Text style={s.latin}>{item.latin}</Text>
                <Text style={s.meaning}>{item.artinya}</Text>
              </View>
            </View>
          )}
          ListEmptyComponent={
            <Text style={{ padding: 16, color: COLORS.sub }}>Belum ada data doa.</Text>
          }
        />
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },

  // Header seragam
  header: {
    backgroundColor: COLORS.brand,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // List
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
