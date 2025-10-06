// app/index.tsx
import { Entypo, Feather, Ionicons, MaterialIcons } from "@expo/vector-icons";
import { Link, type Href, router } from "expo-router"; 
import React, { useEffect, useMemo, useState } from "react";
import {
  FlatList,
  ListRenderItemInfo,
  SafeAreaView,
  StyleSheet,
  Text,
  TouchableOpacity,
  useWindowDimensions,
  View,
  Platform,
  ActivityIndicator,
  Alert,
} from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";

const COLORS = {
  brand: "#42909b",
  bg: "#ffffff",
  card: "#ffffff",
  soft: "#f3f4f6",
  softBlue: "#eef4ff",
  border: "#e5e7eb",
  text: "#0f172a",
  sub: "#334155",
} as const;

const SHADOW = Platform.select({
  ios: { shadowColor: "#000", shadowOpacity: 0.06, shadowRadius: 8, shadowOffset: { width: 0, height: 4 } },
  android: { elevation: 3 },
  default: {},
});

// ====== PRAYER API (MyQuran) CONFIG ======
const MYQURAN_BASE = "https://api.myquran.com/v2/sholat";
const CITY_KEYWORD = "Mojokerto";

type Item = {
  label: string;
  href?: Href;
  icon: string;
  lib?: "ion" | "mi" | "fe" | "ent";
};

const ITEMS: Item[] = [
  { label: "PPDB",       icon: "assignment",             lib: "mi",  href: "/ppdb" },
  { label: "Presensi",   icon: "checkmark-done-outline", lib: "ion", href: "/presensi" },
  { label: "Kalender Pendidikan", icon: "calendar-outline", lib: "ion", href: "/kalender" },
  { label: "Ijin",       icon: "text-document",          lib: "ent", href: "/ijin" },
  { label: "Laporan",    icon: "document-text-outline",  lib: "ion", href: "/laporan" },
  { label: "Siswa",      icon: "people-outline",         lib: "ion", href: "/siswa" },
  { label: "Inventaris", icon: "box",                    lib: "fe",  href: "/inventaris" },
  { label: "Berita",     icon: "newspaper-outline",      lib: "ion", href: "/tabs/berita" },
  { label: "Video",      icon: "play-circle-outline",    lib: "ion", href: "/video" },
  { label: "Al-Qur'an",  icon: "book-outline",           lib: "ion", href: "/surah" },
  { label: "Doa Harian", icon: "leaf-outline",           lib: "ion", href: "/doa" },
  { label: "Login",      icon: "log-in-outline",         lib: "ion", href: "/login" },
  { label: "Register", icon: "person-add-outline", lib: "ion", href: "/register" },
];

// ====== Icon switcher ======
function IconSwitch({ name, lib, size = 26, color = COLORS.text }: { name: string; lib?: Item["lib"]; size?: number; color?: string }) {
  if (lib === "mi")  return <MaterialIcons name={name as any} size={size} color={color} />;
  if (lib === "fe")  return <Feather        name={name as any} size={size} color={color} />;
  if (lib === "ent") return <Entypo         name={name as any} size={size} color={color} />;
  return <Ionicons name={name as any} size={size} color={color} />;
}

// ====== Header clock (kode lama tetap) ======
function HeaderClock() {
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

  return (
    <View style={styles.header}>
      <Text style={styles.appTitle}>SIMATA</Text>
      <View style={styles.clockRow}>
        <Ionicons name="time-outline" size={18} color="#ffffff" />
        <Text style={styles.clockText}>{fmtTime} WIB</Text>
      </View>
      <Text style={styles.dateText}>{fmtDate}</Text>
    </View>
  );
}

