// app/kalender.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";

// ==== CONFIG WARNA ====
const C = {
  brand: "#42909b",
  bg: "#ffffff",
  text: "#0f172a",
  sub: "#475569",
  border: "#e5e7eb",
  soft: "#f8fafc",
  holiday: "#dc2626",
  sunday: "#dc2626",
};

// ==== UTIL ====
const WEEK_DAYS = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const CELL = 7;

function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}
function titleId(d: Date) {
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
}
function ymdLocal(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${m < 10 ? "0" + m : m}-${day < 10 ? "0" + day : day}`;
}

// ==== API CONFIG ====
// Pilih host sesuai platform (emulator Android vs web/iOS)
import { Platform } from "react-native";

const API_BASE =
  Platform.OS === "android"
    ? "http://10.0.2.2:8000/api"
    : "http://localhost:8000/api";

// Endpoint index kalender-akademik (tanpa /kalender di belakang)
const KALENDER_URL = `${API_BASE}/kalender-akademik`;

async function fetchMonthEvents(year: number, monthIndex0: number) {
  const month1 = monthIndex0 + 1;
  // kalau backendmu support filter query, keep ini; kalau tidak, query akan diabaikan tapi tetap 200
  const url = `${KALENDER_URL}?year=${year}&month=${month1}`;

  try {
    console.log("GET", url);
    const { data } = await axios.get(url, { timeout: 15000 });
    // sesuaikan shape responsemu; sementara aman-kan default ke array kosong
    return (data?.data ?? data ?? []);
  } catch (err: any) {
    console.log("ERR URL:", url);
    console.log("ERR STATUS:", err?.response?.status);
    console.log("ERR DATA:", err?.response?.data);
    throw new Error(
      `Gagal memuat kalender (${err?.response?.status ?? "?"})`
    );
  }
}

// ==== HOOK GRID ====
function useCalendar(cursor: Date, holidays: { date: string; title: string }[]) {
  return useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();

    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const daysInMonth = last.getDate();

    const leading = (first.getDay() + 7) % 7;
    const totalCells = Math.ceil((leading + daysInMonth) / 7) * 7;

    const start = new Date(year, month, 1 - leading);
    const holidayMap = new Map(holidays.map((h) => [h.date, h.title]));

    const cells = Array.from({ length: totalCells }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = ymdLocal(d);
      return {
        key: iso,
        date: d,
        inMonth: d.getMonth() === month,
        isSunday: d.getDay() === 0,
        holidayTitle: holidayMap.get(iso),
      };
    });

    return { cells, title: titleId(cursor) };
  }, [cursor, holidays]);
}

// ==== MAIN ====
export default function KalenderPendidikan() {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remoteHolidays, setRemoteHolidays] = useState<{ date: string; title: string }[] | null>(null);

  useEffect(() => {
    let cancelled = false;
    async function run() {
      try {
        setLoading(true);
        setError(null);
        const y = cursor.getFullYear();
        const m0 = cursor.getMonth();
        const data = await fetchMonthEvents(y, m0);
        if (!cancelled) setRemoteHolidays(data?.length ? data : null);
      } catch (e: any) {
        if (!cancelled) {
          setRemoteHolidays(null);
          setError(e?.message ?? "Gagal memuat kalender.");
        }
      } finally {
        !cancelled && setLoading(false);
      }
    }
    run();
    return () => { cancelled = true; };
  }, [cursor]);

  const monthHolidays = remoteHolidays ?? [];
  const { cells, title } = useCalendar(cursor, monthHolidays);

  return (
    <SafeAreaView style={s.container}>
      {/* HEADER SERAGAM */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85} style={s.backBtn}>
          <Ionicons name="chevron-back" size={22} color="#000" />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Kalender Pendidikan</Text>
        <View style={{ width: 38 }} />
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Kartu Kalender */}
        <View style={s.card}>
          <View style={s.monthHeader}>
            <TouchableOpacity onPress={() => setCursor((d) => addMonths(d, -1))}>
              <Ionicons name="chevron-back" size={20} color={C.sub} />
            </TouchableOpacity>
            <Text style={s.monthTitle}>{title}</Text>
            <TouchableOpacity onPress={() => setCursor((d) => addMonths(d, 1))}>
              <Ionicons name="chevron-forward" size={20} color={C.sub} />
            </TouchableOpacity>
          </View>

          {/* Header hari */}
          <View style={s.weekHeaderRow}>
            {WEEK_DAYS.map((d) => (
              <View key={d} style={s.weekHeaderCell}>
                <Text style={[s.weekHeaderText, d === "Ahad" && { color: C.sunday }]}>{d}</Text>
              </View>
            ))}
          </View>

          {/* Grid tanggal */}
          <View style={s.grid}>
            {cells.map((c) => {
              const day = c.date.getDate();
              const isHoliday = Boolean(c.holidayTitle);
              return (
                <View key={c.key} style={s.cell}>
                  <Text
                    style={[
                      s.dayText,
                      !c.inMonth && { color: "#94a3b8" },
                      c.inMonth && c.isSunday && { color: C.sunday, fontWeight: "700" },
                      isHoliday && c.inMonth && { color: C.holiday, fontWeight: "800" },
                    ]}
                  >
                    {day}
                  </Text>
                  {isHoliday && c.inMonth && <Text style={s.holidayDot}>●</Text>}
                </View>
              );
            })}
          </View>
        </View>

        {/* Loading / Error */}
        {loading && (
          <View style={{ flexDirection: "row", alignItems: "center", gap: 8, padding: 8 }}>
            <ActivityIndicator />
            <Text style={{ color: C.sub }}>Memuat dari server…</Text>
          </View>
        )}
        {error && (
          <View style={{ padding: 8, borderRadius: 8, borderColor: "#fecaca", borderWidth: 1, backgroundColor: "#fff1f2" }}>
            <Text style={{ color: "#b91c1c", marginBottom: 8 }}>Gagal memuat kalender: {error}</Text>
            <TouchableOpacity
              onPress={() => setCursor((d) => new Date(d))}
              style={{ alignSelf: "flex-start", paddingHorizontal: 12, paddingVertical: 6, borderRadius: 8, backgroundColor: "#ef4444" }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Coba lagi</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Daftar Libur */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Hari Libur & Kegiatan</Text>
          {monthHolidays.length === 0 ? (
            <Text style={s.emptyText}>Tidak ada libur/kegiatan bulan ini.</Text>
          ) : (
            monthHolidays.map((h) => {
              const d = new Date(h.date);
              const tgl = d.getDate();
              const bln = d.toLocaleDateString("id-ID", { month: "short" });
              const hari = d.toLocaleDateString("id-ID", { weekday: "long" });
              return (
                <View key={h.date + h.title} style={s.holidayRow}>
                  <View style={s.holidayDateBox}>
                    <Text style={s.holidayMon}>{bln}</Text>
                    <Text style={s.holidayDay}>{tgl}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.holidayTitle}>{h.title}</Text>
                    <Text style={s.holidaySub}>{hari}, {tgl} {bln} {d.getFullYear()}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </SafeAreaView>
  );
}

// ==== STYLES ====
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // Header seragam
  header: {
    backgroundColor: C.brand,
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

  card: {
    backgroundColor: C.bg,
    borderRadius: 16,
    borderWidth: 1,
    borderColor: C.border,
    overflow: "hidden",
  },
  monthHeader: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  monthTitle: { fontSize: 16, fontWeight: "700", color: C.text },

  weekHeaderRow: { flexDirection: "row", backgroundColor: C.soft, borderBottomWidth: 1, borderBottomColor: C.border },
  weekHeaderCell: { width: `${100 / CELL}%`, alignItems: "center", paddingVertical: 8 },
  weekHeaderText: { fontSize: 12, fontWeight: "700", color: C.sub },

  grid: { flexDirection: "row", flexWrap: "wrap" },
  cell: {
    width: `${100 / CELL}%`,
    height: 48,
    borderRightWidth: 1,
    borderBottomWidth: 1,
    borderColor: C.border,
    alignItems: "center",
    justifyContent: "center",
  },
  dayText: { fontSize: 12, color: C.text },
  holidayDot: { marginTop: 2, fontSize: 10, color: C.holiday },

  section: { marginTop: 12, backgroundColor: C.bg, borderRadius: 12, borderWidth: 1, borderColor: C.border },
  sectionTitle: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    fontWeight: "700",
    color: C.text,
    backgroundColor: C.soft,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  emptyText: { padding: 12, color: C.sub },

  holidayRow: { flexDirection: "row", alignItems: "center", paddingHorizontal: 12, paddingVertical: 10, gap: 12 },
  holidayDateBox: { width: 54, alignItems: "flex-start", paddingRight: 6 },
  holidayMon: { color: C.sub, fontWeight: "700" },
  holidayDay: { color: C.text, fontWeight: "800", fontSize: 18, marginTop: -2 },
  holidayTitle: { color: C.text, fontWeight: "700" },
  holidaySub: { color: C.sub, fontSize: 12, marginTop: 2 },
});
