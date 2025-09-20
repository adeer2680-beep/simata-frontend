import React, { useMemo, useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity, ScrollView } from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

/** ==== CONFIG WARNA ==== */
const C = {
  bg: "#ffffff",
  text: "#0f172a",
  sub: "#475569",
  border: "#e5e7eb",
  soft: "#f8fafc",
  holiday: "#dc2626", // merah libur
  sunday: "#dc2626",
};

const WEEK_DAYS = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const CELL = 7;

/** ==== DATA LIBUR NASIONAL (contoh, 2025 – tambahkan/ubah sesuai kebutuhan) ==== 
 * format: YYYY-MM-DD (waktu lokal Indonesia)
 * Catatan: beberapa hari libur keagamaan sifatnya tentatif; sesuaikan kalender resmi sekolah/kemenag pemda kamu.
 */
const HOLIDAYS_2025: { date: string; title: string }[] = [
  { date: "2025-01-01", title: "Tahun Baru Masehi" },
  { date: "2025-01-27", title: "Tahun Baru Imlek 2576" },
  { date: "2025-03-31", title: "Isra Mikraj Nabi Muhammad SAW" },
  { date: "2025-04-18", title: "Wafat Isa Almasih (Jumat Agung)" },
  { date: "2025-04-20", title: "Paskah" },
  { date: "2025-04-29", title: "Hari Raya Idulfitri 1446 H" },
  { date: "2025-04-30", title: "Cuti Bersama Idulfitri (opsional)" },
  { date: "2025-05-01", title: "Hari Buruh Internasional" },
  { date: "2025-05-12", title: "Hari Raya Waisak" },
  { date: "2025-05-29", title: "Kenaikan Isa Almasih" },
  { date: "2025-06-01", title: "Hari Lahir Pancasila" },
  { date: "2025-06-06", title: "Iduladha 1446 H" },
  { date: "2025-06-27", title: "Tahun Baru Islam 1447 H" },
  { date: "2025-08-17", title: "Hari Kemerdekaan RI" },
  { date: "2025-09-05", title: "Maulid Nabi Muhammad SAW" },
  // contoh libur lokal/instansi (opsional)
  // { date: "2025-09-19", title: "Hari Lahir Lembaga Pendidikan Ma'arif NU" },
];

/** ==== UTIL TANGGAL ==== */
function addMonths(d: Date, delta: number) {
  const nd = new Date(d.getFullYear(), d.getMonth() + delta, 1);
  return nd;
}
function titleId(d: Date) {
  return d.toLocaleDateString("id-ID", { month: "long", year: "numeric", timeZone: "Asia/Jakarta" });
}
function ymdLocal(d: Date) {
  // bikin YYYY-MM-DD dari komponen lokal (hindari offset zona)
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  const mm = m < 10 ? `0${m}` : `${m}`;
  const dd = day < 10 ? `0${day}` : `${day}`;
  return `${y}-${mm}-${dd}`;
}

type Cell = {
  key: string;
  date: Date;
  inMonth: boolean;
  isSunday: boolean;
  holidayTitle?: string;
};

/** grid kalender (Ahad = kolom pertama) + flag libur otomatis */
function useCalendar(cursor: Date) {
  return useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();

    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const daysInMonth = last.getDate();

    // Ahad=0…Sabtu=6
    const leading = (first.getDay() + 7) % 7; // sel dari bulan sebelumnya
    const totalCells = Math.ceil((leading + daysInMonth) / 7) * 7;

    const start = new Date(year, month, 1 - leading);
    const cells: Cell[] = [];

    for (let i = 0; i < totalCells; i++) {
      const d = new Date(start);
      d.setDate(start.getDate() + i);

      const iso = ymdLocal(d);
      const holiday = HOLIDAYS_2025.find((h) => h.date === iso);

      cells.push({
        key: iso,
        date: d,
        inMonth: d.getMonth() === month,
        isSunday: d.getDay() === 0,
        holidayTitle: holiday?.title,
      });
    }

    const title = titleId(cursor);
    return { cells, title };
  }, [cursor]);
}

