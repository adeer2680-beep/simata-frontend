import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  ActivityIndicator,
  TouchableOpacity,
  Image,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const API_URL = "http://localhost:8000/api/berita"; // ganti dengan URL backend-mu

const C = { bg: "#fff", text: "#0f172a", sub: "#475569", border: "#e5e7eb", brand: "#0ea5a3" };

export default function BeritaScreen() {
  const [data, setData] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);

  useEffect(() => {
    const fetchData = async () => {
      try {
        const res = await fetch(API_URL);
        if (!res.ok) throw new Error("Gagal mengambil data berita");
        const json = await res.json();
        setData(json);
      } catch (e: any) {
        setErr(e.message);
      } finally {
        setLoading(false);
      }
    };
    fetchData();
  }, []);

  const renderItem = ({ item }: { item: any }) => (
    <TouchableOpacity style={s.card}>
      {item.gambar && (
        <Image source={{ uri: item.gambar }} style={s.image} resizeMode="cover" />
      )}
      <View style={{ flex: 1 }}>
        <Text style={s.title}>{item.judul}</Text>
        <Text style={s.date}>{item.tanggal}</Text>
        <Text numberOfLines={2} style={s.snippet}>{item.isi}</Text>
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Berita</Text>
        <View style={{ width: 22 }} />
      </View>

      {loading ? (
        <View style={s.center}>
          <ActivityIndicator size="large" color={C.brand} />
          <Text style={{ marginTop: 8, color: C.sub }}>Memuat berita…</Text>
        </View>
      ) : err ? (
        <View style={s.center}>
          <Text style={{ color: "red" }}>{err}</Text>
        </View>
      ) : (
        <FlatList
          data={data}
          renderItem={renderItem}
          keyExtractor={(item) => item.id.toString()}
          contentContainerStyle={{ padding: 16 }}
          ItemSeparatorComponent={() => <View style={{ height: 12 }} />}
        />
      )}
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.text },

  card: {
    backgroundColor: "#f9fafb",
    borderRadius: 12,
    padding: 12,
    flexDirection: "row",
    alignItems: "flex-start",
    gap: 10,
    borderWidth: 1,
    borderColor: "#e5e7eb",
  },
  image: { width: 60, height: 60, borderRadius: 8 },
  title: { fontSize: 14, fontWeight: "700", color: C.text, marginBottom: 4 },
  date: { fontSize: 12, color: C.sub, marginBottom: 4 },
  snippet: { fontSize: 13, color: C.text },

  center: { flex: 1, alignItems: "center", justifyContent: "center" },
});
