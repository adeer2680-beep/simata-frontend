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
  TextInput,
  Alert,
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
  pill: "#f3f4f6",       // ✅ ditambahkan agar tidak error
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

// ============ API CONFIG ============
const API_BASE =
  Platform.OS === "android"
    ? "http://10.0.2.2:8000/api" // emulator Android
    : "http://localhost:8000/api"; // web/iOS simulator

const KALENDER_URL = `${API_BASE}/kalender-akademik`;

// Bentuk data yang dipakai UI
type CalEvent = { id?: number; date: string; title: string };

// ADMIN toggle (sementara hardcode; nanti ganti sesuai role login)
const IS_ADMIN = true;

// Loader bulan tertentu
async function fetchMonthEvents(year: number, monthIndex0: number) {
  const month1 = monthIndex0 + 1;
  const url = `${KALENDER_URL}?year=${year}&month=${month1}`;

  try {
    const { data } = await axios.get(url, { timeout: 15000 });
    // Normalisasi bentuk data agar fleksibel
    const list = (data?.data ?? data ?? []) as any[];
    return list.map((it) => ({
      id: it.id ?? it.ID ?? it.event_id,
      date: it.date ?? it.tanggal ?? it.tgl,
      title: it.title ?? it.nama ?? it.kegiatan,
    })) as CalEvent[];
  } catch (err: any) {
    const status = err?.response?.status;
    const payload = err?.response?.data;
    const msg = status
      ? `HTTP ${status} – ${typeof payload === "string" ? payload : JSON.stringify(payload)}`
      : err?.message ?? "Network error";
    throw new Error(`Gagal memuat kalender (${msg})`);
  }
}

// CRUD helpers
async function createEvent(ev: CalEvent) {
  const { data } = await axios.post(KALENDER_URL, ev, { timeout: 15000 });
  return data?.data ?? data;
}
async function updateEvent(id: number, ev: CalEvent) {
  const { data } = await axios.put(`${KALENDER_URL}/${id}`, ev, { timeout: 15000 });
  return data?.data ?? data;
}
async function deleteEvent(id: number) {
  await axios.delete(`${KALENDER_URL}/${id}`, { timeout: 15000 });
}

