import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  ActivityIndicator,
  SafeAreaView,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import axios from "axios";

// ============ CONFIG WARNA ============
const C = {
  brand: "#42909b",
  bg: "#ffffff",
  text: "#0f172a",
  sub: "#475569",
  border: "#e5e7eb",
  soft: "#f8fafc",
  pill: "#f3f4f6",
  holiday: "#dc2626",
  sunday: "#dc2626",
};

// ============ UTIL ============
const WEEK_DAYS = ["Ahad", "Senin", "Selasa", "Rabu", "Kamis", "Jumat", "Sabtu"];
const CELL = 7;

function addMonths(d: Date, delta: number) {
  return new Date(d.getFullYear(), d.getMonth() + delta, 1);
}
function titleId(d: Date) {
  return d.toLocaleDateString("id-ID", {
    month: "long",
    year: "numeric",
    timeZone: "Asia/Jakarta",
  });
}
function ymdLocal(d: Date) {
  const y = d.getFullYear();
  const m = d.getMonth() + 1;
  const day = d.getDate();
  return `${y}-${m < 10 ? "0" + m : m}-${day < 10 ? "0" + day : day}`;
}
function toISODateOnly(raw: any): string | null {
  if (!raw && raw !== 0) return null;

  if (raw instanceof Date) return ymdLocal(raw);
  if (typeof raw === "number") return ymdLocal(new Date(raw));

  if (typeof raw === "string") {
    const s = raw.trim();

    // YYYY-MM-DD / YYYY-MM-DDTHH:mm:ss
    const mIso = s.match(/^(\d{4})-(\d{2})-(\d{2})/);
    if (mIso) return `${mIso[1]}-${mIso[2]}-${mIso[3]}`;

    // YYYY/MM/DD
    const mSlashY = s.match(/^(\d{4})\/(\d{1,2})\/(\d{1,2})$/);
    if (mSlashY) {
      const y = mSlashY[1];
      const m = mSlashY[2].padStart(2, "0");
      const d = mSlashY[3].padStart(2, "0");
      return `${y}-${m}-${d}`;
    }

    // DD-MM-YYYY atau DD/MM/YYYY
    const mDmy = s.match(/^(\d{1,2})[\/-](\d{1,2})[\/-](\d{4})$/);
    if (mDmy) {
      const d = mDmy[1].padStart(2, "0");
      const m = mDmy[2].padStart(2, "0");
      const y = mDmy[3];
      return `${y}-${m}-${d}`;
    }

    // YYYY-MM-DD HH:mm:ss
    const mSql = s.match(/^(\d{4})-(\d{2})-(\d{2})\s+(\d{2}):(\d{2}):(\d{2})$/);
    if (mSql) return `${mSql[1]}-${mSql[2]}-${mSql[3]}`;
  }

  return null;
}
function parseAsDateAtLocalMidnight(isoDate: string | null): Date | null {
  if (!isoDate) return null;
  const d = new Date(`${isoDate}T00:00:00`);
  return isNaN(d.getTime()) ? null : d;
}

// ============ API CONFIG ============
const API_BASE =
  Platform.OS === "android" ? "http://10.0.2.2:8000/api" : "http://localhost:8000/api";

const KALENDER_URL = `${API_BASE}/kalender-akademik`;

// Bentuk data yang dipakai UI
type CalEvent = {
  id?: number;
  title: string;
  startDate: string; // YYYY-MM-DD
  endDate?: string | null; // YYYY-MM-DD | null
};

// Loader bulan tertentu
async function fetchMonthEvents(year: number, monthIndex0: number) {
  const month1 = monthIndex0 + 1;
  const url = `${KALENDER_URL}?year=${year}&month=${month1}`;

  try {
    const { data } = await axios.get(url, { timeout: 15000 });
    const list = (data?.data ?? data ?? []) as any[];

    return list.map((it) => {
      const startISO =
        toISODateOnly(it.tanggal_mulai) ??
        toISODateOnly(it.startDate) ??
        toISODateOnly(it.date) ??
        toISODateOnly(it.tanggal) ??
        toISODateOnly(it.tgl);

      const endISO =
        toISODateOnly(it.tanggal_selesai) ??
        toISODateOnly(it.endDate) ??
        null;

      return {
        id: it.id ?? it.ID ?? it.event_id,
        title: it.judul ?? it.title ?? it.nama ?? it.kegiatan ?? "(Tanpa judul)",
        startDate: startISO ?? "", // wajib
        endDate: endISO, // bisa null
      } as CalEvent;
    }).filter((e) => e.startDate); // buang yang tidak punya tanggal mulai
  } catch (err: any) {
    const status = err?.response?.status;
    const payload = err?.response?.data;
    const msg = status
      ? `HTTP ${status} – ${typeof payload === "string" ? payload : JSON.stringify(payload)}`
      : err?.message ?? "Network error";
    throw new Error(`Gagal memuat kalender (${msg})`);
  }
}

// Buat map tanggal->true untuk highlight di bulan yang sedang ditampilkan
function buildHighlightSet(events: CalEvent[], monthStart: Date, monthEnd: Date) {
  const set = new Set<string>();
  for (const ev of events) {
    const s = parseAsDateAtLocalMidnight(ev.startDate);
    const e = parseAsDateAtLocalMidnight(ev.endDate ?? ev.startDate);
    if (!s || !e) continue;

    // Ambil irisan dengan bulan aktif
    const start = s < monthStart ? monthStart : s;
    const end = e > monthEnd ? monthEnd : e;

    // Loop per hari (jumlah hari/bulan kecil, aman)
    const cur = new Date(start);
    while (cur <= end) {
      set.add(ymdLocal(cur));
      cur.setDate(cur.getDate() + 1);
    }
  }
  return set;
}