/** ==== KOMPONEN UTAMA ==== */
export default function KalenderPendidikan() {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const { cells, title } = useCalendar(cursor);

  const goPrev = () => setCursor((d) => addMonths(d, -1));
  const goNext = () => setCursor((d) => addMonths(d, +1));

  // daftar libur bulan yang sedang ditampilkan
  const monthHolidays = useMemo(() => {
    const y = cursor.getFullYear();
    const m = cursor.getMonth();
    return HOLIDAYS_2025.filter((h) => {
      const d = new Date(h.date);
      return d.getFullYear() === y && d.getMonth() === m;
    }).sort((a, b) => (a.date < b.date ? -1 : 1));
  }, [cursor]);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Kalender Pendidikan</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16 }}>
        {/* Kartu Kalender */}
        <View style={styles.card}>
          {/* Navigasi Bulan */}
          <View style={styles.monthHeader}>
            <TouchableOpacity onPress={goPrev}>
              <Ionicons name="chevron-back" size={20} color={C.sub} />
            </TouchableOpacity>
            <Text style={styles.monthTitle}>{title}</Text>
            <TouchableOpacity onPress={goNext}>
              <Ionicons name="chevron-forward" size={20} color={C.sub} />
            </TouchableOpacity>
          </View>

          {/* Header hari */}
          <View style={styles.weekHeaderRow}>
            {WEEK_DAYS.map((d) => (
              <View key={d} style={styles.weekHeaderCell}>
                <Text style={[styles.weekHeaderText, d === "Ahad" && { color: C.sunday }]}>
                  {d}
                </Text>
              </View>
            ))}
          </View>

          {/* Grid tanggal */}
          <View style={styles.grid}>
            {cells.map((c) => {
              const day = c.date.getDate();
              const isDim = !c.inMonth;
              const isHoliday = Boolean(c.holidayTitle);

              return (
                <View key={c.key} style={styles.cell}>
                  <Text
                    style={[
                      styles.dayText,
                      isDim && { color: "#94a3b8" },
                      c.inMonth && c.isSunday && { color: C.sunday, fontWeight: "700" },
                      isHoliday && c.inMonth && { color: C.holiday, fontWeight: "800" },
                    ]}
                  >
                    {day}
                  </Text>
                  {isHoliday && c.inMonth && <Text style={styles.holidayDot}>●</Text>}
                </View>
              );
            })}
          </View>
        </View>

        {/* Daftar Libur Nasional (bulan aktif) */}
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Hari Libur Nasional</Text>
          {monthHolidays.length === 0 ? (
            <Text style={styles.emptyText}>Tidak ada libur nasional bulan ini.</Text>
          ) : (
            monthHolidays.map((h) => {
              const d = new Date(h.date);
              const tgl = d.getDate();
              const bln = d.toLocaleDateString("id-ID", { month: "short" });
              const hari = d.toLocaleDateString("id-ID", { weekday: "long" });
              return (
                <View key={h.date} style={styles.holidayRow}>
                  <View style={styles.holidayDateBox}>
                    <Text style={styles.holidayMon}>{bln}</Text>
                    <Text style={styles.holidayDay}>{tgl}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={styles.holidayTitle}>{h.title}</Text>
                    <Text style={styles.holidaySub}>{hari}, {tgl} {bln} {d.getFullYear()}</Text>
                  </View>
                </View>
              );
            })
          )}
        </View>

        <View style={{ height: 40 }} />
      </ScrollView>
    </View>
  );
}

/** ==== STYLES ==== */
const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.text },

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

  weekHeaderRow: {
    flexDirection: "row",
    backgroundColor: C.soft,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
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

  section: {
    marginTop: 12,
    backgroundColor: C.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: C.border,
  },
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

  holidayRow: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 12,
  },
  holidayDateBox: { width: 54, alignItems: "flex-start", paddingRight: 6 },
  holidayMon: { color: C.sub, fontWeight: "700" },
  holidayDay: { color: C.text, fontWeight: "800", fontSize: 18, marginTop: -2 },

  holidayTitle: { color: C.text, fontWeight: "700" },
  holidaySub: { color: C.sub, fontSize: 12, marginTop: 2 },
});
