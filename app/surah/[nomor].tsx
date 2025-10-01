// app/surah/[nomor].tsx
import React, { useCallback, useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  RefreshControl,
  Platform,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import { Stack, useLocalSearchParams } from "expo-router";

const API_BASE = "https://equran.id/api/v2/surat";

type Ayat = {
  nomorAyat: number;
  teksArab: string;
  teksLatin: string;
  teksIndonesia: string;
  audio?: Record<string, string>;
};

type SurahDetail = {
  nomor: number;
  nama: string;       // Arabic name
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: string;
  arti: string;
  deskripsi?: string;
  audioFull?: Record<string, string>;
  ayat: Ayat[];
};

type ApiResp = {
  code: number;
  message: string;
  data: SurahDetail;
};

export default function SurahDetailScreen() {
  const { nomor } = useLocalSearchParams<{ nomor?: string }>();
  const surahNo = Number(nomor);
  const [data, setData] = useState<SurahDetail | null>(null);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const load = useCallback(async () => {
    if (!surahNo || Number.isNaN(surahNo)) {
      setError("Parameter nomor surah tidak valid.");
      setLoading(false);
      return;
    }
    setError(null);
    setLoading(true);
    try {
      const res = await fetch(`${API_BASE}/${surahNo}`, { headers: { Accept: "application/json" } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const json: ApiResp = await res.json();
      if (json?.code !== 200 || !json?.data) throw new Error(json?.message || "Format API tidak sesuai");
      setData(json.data);
    } catch (e: any) {
      setError(e?.message || "Gagal memuat detail surah");
    } finally {
      setLoading(false);
    }
  }, [surahNo]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    try { await load(); } finally { setRefreshing(false); }
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  // Loading
  if (loading && !refreshing && !data) {
    return (
      <SafeAreaView style={styles.fill}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.fill, styles.center]}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Memuat detail surah…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error
  if (error && !data) {
    return (
      <SafeAreaView style={styles.fill}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.fill, styles.center, { padding: 16 }]}>
          <Text style={styles.errTitle}>Gagal memuat</Text>
          <Text style={styles.errSub}>{error}</Text>
        </View>
      </SafeAreaView>
    );
  }

  const surah = data!;
  return (
    <SafeAreaView style={styles.fill} edges={["left", "right", "bottom"]}>
      <Stack.Screen options={{ headerShown: false }} />
      <ScrollView
        style={styles.fill}
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        {/* Header Surah */}
        <View style={styles.headerCard}>
          <View style={styles.headerRow}>
            <View style={styles.noWrap}>
              <Text style={styles.noText}>{surah.nomor}</Text>
            </View>
            <View style={{ flex: 1 }}>
              <Text style={styles.namaArab} numberOfLines={1}>{surah.nama}</Text>
              <Text style={styles.namaLatin} numberOfLines={1}>
                {surah.namaLatin} • {surah.jumlahAyat} ayat • {surah.arti}
              </Text>
              <Text style={styles.metaTop} numberOfLines={1}>
                {surah.tempatTurun}
              </Text>
            </View>
          </View>
        </View>

        {/* Daftar Ayat */}
        <View style={{ height: 10 }} />
        {surah.ayat.map((a) => (
          <View key={a.nomorAyat} style={styles.ayatCard}>
            <View style={styles.ayatHeader}>
              <View style={styles.ayatNoBubble}>
                <Text style={styles.ayatNoText}>{a.nomorAyat}</Text>
              </View>
            </View>

            <Text
              style={styles.arab}
              // Dirancang agar enak dibaca: rata kanan & mendekati RTL
              numberOfLines={0}
            >
              {a.teksArab}
            </Text>

            <Text style={styles.latin}>{a.teksLatin.trim()}</Text>

            <Text style={styles.indo}>{a.teksIndonesia.trim()}</Text>
          </View>
        ))}

        <View style={{ height: 18 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#f8fafc" },
  center: { alignItems: "center", justifyContent: "center" },
  content: { padding: 16 },

  headerCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.08, shadowRadius: 10, shadowOffset: { width: 0, height: 6 } },
      android: { elevation: 2 },
    }),
  },
  headerRow: { flexDirection: "row", alignItems: "center", gap: 12 },
  noWrap: {
    width: 44, height: 44, borderRadius: 999,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#0ea5a311", borderWidth: 1, borderColor: "#0ea5a333",
  },
  noText: { color: "#0ea5a3", fontWeight: "800" },

  namaArab: { fontSize: 22, color: "#0f172a", fontWeight: "800" },
  namaLatin: { marginTop: 2, fontSize: 13, color: "#0f172a", fontWeight: "700" },
  metaTop: { marginTop: 2, fontSize: 12, color: "#64748b", fontWeight: "600" },

  ayatCard: {
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 14,
    marginBottom: 10,
    ...Platform.select({
      ios: { shadowColor: "#000", shadowOpacity: 0.05, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
      android: { elevation: 1 },
    }),
  },
  ayatHeader: { flexDirection: "row", alignItems: "center", marginBottom: 8 },
  ayatNoBubble: {
    width: 30, height: 30, borderRadius: 999,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "#e2f5f4",
    borderWidth: 1, borderColor: "#c7ecea",
  },
  ayatNoText: { color: "#0ea5a3", fontWeight: "800" },

  arab: {
    fontSize: 22,
    color: "#0f172a",
    textAlign: "right",
    lineHeight: 34,
    // untuk Android agar baseline rapi
    includeFontPadding: false,
  },
  latin: {
    marginTop: 8,
    fontSize: 14,
    color: "#0f172a",
    fontStyle: "italic",
  },
  indo: {
    marginTop: 6,
    fontSize: 13,
    color: "#475569",
    fontWeight: "600",
  },

  loadingText: { marginTop: 8, color: "#0f172a", fontWeight: "600" },
  errTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  errSub: { color: "#64748b", marginTop: 6, textAlign: "center" },
});
