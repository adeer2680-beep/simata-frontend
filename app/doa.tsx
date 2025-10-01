// app/doa.tsx (atau app/(tabs)/doa.tsx)
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
  TextInput,
  Alert,
  ToastAndroid,
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
  Platform.OS === "android" ? "http://10.0.2.2:8000/api" : "http://localhost:8000/api";

const API_LIST = `${API_BASE}/doa`;      // GET daftar doa
const API_CREATE = `${API_BASE}/doa`;    // POST tambah doa
// (opsional) detail: `${API_BASE}/doa/{id}`

const IS_ADMIN = true; // ganti ke false bila tidak mau tampilkan form tambah

export default function DoaHarianScreen() {
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);
  const [data, setData] = useState<DoaItem[]>([]);
  const [error, setError] = useState<string | null>(null);

  // state form tambah
  const [adding, setAdding] = useState(false);
  const [judul, setJudul] = useState("");
  const [arab, setArab] = useState("");
  const [latin, setLatin] = useState("");
  const [artinya, setArtinya] = useState("");
  const [submitting, setSubmitting] = useState(false);

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

  // submit tambah doa -> POST /api/doa
  const onSubmitAdd = async () => {
    if (!judul.trim() || !arab.trim() || !latin.trim() || !artinya.trim()) {
      Alert.alert("Lengkapi Data", "Semua field wajib diisi.");
      return;
    }
    try {
      setSubmitting(true);
      const res = await fetch(API_CREATE, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          // Authorization: `Bearer ${token}`, // aktifkan jika butuh auth
        },
        body: JSON.stringify({
          judul: judul.trim(),
          arab: arab.trim(),
          latin: latin.trim(),
          artinya: artinya.trim(),
        }),
      });

      const text = await res.text();
      if (!res.ok) {
        let msg = `HTTP ${res.status}`;
        try {
          const j = JSON.parse(text);
          if (j?.message) msg += ` – ${j.message}`;
          if (j?.errors) {
            const first =
              (Object.values(j.errors) as any[]).flat?.()[0] ?? JSON.stringify(j.errors);
            if (first) msg += `\n${first}`;
          }
        } catch {
          msg += ` – ${text}`;
        }
        throw new Error(msg);
      }

      // sukses
      if (Platform.OS === "android") {
        ToastAndroid.show("Doa berhasil ditambahkan", ToastAndroid.SHORT);
      } else {
        Alert.alert("Berhasil", "Doa berhasil ditambahkan");
      }

      // reset form & tutup panel
      setJudul(""); setArab(""); setLatin(""); setArtinya("");
      setAdding(false);

      // refresh list
      setLoading(true);
      await load();
    } catch (e: any) {
      console.error(e);
      Alert.alert("Gagal", e?.message ?? "Tidak bisa menambahkan doa.");
    } finally {
      setSubmitting(false);
    }
  };

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

      {/* Panel Tambah (Admin) */}
      {IS_ADMIN && (
        <View style={{ padding: 16, paddingBottom: 0 }}>
          {!adding ? (
            <TouchableOpacity onPress={() => setAdding(true)} style={s.addBtn}>
              <Ionicons name="add" size={18} color="#fff" />
              <Text style={{ color: "#fff", fontWeight: "700", marginLeft: 6 }}>Tambah Doa</Text>
            </TouchableOpacity>
          ) : (
            <View style={s.formBox}>
              <Text style={s.formTitle}>Tambah Doa</Text>

              <Text style={s.label}>Judul</Text>
              <TextInput
                value={judul}
                onChangeText={setJudul}
                placeholder="Doa sebelum belajar"
                placeholderTextColor={COLORS.sub}
                style={s.input}
              />

              <Text style={s.label}>Arab</Text>
              <TextInput
                value={arab}
                onChangeText={setArab}
                placeholder="اَللّٰهُمَّ..."
                placeholderTextColor={COLORS.sub}
                style={[s.input, { textAlign: "right" }]}
                multiline
              />

              <Text style={s.label}>Latin</Text>
              <TextInput
                value={latin}
                onChangeText={setLatin}
                placeholder="Allahumma..."
                placeholderTextColor={COLORS.sub}
                style={s.input}
                multiline
              />

              <Text style={s.label}>Artinya</Text>
              <TextInput
                value={artinya}
                onChangeText={setArtinya}
                placeholder="Ya Allah, ..."
                placeholderTextColor={COLORS.sub}
                style={[s.input, { height: 80, textAlignVertical: "top" }]}
                multiline
              />

              <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
                <TouchableOpacity
                  onPress={() => { setAdding(false); }}
                  disabled={submitting}
                  style={[s.btn, { backgroundColor: COLORS.card }]}
                >
                  <Text>Batal</Text>
                </TouchableOpacity>
                <TouchableOpacity
                  onPress={onSubmitAdd}
                  disabled={submitting}
                  style={[s.btn, { backgroundColor: COLORS.brand }]}
                >
                  <Text style={{ color: "#fff", fontWeight: "700" }}>
                    {submitting ? "Menyimpan..." : "Simpan"}
                  </Text>
                </TouchableOpacity>
              </View>
            </View>
          )}
        </View>
      )}

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

  // Admin add panel
  addBtn: {
    alignSelf: "flex-start",
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: COLORS.brand,
    paddingVertical: 10,
    paddingHorizontal: 14,
    borderRadius: 10,
  },
  formBox: {
    marginTop: 10,
    backgroundColor: COLORS.bg,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    padding: 12,
  },
  formTitle: { fontWeight: "700", color: COLORS.text, marginBottom: 8 },
  label: { color: COLORS.sub, marginTop: 8, marginBottom: 4, fontSize: 12 },
  input: {
    backgroundColor: COLORS.card,
    borderRadius: 10,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: COLORS.text,
  },
  btn: {
    paddingVertical: 12,
    paddingHorizontal: 16,
    borderRadius: 10,
  },
});