// ============ HOOK GRID ============
function useCalendar(cursor: Date, holidays: CalEvent[]) {
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

// ============ FORM KECIL (Tambah/Edit) ============
function EventForm({
  value,
  onCancel,
  onSubmit,
  busy,
}: {
  value: CalEvent;
  onCancel: () => void;
  onSubmit: (v: CalEvent) => void;
  busy: boolean;
}) {
  const [local, setLocal] = useState<CalEvent>(value);

  useEffect(() => setLocal(value), [value]);

  return (
    <View style={s.formBox}>
      <Text style={s.formTitle}>{value?.id ? "Edit Kegiatan" : "Tambah Kegiatan"}</Text>

      <Text style={s.label}>Tanggal (YYYY-MM-DD)</Text>
      <TextInput
        placeholder="2025-10-01"
        placeholderTextColor={C.sub}
        value={local.date}
        onChangeText={(t) => setLocal((p) => ({ ...p, date: t }))}
        style={s.input}
      />

      <Text style={[s.label, { marginTop: 10 }]}>Judul</Text>
      <TextInput
        placeholder="Ujian Tengah Semester"
        placeholderTextColor={C.sub}
        value={local.title}
        onChangeText={(t) => setLocal((p) => ({ ...p, title: t }))}
        style={s.input}
      />

      <View style={{ flexDirection: "row", gap: 8, marginTop: 12 }}>
        <TouchableOpacity
          onPress={onCancel}
          disabled={busy}
          style={[s.btn, { backgroundColor: C.soft, borderColor: C.border }]}
        >
          <Text>Batalkan</Text>
        </TouchableOpacity>
        <TouchableOpacity
          onPress={() => onSubmit(local)}
          disabled={busy}
          style={[s.btn, { backgroundColor: C.brand }]}
        >
          <Text style={{ color: "#fff", fontWeight: "700" }}>
            {busy ? "Menyimpan..." : "Simpan"}
          </Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

// ============ MAIN ============
export default function KalenderPendidikan() {
  const today = new Date();
  const [cursor, setCursor] = useState(new Date(today.getFullYear(), today.getMonth(), 1));
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [remoteHolidays, setRemoteHolidays] = useState<CalEvent[] | null>(null);

  // State Admin
  const [editing, setEditing] = useState<CalEvent | null>(null);
  const [submitting, setSubmitting] = useState(false);

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
        if (!cancelled) setRemoteHolidays(data?.length ? data : []);
      } catch (e: any) {
        if (!cancelled) {
          setRemoteHolidays([]);
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

  const monthHolidays = remoteHolidays ?? [];
  const { cells, title } = useCalendar(cursor, monthHolidays);

  // Submit tambah/edit
  async function submitEvent(val: CalEvent) {
    try {
      setSubmitting(true);
      if (val.id) await updateEvent(val.id, val);
      else await createEvent(val);
      // reload bulan sekarang
      setCursor((d) => new Date(d));
      setEditing(null);
    } catch (e: any) {
      Alert.alert("Gagal", e?.message ?? "Tidak bisa menyimpan.");
    } finally {
      setSubmitting(false);
    }
  }

  // Hapus
  async function removeEvent(id?: number, title?: string) {
    if (!id) return Alert.alert("Tidak bisa hapus", "Item ini tidak memiliki id.");
    Alert.alert("Hapus", `Hapus "${title ?? "item"}"?`, [
      { text: "Batal" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          try {
            await deleteEvent(id);
            setCursor((d) => new Date(d)); // reload
          } catch (e: any) {
            Alert.alert("Gagal", e?.message ?? "Tidak bisa menghapus.");
          }
        },
      },
    ]);
  }

  return (
    <SafeAreaView style={s.container}>
      {/* HEADER */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          activeOpacity={0.85}
          style={s.backBtn}
        >
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
                <Text style={[s.weekHeaderText, d === "Ahad" && { color: C.sunday }]}>
                  {d}
                </Text>
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
          {monthHolidays.length === 0 ? (
            <Text style={s.emptyText}>Tidak ada libur/kegiatan bulan ini.</Text>
          ) : (
            monthHolidays.map((h) => {
              const d = new Date(h.date);
              const tgl = d.getDate();
              const bln = d.toLocaleDateString("id-ID", { month: "short" });
              const hari = d.toLocaleDateString("id-ID", { weekday: "long" });
              return (
                <View key={(h.id ?? 0) + h.date + h.title} style={s.holidayRow}>
                  <View style={s.holidayDateBox}>
                    <Text style={s.holidayMon}>{bln}</Text>
                    <Text style={s.holidayDay}>{tgl}</Text>
                  </View>
                  <View style={{ flex: 1 }}>
                    <Text style={s.holidayTitle}>{h.title}</Text>
                    <Text style={s.holidaySub}>
                      {hari}, {tgl} {bln} {d.getFullYear()}
                    </Text>
                  </View>

                  {/* Tombol Admin per item */}
                  {IS_ADMIN && (
                    <View style={{ flexDirection: "row", gap: 8 }}>
                      <TouchableOpacity
                        onPress={() => setEditing({ id: h.id, date: h.date, title: h.title })}
                        style={s.itemBtn}
                      >
                        <Text>Edit</Text>
                      </TouchableOpacity>
                      <TouchableOpacity
                        onPress={() => removeEvent(h.id, h.title)}
                        style={[s.itemBtn, { backgroundColor: "#fee2e2" }]}
                      >
                        <Text style={{ color: "#b91c1c", fontWeight: "700" }}>Hapus</Text>
                      </TouchableOpacity>
                    </View>
                  )}
                </View>
              );
            })
          )}
        </View>

        {/* Panel Admin (Tambah / Form) */}
        {IS_ADMIN && (
          <View style={[s.section, { marginTop: 12 }]}>
            <Text style={s.sectionTitle}>Admin: Kelola Kegiatan</Text>

            {!editing && (
              <TouchableOpacity
                onPress={() => setEditing({ date: ymdLocal(today), title: "" })}
                style={{
                  alignSelf: "flex-start",
                  margin: 12,
                  paddingVertical: 10,
                  paddingHorizontal: 14,
                  borderRadius: 8,
                  backgroundColor: C.brand,
                }}
              >
                <Text style={{ color: "#fff", fontWeight: "700" }}>Tambah</Text>
              </TouchableOpacity>
            )}

            {editing && (
              <EventForm
                value={editing}
                busy={submitting}
                onCancel={() => setEditing(null)}
                onSubmit={submitEvent}
              />
            )}
          </View>
        )}

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

  // Admin
  formBox: {
    marginHorizontal: 12,
    marginBottom: 12,
    padding: 12,
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  formTitle: { fontWeight: "700", marginBottom: 8, color: C.text },
  label: { color: C.sub, marginBottom: 4, fontSize: 12 },
  input: {
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 8,
    paddingHorizontal: 12,
    paddingVertical: 10,
    color: C.text,
    backgroundColor: "#fff",
  },
  btn: { paddingVertical: 12, paddingHorizontal: 16, borderRadius: 8 },
  itemBtn: {
    paddingVertical: 6,
    paddingHorizontal: 10,
    borderRadius: 8,
    backgroundColor: C.pill,
  },
});
