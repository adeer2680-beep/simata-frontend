import React, { useState, useEffect, useCallback } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  RefreshControl,
  Platform,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

const MONTHS = [
  "January","February","March","April","May","June",
  "July","August","September","October","November","December",
];

interface RekapRow {
  nama: string;
  unit: string;        // diturunkan dari relasi unit?.nama atau fallback unit_id
  total_hadir: number;
  total_pulang: number;
}

type IndexResponse =
  | { message?: string; data?: any[] }
  | any[];

const API_BASE_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:8000/api"
    : "http://localhost:8000/api";

export default function LaporanScreen() {
  const navigation = useNavigation();
  const now = new Date();
  const [month, setMonth] = useState(now.getMonth());
  const [year, setYear] = useState(now.getFullYear());
  const [rows, setRows] = useState<RekapRow[]>([]);
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [error, setError] = useState("");
  const [refreshing, setRefreshing] = useState(false);

  const bulanParam = String(month + 1).padStart(2, "0");

  const fetchRekap = useCallback(async () => {
    try {
      setLoading(true);
      setError("");

      // kita minta filter bulan/tahun di index (lihat catatan controller di bawah)
      const url = `${API_BASE_URL}/laporan/presensi?bulan=${bulanParam}&tahun=${year}`;
      const res = await fetch(url, { headers: { "Content-Type": "application/json" } });

      if (!res.ok) {
        let msg = "Gagal mengambil rekap presensi";
        try {
          const ej = await res.json();
          if (ej?.message) msg = ej.message;
        } catch {}
        throw new Error(msg);
      }

      const json: IndexResponse = await res.json();
      const list = Array.isArray(json) ? json : json.data ?? [];

      const formatted: RekapRow[] = list.map((it: any) => ({
        nama: it.nama ?? "-",
        unit: it.unit?.nama ?? it.unit_name ?? String(it.unit_id ?? "-"),
        total_hadir: Number(it.total_hadir ?? 0),
        total_pulang: Number(it.total_pulang ?? 0),
      }));

      setRows(formatted);
    } catch (e: any) {
      setError(e?.message || "Gagal memuat rekap presensi");
      setRows([]);
    } finally {
      setLoading(false);
    }
  }, [bulanParam, year]);

  useEffect(() => {
    fetchRekap();
  }, [fetchRekap]);

  const onRefresh = useCallback(async () => {
    setRefreshing(true);
    await fetchRekap();
    setRefreshing(false);
  }, [fetchRekap]);

  const onGenerate = useCallback(async () => {
    try {
      setPosting(true);
      setError("");

      // controller kamu baca via $request->query(), jadi kirim sebagai query param
      const url = `${API_BASE_URL}/laporan/presensi/generate?bulan=${bulanParam}&tahun=${year}`;
      const res = await fetch(url, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
      });

      if (!res.ok) {
        let msg = "Gagal membuat rekap";
        try {
          const ej = await res.json();
          if (ej?.message) msg = ej.message;
        } catch {}
        throw new Error(msg);
      }

      // optional: kalau mau pakai pesan dari backend
      await res.json();
      // refresh tabel
      fetchRekap();
    } catch (e: any) {
      setError(e?.message || "Gagal membuat rekap");
    } finally {
      setPosting(false);
    }
  }, [bulanParam, year, fetchRekap]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Laporan Presensi</Text>
      </View>

      <ScrollView
        contentContainerStyle={styles.content}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
      >
        <View style={styles.dropdownRow}>
          <View style={styles.dropdownBox}>
            <Text style={styles.dropdownLabel}>Bulan</Text>
            <Picker selectedValue={month} onValueChange={(v) => setMonth(Number(v))} style={styles.picker}>
              {MONTHS.map((m, i) => (
                <Picker.Item key={m} label={m} value={i} />
              ))}
            </Picker>
          </View>

          <View style={styles.dropdownBox}>
            <Text style={styles.dropdownLabel}>Tahun</Text>
            <Picker selectedValue={year} onValueChange={(v) => setYear(Number(v))} style={styles.picker}>
              {[2024, 2025, 2026].map((y) => (
                <Picker.Item key={y} label={String(y)} value={y} />
              ))}
            </Picker>
          </View>
        </View>

        <View style={styles.actionsRow}>
          <Text style={styles.caption}>Menampilkan: {MONTHS[month]} {year}</Text>
          <TouchableOpacity onPress={onGenerate} style={[styles.generateBtn, posting && { opacity: 0.7 }]} disabled={posting}>
            {posting ? <ActivityIndicator size="small" color="#fff" /> : <Text style={styles.generateText}>Generate</Text>}
          </TouchableOpacity>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#42909b" />
            <Text style={styles.loadingText}>Memuat data...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchRekap} style={styles.retryButton}>
              <Text style={styles.retryText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHead}>
              <Text style={[styles.cell, styles.head, styles.cellWide]}>Nama</Text>
              <Text style={[styles.cell, styles.head, styles.cellWide]}>Unit</Text>
              <Text style={[styles.cell, styles.head]}>Hadir</Text>
              <Text style={[styles.cell, styles.head]}>Pulang</Text>
            </View>

            {rows.length > 0 ? (
              rows.map((row, idx) => (
                <View key={row.nama + row.unit + idx} style={styles.tableRow}>
                  <Text style={[styles.cell, styles.cellWide]}>{row.nama}</Text>
                  <Text style={[styles.cell, styles.cellWide]}>{row.unit}</Text>
                  <Text style={styles.cell}>{row.total_hadir}</Text>
                  <Text style={styles.cell}>{row.total_pulang}</Text>
                </View>
              ))
            ) : (
              <View style={styles.emptyRow}>
                <Text style={styles.emptyText}>Tidak ada data</Text>
              </View>
            )}
          </View>
        )}
      </ScrollView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container:{ flex:1, backgroundColor:"#f5f5f5" },
  header:{
    flexDirection:"row", alignItems:"center", backgroundColor:"#42909b",
    paddingVertical:16, paddingHorizontal:16, elevation:4,
    shadowColor:"#000", shadowOffset:{ width:0, height:2 },
    shadowOpacity:0.1, shadowRadius:4,
  },
  backButton:{ width:40, height:40, alignItems:"center", justifyContent:"center", marginRight:8 },
  backIcon:{ fontSize:24, color:"#fff", fontWeight:"600" },
  headerTitle:{ fontSize:20, fontWeight:"700", color:"#fff" },
  content:{ padding:16 },
  dropdownRow:{ flexDirection:"row", gap:10, marginBottom:8, maxWidth:500 },
  dropdownBox:{
    flex:1, borderWidth:1, borderColor:"#ddd", borderRadius:10, backgroundColor:"#fff",
    overflow:"hidden", paddingTop:18, elevation:2, shadowColor:"#000",
    shadowOffset:{ width:0, height:1 }, shadowOpacity:0.05, shadowRadius:2, height:60,
  },
  dropdownLabel:{
    position:"absolute", top:6, left:10, fontSize:10, color:"#42909b",
    zIndex:1, backgroundColor:"#fff", paddingHorizontal:3, fontWeight:"600",
  },
  picker:{ height:42 },
  actionsRow:{ flexDirection:"row", alignItems:"center", justifyContent:"space-between", marginTop:8, marginBottom:16 },
  caption:{ color:"#666", fontSize:14, fontWeight:"500" },
  generateBtn:{ backgroundColor:"#42909b", paddingHorizontal:16, paddingVertical:10, borderRadius:10 },
  generateText:{ color:"#fff", fontWeight:"700" },
  loadingContainer:{ paddingVertical:60, alignItems:"center", justifyContent:"center" },
  loadingText:{ marginTop:12, color:"#666", fontSize:14 },
  errorContainer:{
    paddingVertical:40, alignItems:"center", backgroundColor:"#fff",
    borderRadius:12, borderWidth:1, borderColor:"#ddd",
  },
  errorText:{ color:"#d32f2f", fontSize:14, marginBottom:16 },
  retryButton:{ backgroundColor:"#42909b", paddingHorizontal:24, paddingVertical:10, borderRadius:8 },
  retryText:{ color:"#fff", fontSize:14, fontWeight:"600" },
  table:{
    borderWidth:1, borderColor:"#ddd", borderRadius:12, overflow:"hidden",
    backgroundColor:"#fff", elevation:2, shadowColor:"#000",
    shadowOffset:{ width:0, height:1 }, shadowOpacity:0.05, shadowRadius:3,
  },
  tableHead:{ flexDirection:"row", backgroundColor:"#42909b", paddingVertical:14 },
  tableRow:{
    flexDirection:"row", backgroundColor:"#fff", paddingVertical:14,
    paddingHorizontal:8, borderTopWidth:1, borderColor:"#f0f0f0",
  },
  cell:{ flex:1, textAlign:"center", fontSize:14, color:"#333" },
  cellWide:{ flex:1.5 },
  head:{ fontWeight:"700", color:"#fff", fontSize:14 },
  emptyRow:{ paddingVertical:40, alignItems:"center" },
  emptyText:{ color:"#999", fontSize:14 },
});
