import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
} from "react-native";
import { Picker } from "@react-native-picker/picker";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

const MOCK_REPORT = [
  { tanggal: "2025-09-01", datang: "06.37.12", pulang: "14.33.01" },
  { tanggal: "2025-09-02", datang: "06.32.44", pulang: "14.57.12" },
  { tanggal: "2025-09-03", datang: "06.38.10", pulang: "15.18.25" },
  { tanggal: "2025-09-04", datang: "06.28.03", pulang: "14.53.56" },
  { tanggal: "2025-09-06", datang: "06.42.41", pulang: "-" },
];

export default function LaporanScreen() {
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<typeof MOCK_REPORT>([]);
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    setLoading(true);
    setTimeout(() => {
      setRows(MOCK_REPORT); // nanti ganti ke fetch API
      setLoading(false);
    }, 500);
  }, [month, year]);

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: "#fff" }}>
      <ScrollView contentContainerStyle={styles.content}>
        <Text style={styles.title}>Laporan Presensi</Text>

        {/* Dropdown Bulan/Tahun */}
        <View style={styles.dropdownRow}>
          <View style={styles.dropdownBox}>
            <Text style={styles.dropdownLabel}>Bulan</Text>
            <Picker
              selectedValue={month}
              onValueChange={(v) => setMonth(Number(v))}
            >
              {MONTHS.map((m, i) => (
                <Picker.Item key={m} label={m} value={i} />
              ))}
            </Picker>
          </View>

          <View style={styles.dropdownBox}>
            <Text style={styles.dropdownLabel}>Tahun</Text>
            <Picker
              selectedValue={year}
              onValueChange={(v) => setYear(Number(v))}
            >
              {[2024, 2025, 2026].map((y) => (
                <Picker.Item key={y} label={String(y)} value={y} />
              ))}
            </Picker>
          </View>
        </View>

        <Text style={styles.caption}>
          Menampilkan: {MONTHS[month]} {year}
        </Text>

        {/* Tabel */}
        {loading ? (
          <ActivityIndicator size="large" />
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHead}>
              <Text style={[styles.cell, styles.head, { flex: 1.2 }]}>
                Tanggal
              </Text>
              <Text style={[styles.cell, styles.head]}>Datang</Text>
              <Text style={[styles.cell, styles.head]}>Pulang</Text>
            </View>

            {rows.map((row) => (
              <View key={row.tanggal} style={styles.tableRow}>
                <Text style={[styles.cell, { flex: 1.2 }]}>{row.tanggal}</Text>
                <Text style={styles.cell}>{row.datang}</Text>
                <Text style={styles.cell}>{row.pulang}</Text>
              </View>
            ))}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  content: { padding: 16, gap: 12 },
  title: { fontSize: 20, fontWeight: "700", marginBottom: 8 },
  caption: { marginTop: 6, color: "#666" },

  dropdownRow: { flexDirection: "row", gap: 8, marginBottom: 10 },
  dropdownBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ccc",
    borderRadius: 8,
    backgroundColor: "#fafafa",
    overflow: "hidden",
  },
  dropdownLabel: {
    position: "absolute",
    top: 6,
    left: 10,
    fontSize: 10,
    color: "#666",
    zIndex: 1,
  },

  table: { borderWidth: 1, borderColor: "#ccc", borderRadius: 8, overflow: "hidden" },
  tableHead: { flexDirection: "row", backgroundColor: "#eee", paddingVertical: 8 },
  tableRow: { flexDirection: "row", backgroundColor: "#fff", paddingVertical: 10, borderTopWidth: 1, borderColor: "#eee" },
  cell: { flex: 1, textAlign: "center", fontSize: 13, color: "#111" },
  head: { fontWeight: "700" },
});
