import { router, Stack } from "expo-router";
import React, { useCallback, useEffect, useState } from "react";
import {
  ActivityIndicator,
  FlatList,
  Platform,
  Pressable,
  RefreshControl,
  StyleSheet,
  Text,
  View,
  TouchableOpacity,
} from "react-native";
import { SafeAreaView } from "react-native-safe-area-context";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

const API_URL = "https://equran.id/api/v2/surat";
const CACHE_KEY = "@equran/surah_list_v2";
const TIMEOUT_MS = 10000;
const RETRIES = 3;

type Surah = {
  nomor: number;
  nama: string;        // Arabic
  namaLatin: string;
  jumlahAyat: number;
  tempatTurun: string;
  arti: string;
  deskripsi?: string;
  audioFull?: Record<string, string>;
};

type ApiResp = { code: number; message: string; data: Surah[] };
type CacheShape = { data: Surah[]; ts: number };

// ---------- Utilities sinkronisasi ----------
function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}
async function fetchWithTimeout(url: string, opts: RequestInit = {}, timeoutMs = TIMEOUT_MS) {
  const controller = new AbortController();
  const id = setTimeout(() => controller.abort(), timeoutMs);
  try {
    const res = await fetch(url, { ...opts, signal: controller.signal });
    clearTimeout(id);
    return res;
  } catch (e) {
    clearTimeout(id);
    throw e;
  }
}
function formatClock(ts?: number | null) {
  if (!ts) return "—";
  const d = new Date(ts);
  const hh = String(d.getHours()).padStart(2, "0");
  const mm = String(d.getMinutes()).padStart(2, "0");
  return `${hh}:${mm}`;
}

// ---------- Screen ----------
export default function SurahListScreen() {
  const [data, setData] = useState<Surah[]>([]);
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // status sinkronisasi
  const [isStale, setIsStale] = useState(false);
  const [lastSyncAt, setLastSyncAt] = useState<number | null>(null);
  const [syncing, setSyncing] = useState(false);

  // Load sinkronis: retry + timeout + cache
  const load = useCallback(async () => {
    if (syncing) return;
    setSyncing(true);
    setError(null);
    if (data.length === 0) setLoading(true);

    try {
      let lastErr: any = null;
      for (let attempt = 1; attempt <= RETRIES; attempt++) {
        try {
          const res = await fetchWithTimeout(API_URL, { headers: { Accept: "application/json" } });
          if (!res.ok) throw new Error(`HTTP ${res.status}`);
          const json: ApiResp = await res.json();
          if (json?.code !== 200 || !Array.isArray(json?.data)) {
            throw new Error(json?.message || "Format API tidak sesuai");
          }
          setData(json.data);
          setIsStale(false);
          const now = Date.now();
          setLastSyncAt(now);
          await AsyncStorage.setItem(CACHE_KEY, JSON.stringify({ data: json.data, ts: now } as CacheShape));
          lastErr = null;
          break;
        } catch (e: any) {
          lastErr = e;
          const backoff = 600 * attempt;
          await sleep(backoff);
        }
      }

      if (lastErr) {
        const cached = await AsyncStorage.getItem(CACHE_KEY);
        if (cached) {
          const parsed: CacheShape = JSON.parse(cached);
          setData(parsed.data || []);
          setIsStale(true);
          setLastSyncAt(parsed.ts || null);
          setError("Menampilkan data terakhir (offline).");
        } else {
          setError(lastErr?.message || "Gagal memuat data");
        }
      }
    } catch (e: any) {
      const cached = await AsyncStorage.getItem(CACHE_KEY);
      if (cached) {
        const parsed: CacheShape = JSON.parse(cached);
        setData(parsed.data || []);
        setIsStale(true);
        setLastSyncAt(parsed.ts || null);
        setError("Menampilkan data terakhir (offline).");
      } else {
        setError(e?.message || "Gagal memuat data");
      }
    } finally {
      setLoading(false);
      setRefreshing(false);
      setSyncing(false);
    }
  }, [data.length, syncing]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await load();
  }, [load]);

  useEffect(() => {
    load();
  }, [load]);

  // Loading overlay awal
  if (loading && !refreshing && data.length === 0) {
    return (
      <SafeAreaView style={styles.fill}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.fill, styles.center]}>
          <ActivityIndicator size="large" />
          <Text style={styles.loadingText}>Memuat daftar surah…</Text>
        </View>
      </SafeAreaView>
    );
  }

  // Error tanpa cache
  if (error && data.length === 0 && !isStale) {
    return (
      <SafeAreaView style={styles.fill}>
        <Stack.Screen options={{ headerShown: false }} />
        <View style={[styles.fill, styles.center, { padding: 16 }]}>
          <Text style={styles.errTitle}>Gagal memuat</Text>
          <Text style={styles.errSub}>{error}</Text>
          <Pressable style={[styles.btn, { marginTop: 14 }]} onPress={load}>
            <Text style={styles.btnText}>Coba Lagi</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.fill} edges={["left", "right", "bottom", "top"]}>
      <Stack.Screen options={{ headerShown: false }} />

      {/* ===== Header kustom: warna #42909b + tombol back bulat ===== */}
      <View style={styles.headerWrap}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={styles.backCircle}
          activeOpacity={0.7}
          hitSlop={{ top: 8, bottom: 8, left: 8, right: 8 }}
        >
          <Ionicons
            name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"}
            size={18}
            color="#000"
          />
        </TouchableOpacity>

        <View style={{ flex: 1 }}>
          <Text style={styles.headerTitle}>Daftar Surah</Text>
          <Text style={styles.headerSub}>
            114 surah • Al-Qur’an{lastSyncAt ? ` • Sinkron ${formatClock(lastSyncAt)}` : ""}
          </Text>
        </View>

        <Pressable
          style={[styles.btnSync, syncing && { opacity: 0.6 }]}
          onPress={load}
          disabled={syncing}
          android_ripple={{ color: "#d1f4f2" }}
        >
          <Text style={styles.btnSyncText}>{syncing ? "Sinkron…" : "Sinkronkan"}</Text>
        </Pressable>
      </View>

      {/* Banner status bila data stale / error tapi ada cache */}
      {(isStale || (error && data.length > 0)) && (
        <View style={styles.banner}>
          <Text style={styles.bannerText}>
            {isStale ? "Offline: menampilkan data terakhir." : error}
          </Text>
          <Pressable onPress={load} hitSlop={8}>
            <Text style={styles.bannerLink}>Coba sinkronkan</Text>
          </Pressable>
        </View>
      )}

      <FlatList
        data={data}
        keyExtractor={(it) => String(it.nomor)}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        contentContainerStyle={styles.listContent}
        renderItem={({ item }) => <SurahCard item={item} />}
        ItemSeparatorComponent={() => <View style={{ height: 10 }} />}
        ListFooterComponent={<View style={{ height: 16 }} />}
      />
    </SafeAreaView>
  );
}

