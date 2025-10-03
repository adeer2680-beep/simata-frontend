// app/(tabs)/dashboard.tsx
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, TouchableOpacity } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const C = {
  brand: "#42909b",
  text: "#0f172a",
  sub: "#475569",
  border: "#e5e7eb",
  bg: "#ffffff",
};

type User = { nama?: string; unit?: string; [k: string]: any };

export default function Dashboard() {
  const [checking, setChecking] = useState(true);
  const [user, setUser] = useState<User | null>(null);

  useEffect(() => {
    (async () => {
      try {
        const token = (await AsyncStorage.getItem("auth.token")) || (await AsyncStorage.getItem("token"));
        if (!token) {
          router.replace("/login");
          return;
        }
        const raw = await AsyncStorage.getItem("auth.user");
        if (raw) {
          try { setUser(JSON.parse(raw)); } catch { setUser(null); }
        }
      } finally {
        setChecking(false);
      }
    })();
  }, []);

  if (checking) {
    return (
      <View style={s.center}>
        <ActivityIndicator />
        <Text style={{ marginTop: 8, color: C.sub }}>Memeriksa sesi…</Text>
      </View>
    );
  }

  return (
    <View style={s.container}>
      <View style={s.header}>
        <Text style={s.hi}>
          Selamat datang{user?.nama ? `, ${user.nama}` : ""}{user?.unit ? ` • ${user.unit}` : ""}
        </Text>
        <Text style={s.sub}>Ini adalah ringkasan singkat akun Anda.</Text>
      </View>

      <View style={s.grid}>
        <Tile label="Berita" icon="newspaper-outline" onPress={() => router.push("/tabs/berita")} />
        <Tile label="Dashboard" icon="grid-outline" onPress={() => { /* stay */ }} />
        <Tile label="Inbox" icon="mail-unread-outline" onPress={() => router.push("/tabs/inbox")} />
        <Tile label="Profil" icon="person-circle-outline" onPress={() => router.push("/tabs/profil")} />
      </View>
    </View>
  );
}

function Tile({ label, icon, onPress }: { label: string; icon: any; onPress: () => void }) {
  return (
    <TouchableOpacity style={s.tile} onPress={onPress} activeOpacity={0.85}>
      <View style={s.iconWrap}>
        <Ionicons name={icon} size={22} color={C.brand} />
      </View>
      <Text style={s.tileText}>{label}</Text>
    </TouchableOpacity>
  );
}

const s = StyleSheet.create({
  center: { flex: 1, alignItems: "center", justifyContent: "center", backgroundColor: C.bg },
  container: { flex: 1, backgroundColor: C.bg, padding: 16 },
  header: { marginBottom: 12 },
  hi: { fontSize: 18, fontWeight: "800", color: C.text },
  sub: { color: C.sub, marginTop: 4 },
  grid: { flexDirection: "row", flexWrap: "wrap", gap: 12, marginTop: 8 },
  tile: {
    width: "47%",
    borderRadius: 14, borderWidth: 1, borderColor: C.border,
    backgroundColor: "#fff", paddingVertical: 16, paddingHorizontal: 12,
    alignItems: "center", justifyContent: "center", gap: 10,
  },
  iconWrap: {
    width: 40, height: 40, borderRadius: 12,
    borderWidth: 1, borderColor: C.border,
    alignItems: "center", justifyContent: "center", backgroundColor: "#f8fafc",
  },
  tileText: { fontWeight: "700", color: C.text },
});