// ====== Tombol Logout kecil pojok kanan atas ======
function LogoutButton() {
  const handleLogout = async () => {
    try {
      await AsyncStorage.multiRemove(["auth.user", "auth.token"]);
      router.replace("/login");
    } catch (error) {
      Alert.alert("Error", "Gagal logout. Silakan coba lagi.");
    }
  };

  return (
    <TouchableOpacity
      onPress={handleLogout}
      style={{
        position: "absolute",
        top: 18,
        right: 16,  // ✅ dipindah ke kanan
        backgroundColor: COLORS.brand,
        borderRadius: 20,
        padding: 6,
      }}
    >
      <Ionicons name="log-out-outline" size={18} color="#fff" />
    </TouchableOpacity>
  );
}

// ====== Shortcut card (tetap) ======
function ShortcutCard({ title, subtitle, icon, href }: { title: string; subtitle: string; icon: React.ReactNode; href: Href }) {
  const Card = (
    <View style={[styles.shortcutCard, SHADOW]}>
      <View style={styles.shortcutIcon}>{icon}</View>
      <View style={{ flex: 1 }}>
        <Text style={styles.shortcutTitle}>{title}</Text>
        <Text style={styles.shortcutSub} numberOfLines={1}>{subtitle}</Text>
      </View>
      <Ionicons name="chevron-forward" size={18} color={COLORS.sub} />
    </View>
  );
  return (
    <Link href={href} asChild>
      <TouchableOpacity activeOpacity={0.8}>{Card}</TouchableOpacity>
    </Link>
  );
}

// ====== PRAYER HOOK (tetap) ======
type PrayerRow = { name: string; time: string };
function pad2(n: number) { return String(n).padStart(2, "0"); }
function usePrayers(cityKeyword: string) {
  const [prayers, setPrayers] = useState<PrayerRow[] | null>(null);
  const [loading, setLoading] = useState(true);
  const [cityLabel, setCityLabel] = useState<string>(cityKeyword);
  const [error, setError] = useState<string | null>(null);
  const [dateKey, setDateKey] = useState<string>(() => {
    const d = new Date();
    return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
  });
  useEffect(() => {
    const now = new Date();
    const msToMidnight =
      new Date(now.getFullYear(), now.getMonth(), now.getDate() + 1, 0, 0, 2).getTime() - now.getTime();
    const t = setTimeout(() => {
      const d = new Date();
      setDateKey(`${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`);
    }, Math.max(1000, msToMidnight));
    return () => clearTimeout(t);
  }, [dateKey]);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setLoading(true);
        setError(null);
        const kotaRes = await fetch(`${MYQURAN_BASE}/kota/cari/${encodeURIComponent(cityKeyword)}`);
        const kotaJson = await kotaRes.json();
        const first = kotaJson?.data?.[0];
        if (!first?.id) throw new Error("Kota tidak ditemukan");
        const id = String(first.id);
        setCityLabel(first.lokasi || first.nama || cityKeyword);
        const [yyyy, mm, dd] = dateKey.split("-");
        const jadwalRes = await fetch(`${MYQURAN_BASE}/jadwal/${id}/${yyyy}/${mm}/${dd}`);
        const jadwalJson = await jadwalRes.json();
        const j = jadwalJson?.data?.jadwal ?? jadwalJson?.data;
        const pick = (obj: any, ...keys: string[]) => { for (const k of keys) if (obj?.[k] != null) return obj[k]; return undefined; };
        const rows: PrayerRow[] = [
          { name: "Subuh",   time: pick(j, "subuh", "Subuh", "Fajr")        ?? "-" },
          { name: "Dzuhur",  time: pick(j, "dzuhur", "Dzuhur", "Dhuhr")     ?? "-" },
          { name: "Ashar",   time: pick(j, "ashar", "Ashar", "Asr")         ?? "-" },
          { name: "Maghrib", time: pick(j, "maghrib", "Maghrib", "Maghrib") ?? "-" },
          { name: "Isya",    time: pick(j, "isya", "Isya", "Isha")          ?? "-" },
        ];
        if (!cancelled) setPrayers(rows);
      } catch (e: any) {
        if (!cancelled) {
          setError(e?.message ?? "Gagal memuat jadwal");
          setPrayers([
            { name: "Subuh", time: "04:20" },
            { name: "Dzuhur", time: "11:40" },
            { name: "Ashar", time: "15:00" },
            { name: "Maghrib", time: "17:40" },
            { name: "Isya", time: "18:50" },
          ]);
        }
      } finally {
        !cancelled && setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [cityKeyword, dateKey]);

  return { prayers, loading, error, cityLabel };
}