function SurahCard({ item }: { item: Surah }) {
  return (
    <Pressable
      style={styles.card}
      onPress={() =>
        router.push({
          pathname: "/surah/[nomor]",
          params: { nomor: String(item.nomor) },
        })
      }
      android_ripple={{ color: "#e2f5f4" }}
    >
      <View style={styles.noWrap}>
        <Text style={styles.noText}>{item.nomor}</Text>
      </View>

      <View style={{ flex: 1 }}>
        <Text style={styles.namaArab} numberOfLines={1}>
          {item.nama}
        </Text>
        <Text style={styles.namaLatin} numberOfLines={1}>
          {item.namaLatin}
        </Text>
        <Text style={styles.meta} numberOfLines={2}>
          {item.jumlahAyat} ayat • {item.arti}
        </Text>
      </View>
    </Pressable>
  );
}

const BRAND = "#42909b";

const styles = StyleSheet.create({
  fill: { flex: 1, backgroundColor: "#f8fafc" },
  center: { alignItems: "center", justifyContent: "center" },

  // HEADER
  headerWrap: {
    flexDirection: "row",
    alignItems: "center",
    gap: 10,
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 8, android: 10, default: 10 }),
    paddingBottom: 10,
    backgroundColor: BRAND,
  },
  backCircle: {
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#e7f1f3",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "800",
    color: "#fff",
  },
  headerSub: {
    color: "#f1f5f9",
    marginTop: 2,
    fontWeight: "600",
    fontSize: 12,
    opacity: 0.95,
  },
  btnSync: {
    backgroundColor: "#e7f1f3",
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: "#ffffff55",
  },
  btnSyncText: { color: "#0f172a", fontWeight: "800", fontSize: 12 },

  // BANNER
  banner: {
    marginHorizontal: 16,
    marginTop: 8,
    marginBottom: 6,
    paddingHorizontal: 12,
    paddingVertical: 8,
    borderRadius: 12,
    backgroundColor: "#fff7ed",
    borderWidth: 1,
    borderColor: "#ffedd5",
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    gap: 10,
  },
  bannerText: { color: "#9a3412", fontSize: 12, fontWeight: "700" },
  bannerLink: { color: BRAND, fontSize: 12, fontWeight: "800" },

  // LIST
  listContent: { paddingHorizontal: 16, paddingTop: 8 },
  card: {
    flexDirection: "row",
    gap: 12,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 12,
    alignItems: "center",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.08,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: { elevation: 2 },
      default: {},
    }),
  },
  noWrap: {
    width: 40,
    height: 40,
    borderRadius: 999,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: `${BRAND}11`,
    borderWidth: 1,
    borderColor: `${BRAND}33`,
  },
  noText: { color: BRAND, fontWeight: "800" },
  namaArab: { fontSize: 18, color: "#0f172a", fontWeight: "800", textAlign: "left" },
  namaLatin: { fontSize: 13, color: "#0f172a", fontWeight: "700", marginTop: 2 },
  meta: { fontSize: 12, color: "#64748b", fontWeight: "600", marginTop: 4 },

  // MISC
  loadingText: { marginTop: 8, color: "#0f172a", fontWeight: "600" },
  errTitle: { fontSize: 18, fontWeight: "800", color: "#0f172a" },
  errSub: { color: "#64748b", marginTop: 6, textAlign: "center" },

  btn: {
    backgroundColor: BRAND,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
  },
  btnText: { color: "#fff", fontWeight: "800" },

  // (btnMini lama diganti dengan btnSync khusus header)
});
