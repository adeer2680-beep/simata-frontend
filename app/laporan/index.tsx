import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
  Platform,
  Alert,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";
import AsyncStorage from '@react-native-async-storage/async-storage';

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface ReportRow {
  tanggal: string;
  datang: string;
  pulang: string;
  keterangan?: string;
  isIjin?: boolean;
}

const getApiBaseUrl = (): string => {
  const LOCAL_IP = "192.168.1.100"; // Ganti sesuai IP lokal backend
  const PORT = 8000;

  if (Platform.OS === "web") {
    return `http://localhost:${PORT}/api`;
  } else if (Platform.OS === "android") {
    return `http://10.0.2.2:${PORT}/api`;
  } else {
    return `http://${LOCAL_IP}:${PORT}/api`;
  }
};

export default function LaporanScreen() {
  const navigation = useNavigation();
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth());
  const [year, setYear] = useState<number>(now.getFullYear());
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  const API_BASE_URL = getApiBaseUrl();

  // Ambil token dari AsyncStorage
  const getAuthToken = async (): Promise<string | null> => {
    try {
      console.log("===== CHECKING ASYNCSTORAGE =====");
      const allKeys = await AsyncStorage.getAllKeys();
      console.log("All AsyncStorage keys:", allKeys);

      const tokenKeys = ["auth.token", "userToken", "token", "auth_token", "access_token"];
      for (const key of tokenKeys) {
        const value = await AsyncStorage.getItem(key);
        if (value) {
          console.log(`Token found with key: ${key}`);
          console.log(`Token length: ${value.length}`);
          console.log(`Token preview: ${value.slice(0, 40)}...`);
          await AsyncStorage.setItem("auth.token", value);
          return value;
        }
      }
      console.warn("⚠️ Tidak ada token ditemukan di AsyncStorage");
      return null;
    } catch (error) {
      console.error("Error getting token:", error);
      return null;
    }
  };

  // Validasi token ke /profile
  const validateToken = async (token: string): Promise<boolean> => {
    try {
      console.log("Validating token with /profile endpoint...");
      const response = await fetch(`${API_BASE_URL}/profile`, {
        headers: { Authorization: `Bearer ${token}` },
      });
      if (response.ok) {
        const data = await response.json();
        console.log("Token valid, User:", data?.user?.name || data?.name);
        return true;
      } else {
        console.warn("Token invalid (HTTP", response.status, ")");
        return false;
      }
    } catch (e) {
      console.error("Error validating token:", e);
      return false;
    }
  };

  const fetchPresensi = async () => {
    try {
      setLoading(true);
      setError("");

      const token = await getAuthToken();

      console.log("===== AUTH STATUS =====");
      console.log("Token available:", token ? "✅ YES" : "❌ NO");

      if (!token) {
        setError("Silakan login terlebih dahulu untuk melihat laporan");
        setLoading(false);
        return;
      }

      const isValid = await validateToken(token);
      if (!isValid) {
        setError("Token tidak valid, silakan login kembali");
        await AsyncStorage.removeItem("auth.token");
        setLoading(false);
        return;
      }

      console.log("===== FETCHING DATA =====");
      const bulan = String(month + 1).padStart(2, "0");
      console.log("Bulan:", bulan, "Tahun:", year);

      const presensiUrl = `${API_BASE_URL}/presensi/laporan?bulan=${bulan}&tahun=${year}`;
      const ijinUrl = `${API_BASE_URL}/ijins`;

      console.log("Presensi URL:", presensiUrl);
      console.log("Ijin URL:", ijinUrl);

      const headers = {
        Accept: "application/json",
        "Content-Type": "application/json",
        Authorization: `Bearer ${token}`,
      };

      // Fetch presensi
      const presensiResponse = await fetch(presensiUrl, { headers });
      console.log("Presensi Status:", presensiResponse.status);

      let presensiData: any[] = [];
      if (presensiResponse.ok) {
        const data = await presensiResponse.json();
        console.log("Presensi Response:", JSON.stringify(data, null, 2));
        if (Array.isArray(data)) presensiData = data;
        else if (data.data && Array.isArray(data.data)) presensiData = data.data;
        else if (typeof data === "object") presensiData = Object.values(data);
      } else {
        console.warn("Presensi gagal:", await presensiResponse.text());
      }

      // Fetch ijin
      let ijinData: any[] = [];
      const ijinResponse = await fetch(ijinUrl, { headers });
      console.log("Ijin Status:", ijinResponse.status);
      if (ijinResponse.ok) {
        const data = await ijinResponse.json();
        console.log("Ijin Response:", JSON.stringify(data, null, 2));
        const allIjin = Array.isArray(data)
          ? data
          : Array.isArray(data.data)
          ? data.data
          : Object.values(data);
        ijinData = allIjin.filter((item: any) => {
          const tgl = new Date(item.tanggal);
          return tgl.getMonth() === month && tgl.getFullYear() === year;
        });
      }

      const presensiRows: ReportRow[] = presensiData.map((item) => ({
        tanggal: item.tanggal || item.date || "-",
        datang: item.datang || item.jam_datang || item.check_in || "-",
        pulang: item.pulang || item.jam_pulang || item.check_out || "-",
        isIjin: false,
      }));

      const ijinRows: ReportRow[] = ijinData.map((item) => ({
        tanggal: item.tanggal || item.date || "-",
        datang: "IJIN",
        pulang: item.keterangan || item.description || "-",
        keterangan: item.keterangan,
        isIjin: true,
      }));

      const allRows = [...presensiRows, ...ijinRows].sort(
        (a, b) => new Date(a.tanggal).getTime() - new Date(b.tanggal).getTime()
      );

      console.log("===== SUMMARY =====");
      console.log("Total Presensi:", presensiRows.length);
      console.log("Total Ijin:", ijinRows.length);
      console.log("Total Rows:", allRows.length);

      setRows(allRows);
      if (allRows.length === 0) setError("Tidak ada data untuk bulan dan tahun yang dipilih");
    } catch (err: any) {
      console.error("=== ERROR FETCHING PRESENSI ===");
      console.error(err);
      setError("Gagal memuat data. Pastikan Laravel API sedang berjalan di " + API_BASE_URL);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresensi();
  }, [month, year]);

  return (
    <SafeAreaView style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity onPress={() => navigation.goBack()} style={styles.backButton}>
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Laporan Presensi</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
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

        <Text style={styles.caption}>
          Menampilkan: {MONTHS[month]} {year}
        </Text>

        <View style={styles.infoBox}>
          <Text style={styles.infoText}>API: {API_BASE_URL}</Text>
          <Text style={styles.infoText}>Data: {rows.length} baris</Text>
        </View>

        {loading ? (
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#42909b" />
            <Text style={styles.loadingText}>Memuat data...</Text>
          </View>
        ) : error && rows.length === 0 ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity onPress={fetchPresensi} style={styles.retryButton}>
              <Text style={styles.retryText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHead}>
              <Text style={[styles.cell, styles.head, styles.cellDate]}>Tanggal</Text>
              <Text style={[styles.cell, styles.head]}>Datang</Text>
              <Text style={[styles.cell, styles.head]}>Pulang</Text>
            </View>

            {rows.length > 0 ? (
              rows.map((row, index) => (
                <View key={`${row.tanggal}-${index}`} style={[styles.tableRow, row.isIjin && styles.tableRowIjin]}>
                  <Text style={[styles.cell, styles.cellDate]}>{row.tanggal}</Text>
                  <Text style={[styles.cell, row.isIjin && styles.cellIjin]}>{row.datang}</Text>
                  <Text style={styles.cell}>{row.pulang}</Text>
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
  container: { flex: 1, backgroundColor: "#f5f5f5" },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#42909b",
    paddingVertical: 16,
    paddingHorizontal: 16,
    elevation: 4,
  },
  backButton: { width: 40, height: 40, alignItems: "center", justifyContent: "center", marginRight: 8 },
  backIcon: { fontSize: 24, color: "#fff", fontWeight: "600" },
  headerTitle: { fontSize: 20, fontWeight: "700", color: "#fff" },
  content: { padding: 16 },
  caption: { marginTop: 8, marginBottom: 12, color: "#666", fontSize: 14, fontWeight: "500" },
  infoBox: {
    backgroundColor: "#e3f2fd",
    padding: 12,
    borderRadius: 8,
    marginBottom: 16,
    borderLeftWidth: 4,
    borderLeftColor: "#42909b",
  },
  infoText: { fontSize: 12, color: "#555", marginVertical: 2 },
  dropdownRow: { flexDirection: "row", gap: 10, marginBottom: 8, maxWidth: 400 },
  dropdownBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fff",
    overflow: "hidden",
    paddingTop: 18,
    elevation: 2,
    height: 60,
  },
  dropdownLabel: { position: "absolute", top: 6, left: 10, fontSize: 10, color: "#42909b", fontWeight: "600" },
  picker: { height: 42 },
  loadingContainer: { paddingVertical: 60, alignItems: "center", justifyContent: "center" },
  loadingText: { marginTop: 12, color: "#666", fontSize: 14 },
  errorContainer: {
    paddingVertical: 40,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  errorText: { color: "#d32f2f", fontSize: 14, marginBottom: 16, textAlign: "center", paddingHorizontal: 20 },
  retryButton: { backgroundColor: "#42909b", paddingHorizontal: 24, paddingVertical: 10, borderRadius: 8 },
  retryText: { color: "#fff", fontSize: 14, fontWeight: "600" },
  table: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    backgroundColor: "#fff",
  },
  tableHead: { flexDirection: "row", backgroundColor: "#42909b", paddingVertical: 14 },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderColor: "#f0f0f0",
  },
  tableRowIjin: { backgroundColor: "#fff9e6" },
  cell: { flex: 1, textAlign: "center", fontSize: 14, color: "#333" },
  cellDate: { flex: 1.5 },
  cellIjin: { fontWeight: "600", color: "#f57c00" },
  head: { fontWeight: "700", color: "#fff", fontSize: 14 },
  emptyRow: { paddingVertical: 40, alignItems: "center" },
  emptyText: { color: "#999", fontSize: 14 },
});