// ====== BERANDA ======
export default function Beranda() {
  const { width } = useWindowDimensions();
  const numColumns = width < 400 ? 3 : width < 768 ? 4 : 6;
  const { prayers, loading: prayerLoading, error: prayerError, cityLabel } = usePrayers(CITY_KEYWORD);
  const [welcome, setWelcome] = useState<string>("");
  useEffect(() => {
    const loadWelcome = async () => {
      const s = await AsyncStorage.getItem("auth.beranda");
      if (s && s.trim()) { setWelcome(s.trim()); return; }
      const rawUser = await AsyncStorage.getItem("auth.user");
      if (rawUser) {
        try {
          const u = JSON.parse(rawUser);
          const pieces = [u?.nama, u?.unit].filter(Boolean);
          if (pieces.length > 0) setWelcome(pieces.join(" • "));
        } catch {}
      }
    };
    loadWelcome();
  }, []);

  const renderItem = ({ item }: ListRenderItemInfo<Item>) => {
    const Card = (
      <View style={[styles.card, SHADOW]}>
        <View style={styles.cardIconWrap}><IconSwitch name={item.icon} lib={item.lib} /></View>
        <Text style={styles.cardLabel}>{item.label}</Text>
      </View>
    );
    return item.href ? (
      <Link href={item.href} asChild>
        <TouchableOpacity activeOpacity={0.8} style={styles.cardTouchable}>{Card}</TouchableOpacity>
      </Link>
    ) : (
      <View style={styles.cardTouchable}>{Card}</View>
    );
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: COLORS.bg }}>
      <HeaderClock />
      <LogoutButton />   {/* ✅ Logout kecil pojok kanan atas */}

      {welcome ? (
        <View style={[styles.welcomeWrap, SHADOW]}>
          <Ionicons name="person-circle-outline" size={18} color={COLORS.brand} />
          <Text style={styles.welcomeText} numberOfLines={1}>Selamat datang, {welcome}</Text>
        </View>
      ) : null}

      {/* JADWAL SHOLAT */}
      <View style={[styles.prayerWrap, SHADOW]}>
        <View style={{ flexDirection: "row", justifyContent: "space-between", alignItems: "center", marginBottom: 8 }}>
          <Text style={styles.sectionTitle}>Jadwal Sholat Hari Ini (WIB)</Text>
          <Text style={styles.cityText}>{cityLabel}</Text>
        </View>
        {prayerLoading ? (
          <View style={{ paddingVertical: 10 }}><ActivityIndicator /></View>
        ) : (
          <>
            {!!prayerError && <Text style={styles.errorText}>Gagal memuat jadwal: {prayerError}</Text>}
            <View style={styles.chipsRow}>
              {(prayers ?? []).map((p) => (
                <View key={p.name} style={[styles.chip, SHADOW]}>
                  <Text style={styles.chipName}>{p.name}</Text>
                  <Text style={styles.chipTime}>{p.time}</Text>
                </View>
              ))}
            </View>
          </>
        )}
      </View>

      {/* GRID */}
      <Text style={styles.gridHeading}>Menu Utama</Text>
      <FlatList
        data={ITEMS}
        keyExtractor={(it) => it.label}
        renderItem={renderItem}
        numColumns={numColumns}
        columnWrapperStyle={{ justifyContent: "flex-start", gap: 12, paddingHorizontal: 12 }}
        showsVerticalScrollIndicator={false}
        ListFooterComponent={
          <View style={{ marginTop: 12, marginBottom: 120 }}>
            <Text style={styles.gridHeading}>Shortcut</Text>
            <View style={styles.shortcutsWrap}>
              <ShortcutCard
                title="Berita"
                subtitle="Tekan untuk melihat semua berita"
                href={"/tabs/berita"}
                icon={<Ionicons name="newspaper" size={22} color={COLORS.brand} />}
              />
              <ShortcutCard
                title="Doa Harian"
                subtitle="Tekan untuk melihat daftar doa"
                href={"/doa"}
                icon={<Ionicons name="book" size={22} color={COLORS.brand} />}
              />
            </View>
          </View>
        }
        contentContainerStyle={{ rowGap: 12, paddingBottom: 0 }}
      />
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  // HEADER
  header: { paddingHorizontal: 16, paddingTop: 20, paddingBottom: 20, backgroundColor: COLORS.brand },
  appTitle: { fontSize: 26, fontWeight: "800", color: "#ffffff", letterSpacing: 0.5, marginBottom: 6 },
  clockRow: { flexDirection: "row", alignItems: "center", gap: 6 },
  clockText: { fontSize: 16, fontWeight: "700", color: "#ffffff" },
  dateText: { marginTop: 2, fontSize: 13, color: "#f3f4f6", fontWeight: "600" },

  // NEW: WELCOME
  welcomeWrap: { marginTop: -10, marginHorizontal: 12, marginBottom: 8, paddingVertical: 10, paddingHorizontal: 12, backgroundColor: "#ffffff", borderRadius: 14, borderWidth: 1, borderColor: COLORS.border, flexDirection: "row", alignItems: "center", gap: 8 },
  welcomeText: { fontSize: 13, color: COLORS.text, fontWeight: "700", flex: 1 },

  // PRAYER
  prayerWrap: { backgroundColor: COLORS.softBlue, marginHorizontal: 12, padding: 12, borderRadius: 16, marginTop: -4, borderWidth: 1, borderColor: COLORS.border },
  sectionTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },
  cityText: { fontSize: 12, color: COLORS.sub, fontWeight: "700" },
  errorText: { color: "#b91c1c", marginBottom: 6, fontSize: 12 },
  chipsRow: { flexDirection: "row", flexWrap: "wrap", gap: 8, marginTop: 6 },
  chip: { backgroundColor: "#ffffff", paddingVertical: 10, paddingHorizontal: 12, borderRadius: 12, minWidth: 78, alignItems: "center", borderWidth: 1, borderColor: COLORS.border },
  chipName: { fontSize: 12, color: COLORS.sub, fontWeight: "700" },
  chipTime: { fontSize: 16, color: COLORS.text, fontWeight: "800" },

  // GRID
  gridHeading: { marginTop: 12, marginBottom: 8, marginHorizontal: 12, fontSize: 14, color: COLORS.sub, fontWeight: "700" },
  cardTouchable: { flex: 1 },
  card: { backgroundColor: COLORS.card, borderRadius: 16, height: 92, alignItems: "center", justifyContent: "center", gap: 10, paddingHorizontal: 8, borderWidth: 1, borderColor: COLORS.border },
  cardIconWrap: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.soft },
  cardLabel: { fontSize: 12, fontWeight: "600", color: COLORS.text, textAlign: "center" },

  // SHORTCUT
  shortcutsWrap: { marginTop: 4, gap: 12 },
  shortcutCard: { flexDirection: "row", alignItems: "center", backgroundColor: "#ffffff", padding: 12, borderRadius: 14, borderWidth: 1, borderColor: COLORS.border },
  shortcutIcon: { width: 36, height: 36, borderRadius: 18, alignItems: "center", justifyContent: "center", backgroundColor: COLORS.soft, marginRight: 10 },
  shortcutTitle: { fontSize: 14, fontWeight: "700", color: COLORS.text },
  shortcutSub: { fontSize: 12, color: COLORS.sub, marginTop: 2 },
});
