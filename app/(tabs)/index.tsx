import React, { useEffect, useMemo, useState } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  FlatList,
  ListRenderItemInfo,
  useWindowDimensions,
} from "react-native";
import { Link, type Href } from "expo-router";
import { Ionicons, Feather, Entypo, MaterialIcons } from "@expo/vector-icons";

const COLORS = {
  bg: "#ffffff",
  soft: "#eef4ff",
  card: "#f3f4f6",
  text: "#0f172a",
  sub: "#334155",
  brand: "#0ea5a3",
};

const MOCK_PRAYERS = [
  { name: "Subuh", time: "04:20" },
  { name: "Dzuhur", time: "11:40" },
  { name: "Ashar", time: "15:00" },
  { name: "Maghrib", time: "17:40" },
  { name: "Isya", time: "18:50" },
];

type Item = {
  label: string;
  href?: Href;
  icon: string;
  lib?: "ion" | "mi" | "fe" | "ent";
};

const ITEMS: Item[] = [
  { label: "Qur'an",     icon: "book-outline",               lib: "ion", href: "/quran" },
  { label: "Do'a",       icon: "leaf-outline",               lib: "ion", href: "/doa" },
  { label: "Berita",     icon: "newspaper-outline",          lib: "ion", href: "/(tabs)/berita" },
  { label: "Siswa",      icon: "people-outline",             lib: "ion", href: "/siswa" },
  { label: "Video",      icon: "play-circle-outline",        lib: "ion", href: "/video" },
  { label: "Presensi",   icon: "checkmark-done-outline",     lib: "ion", href: "/presensi" },
  { label: "PPDB",       icon: "assignment",                 lib: "mi",  href: "/ppdb" },
  { label: "Inventaris", icon: "box",                        lib: "fe",  href: "/inventaris" },
  { label: "Ijin",       icon: "text-document",              lib: "ent", href: "/ijin" },
  { label: "Kalender Pendidikan", icon: "calendar-outline",  lib: "ion", href: "/kalender" },
  { label: "Login",      icon: "log-in-outline",             lib: "ion", href: "/login" },
];

function IconSwitch({
  name,
  lib,
  size = 24,
  color = COLORS.text,
}: {
  name: string;
  lib?: Item["lib"];
  size?: number;
  color?: string;
}) {
  if (lib === "mi") return <MaterialIcons name={name as any} size={size} color={color} />;
  if (lib === "fe") return <Feather name={name as any} size={size} color={color} />;
  if (lib === "ent") return <Entypo name={name as any} size={size} color={color} />;
  return <Ionicons name={name as any} size={size} color={color} />;
}

function useClock() {
  const [now, setNow] = useState<Date>(new Date());
  useEffect(() => {
    const id = setInterval(() => setNow(new Date()), 1000);
    return () => clearInterval(id);
  }, []);
  const fmtTime = useMemo(
    () =>
      new Intl.DateTimeFormat("id-ID", {
        hour: "2-digit",
        minute: "2-digit",
        second: "2-digit",
        hour12: false,
        timeZone: "Asia/Jakarta",
      }).format(now),
    [now]
  );
  const fmtDate = useMemo(
    () =>
      new Intl.DateTimeFormat("id-ID", {
        weekday: "long",
        day: "2-digit",
        month: "long",
        year: "numeric",
        timeZone: "Asia/Jakarta",
      }).format(now),
    [now]
  );
  return { fmtTime, fmtDate };
}

export default function Beranda() {
  const { fmtTime, fmtDate } = useClock();
  const { width } = useWindowDimensions();

  // responsif: atur jumlah kolom berdasarkan lebar layar
  // <400px: 3 kolom, <768px: 4 kolom, sisanya 6 kolom (desktop)
  const numColumns = width < 400 ? 3 : width < 768 ? 4 : 6;

  const renderItem = ({ item }: ListRenderItemInfo<Item>) => {
    const Card = (
      <View style={styles.card}>
        <IconSwitch name={item.icon} lib={item.lib} size={26} color={COLORS.text} />
        <Text style={styles.cardLabel}>{item.label}</Text>
      </View>
    );
    return item.href ? (
      <Link href={item.href} asChild>
        <TouchableOpacity activeOpacity={0.7} style={styles.cardTouchable}>
          {Card}
        </TouchableOpacity>
      </Link>
    ) : (
      <View style={styles.cardTouchable}>{Card}</View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      {/* Header + Jam */}
      <View style={styles.header}>
        <Text style={styles.appTitle}>SIMATA</Text>
        <View style={styles.clockRow}>
          <Ionicons name="time-outline" size={18} color={COLORS.brand} />
          <Text style={styles.clockText}>{fmtTime} WIB</Text>
        </View>
        <Text style={styles.dateText}>{fmtDate}</Text>
      </View>

      {/* Jadwal Sholat */}
      <View style={styles.prayerWrap}>
        <Text style={styles.sectionTitle}>Jadwal Sholat Hari Ini (WIB)</Text>
        <View style={styles.chipsRow}>
          {MOCK_PRAYERS.map((p) => (
            <View key={p.name} style={styles.chip}>
              <Text style={styles.chipName}>{p.name}</Text>
              <Text style={styles.chipTime}>{p.time}</Text>
            </View>
          ))}
        </View>
      </View>

      {/* Grid Menu (FlatList, multi-kolom) */}
      <FlatList
        data={ITEMS}
        keyExtractor={(it) => it.label}
        renderItem={renderItem}
        numColumns={numColumns}
        columnWrapperStyle={{ justifyContent: "flex-start", gap: 12, paddingHorizontal: 12 }}
        contentContainerStyle={{ paddingBottom: 120, rowGap: 12 }}
        showsVerticalScrollIndicator={false}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  header: {
    paddingHorizontal: 16,
    paddingTop: 8,
    paddingBottom: 12,
    backgroundColor: COLORS.bg,
  },
  appTitle: {
    fontSize: 26,
    fontWeight: "800",
    color: COLORS.text,
    letterSpacing: 0.5,
    marginBottom: 4,
  },
  clockRow: {
    flexDirection: "row",
    alignItems: "center",
    gap: 6,
  },
  clockText: { fontSize: 16, fontWeight: "700", color: COLORS.brand },
  dateText: { marginTop: 2, fontSize: 13, color: COLORS.sub, fontWeight: "500" },

  prayerWrap: {
    backgroundColor: COLORS.soft,
    marginHorizontal: 12,
    padding: 12,
    borderRadius: 16,
    marginTop: 8,
    marginBottom: 8,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 10,
  },
  chipsRow: {
    flexDirection: "row",
    flexWrap: "wrap",
    gap: 8,
  },
  chip: {
    backgroundColor: "#ffffff",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    minWidth: 78,
    alignItems: "center",
    elevation: 1,
  },
  chipName: { fontSize: 12, color: COLORS.sub, fontWeight: "600" },
  chipTime: { fontSize: 16, color: COLORS.text, fontWeight: "800" },

  cardTouchable: {
    flex: 1,
  },
  card: {
    backgroundColor: COLORS.card,
    borderRadius: 16,
    height: 92,
    alignItems: "center",
    justifyContent: "center",
    gap: 8,
    paddingHorizontal: 8,
  },
  cardLabel: {
    fontSize: 13,
    color: COLORS.text,
    fontWeight: "600",
    textAlign: "center",
  },
});