// ============ HOOK GRID ============
function useCalendar(cursor: Date, events: CalEvent[]) {
  return useMemo(() => {
    const year = cursor.getFullYear();
    const month = cursor.getMonth();

    const first = new Date(year, month, 1);
    const last = new Date(year, month + 1, 0);
    const daysInMonth = last.getDate();

    const leading = (first.getDay() + 7) % 7;
    const totalCells = Math.ceil((leading + daysInMonth) / 7) * 7;

    const start = new Date(year, month, 1 - leading);
    const highlightSet = buildHighlightSet(events, first, last);

    const cells = Array.from({ length: totalCells }, (_, i) => {
      const d = new Date(start);
      d.setDate(start.getDate() + i);
      const iso = ymdLocal(d);
      return {
        key: iso,
        date: d,
        inMonth: d.getMonth() === month,
        isSunday: d.getDay() === 0,
        isHoliday: highlightSet.has(iso),
      };
    });

    return { cells, title: titleId(cursor) };
  }, [cursor, events]);
}

// ============ MAIN ============
export default function KalenderPendidikan() {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [events, setEvents] = useState<CalEvent[] | null>(null);

  // Fetch setiap ganti bulan
  useEffect(() => {
    let cancelled = false;
    (async () => {
      try {
        setLoading(true);
        setError(null);
        const y = cursor.getFullYear();
        const m0 = cursor.getMonth();
        const data = await fetchMonthEvents(y, m0);
        if (!cancelled) setEvents(data ?? []);
      } catch (e: any) {
        if (!cancelled) {
          setEvents([]);
          setError(e?.message ?? "Gagal memuat kalender.");
        }
      } finally {
        !cancelled && setLoading(false);
      }
    })();
    return () => {
      cancelled = true;
    };
  }, [cursor]);

  const monthEvents = events ?? [];
  const { cells, title } = useCalendar(cursor, monthEvents);

  return (
    <SafeAreaView style={s.container}>
      {/* HEADER */}
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
              return (
                <View key={c.key} style={s.cell}>
                  <Text
                    style={[
                      s.dayText,
                      !c.inMonth && { color: "#94a3b8" },
                      c.inMonth && c.isSunday && { color: C.sunday, fontWeight: "700" },
                      c.isHoliday && c.inMonth && { color: C.holiday, fontWeight: "800" },
                    ]}
                  >
                    {day}
                  </Text>
                  {c.isHoliday && c.inMonth && <Text style={s.holidayDot}>●</Text>}
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
          <View
            style={{
              padding: 8,
              borderRadius: 8,
              borderColor: "#fecaca",
              borderWidth: 1,
              backgroundColor: "#fff1f2",
            }}
          >
            <Text style={{ color: "#b91c1c", marginBottom: 8 }}>
              Gagal memuat kalender: {error}
            </Text>
            <TouchableOpacity
              onPress={() => setCursor((d) => new Date(d))}
              style={{
                alignSelf: "flex-start",
                paddingHorizontal: 12,
                paddingVertical: 6,
                borderRadius: 8,
                backgroundColor: "#ef4444",
              }}
            >
              <Text style={{ color: "#fff", fontWeight: "700" }}>Coba lagi</Text>
            </TouchableOpacity>
          </View>
        )}

        {/* Daftar Libur & Kegiatan */}
        <View style={s.section}>
          <Text style={s.sectionTitle}>Hari Libur & Kegiatan</Text>
          {monthEvents.length === 0 ? (
            <Text style={s.emptyText}>Tidak ada libur/kegiatan bulan ini.</Text>
          ) : (
            monthEvents.map((h) => {
              const sISO = toISODateOnly(h.startDate);
              const eISO = toISODateOnly(h.endDate ?? h.startDate);
              const sd = parseAsDateAtLocalMidnight(sISO);
              const ed = parseAsDateAtLocalMidnight(eISO);

              // Format label tanggal
              let label = String(h.startDate || "");
              if (sd && ed) {
                const sameDay = sd.getTime() === ed.getTime();
                const tglS = sd.getDate();
                const blnS = sd.toLocaleDateString("id-ID", { month: "short" });
                const thS = sd.getFullYear();

                if (sameDay) {
                  const hari = sd.toLocaleDateString("id-ID", { weekday: "long" });
                  label = `${hari}, ${tglS} ${blnS} ${thS}`;
                } else {
                  const tglE = ed.getDate();
                  const blnE = ed.toLocaleDateString("id-ID", { month: "short" });
                  const thE = ed.getFullYear();
                  label = `${tglS} ${blnS} ${thS} – ${tglE} ${blnE} ${thE}`;
                }
              }

              return (
                <View key={(h.id ?? 0) + h.title + (h.startDate ?? "")} style={s.holidayRow}>
                  <View style={s.holidayDateBox}>
                    <Text style={s.holidayMon}>
                      {sd ? sd.toLocaleDateString("id-ID", { month: "short" }) : "-"}
                    </Text>
                    <Text style={s.holidayDay}>{sd ? sd.getDate() : "-"}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.holidayTitle}>{h.title}</Text>
                    <Text style={s.holidaySub}>{label}</Text>
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

// ============ STYLES ============
const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

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
