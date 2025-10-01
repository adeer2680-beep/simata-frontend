import React, { useState, useEffect } from "react";
import {
  SafeAreaView,
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  ScrollView,
  TouchableOpacity,
} from "react-native";
import { Picker } from "@react-native-picker/picker";
import { useNavigation } from "@react-navigation/native";

const MONTHS = [
  "January", "February", "March", "April", "May", "June",
  "July", "August", "September", "October", "November", "December",
];

interface ReportRow {
  tanggal: string;
  datang: string;
  pulang: string;
}

// Ganti dengan URL API Anda
const API_BASE_URL = "https://your-api-url.com/api";

export default function LaporanScreen() {
  const navigation = useNavigation();
  const now = new Date();
  const [month, setMonth] = useState<number>(now.getMonth());
  const [year, setYear] = useState<number>(now.getFullYear());
  const [rows, setRows] = useState<ReportRow[]>([]);
  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");

  // Fungsi untuk fetch data presensi
  const fetchPresensi = async () => {
    try {
      setLoading(true);
      setError("");
      
      // Format bulan: 01-12
      const bulan = String(month + 1).padStart(2, "0");
      
      // Sesuaikan endpoint dengan API Anda
      const response = await fetch(
        `${API_BASE_URL}/presensi/laporan?bulan=${bulan}&tahun=${year}`,
        {
          method: "GET",
          headers: {
            "Content-Type": "application/json",
            // Tambahkan token jika diperlukan
            // "Authorization": `Bearer ${yourToken}`,
          },
        }
      );

      if (!response.ok) {
        throw new Error("Gagal mengambil data presensi");
      }

      const data = await response.json();
      
      // Sesuaikan dengan struktur response API Anda
      // Contoh jika response: { success: true, data: [...] }
      const presensiData = data.data || data;
      
      // Transform data ke format yang sesuai
      const formattedData: ReportRow[] = presensiData.map((item: any) => ({
        tanggal: item.tanggal || item.date,
        datang: item.jam_datang || item.check_in || "-",
        pulang: item.jam_pulang || item.check_out || "-",
      }));
      
      setRows(formattedData);
    } catch (err) {
      console.error("Error fetching presensi:", err);
      setError("Gagal memuat data presensi");
      setRows([]);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchPresensi();
  }, [month, year]);

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <TouchableOpacity 
          onPress={() => navigation.goBack()}
          style={styles.backButton}
        >
          <Text style={styles.backIcon}>←</Text>
        </TouchableOpacity>
        <Text style={styles.headerTitle}>Laporan Presensi</Text>
      </View>

      <ScrollView contentContainerStyle={styles.content}>
        {/* Dropdown Bulan/Tahun */}
        <View style={styles.dropdownRow}>
          <View style={styles.dropdownBox}>
            <Text style={styles.dropdownLabel}>Bulan</Text>
            <Picker
              selectedValue={month}
              onValueChange={(v) => setMonth(Number(v))}
              style={styles.picker}
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
              style={styles.picker}
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
          <View style={styles.loadingContainer}>
            <ActivityIndicator size="large" color="#42909b" />
            <Text style={styles.loadingText}>Memuat data...</Text>
          </View>
        ) : error ? (
          <View style={styles.errorContainer}>
            <Text style={styles.errorText}>{error}</Text>
            <TouchableOpacity 
              onPress={fetchPresensi}
              style={styles.retryButton}
            >
              <Text style={styles.retryText}>Coba Lagi</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <View style={styles.table}>
            <View style={styles.tableHead}>
              <Text style={[styles.cell, styles.head, styles.cellDate]}>
                Tanggal
              </Text>
              <Text style={[styles.cell, styles.head]}>Datang</Text>
              <Text style={[styles.cell, styles.head]}>Pulang</Text>
            </View>

            {rows.length > 0 ? (
              rows.map((row) => (
                <View key={row.tanggal} style={styles.tableRow}>
                  <Text style={[styles.cell, styles.cellDate]}>{row.tanggal}</Text>
                  <Text style={styles.cell}>{row.datang}</Text>
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
  container: {
    flex: 1,
    backgroundColor: "#f5f5f5",
  },
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: "#42909b",
    paddingVertical: 16,
    paddingHorizontal: 16,
    elevation: 4,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 4,
  },
  backButton: {
    width: 40,
    height: 40,
    alignItems: "center",
    justifyContent: "center",
    marginRight: 8,
  },
  backIcon: {
    fontSize: 24,
    color: "#fff",
    fontWeight: "600",
  },
  headerTitle: {
    fontSize: 20,
    fontWeight: "700",
    color: "#fff",
  },
  content: {
    padding: 16,
  },
  caption: {
    marginTop: 8,
    marginBottom: 16,
    color: "#666",
    fontSize: 14,
    fontWeight: "500",
  },
  dropdownRow: {
    flexDirection: "row",
    gap: 10,
    marginBottom: 8,
    maxWidth: 400,
  },
  dropdownBox: {
    flex: 1,
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 10,
    backgroundColor: "#fff",
    overflow: "hidden",
    paddingTop: 18,
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    height: 60,
  },
  dropdownLabel: {
    position: "absolute",
    top: 6,
    left: 10,
    fontSize: 10,
    color: "#42909b",
    zIndex: 1,
    backgroundColor: "#fff",
    paddingHorizontal: 3,
    fontWeight: "600",
  },
  picker: {
    height: 42,
  },
  loadingContainer: {
    paddingVertical: 60,
    alignItems: "center",
    justifyContent: "center",
  },
  loadingText: {
    marginTop: 12,
    color: "#666",
    fontSize: 14,
  },
  errorContainer: {
    paddingVertical: 40,
    alignItems: "center",
    backgroundColor: "#fff",
    borderRadius: 12,
    borderWidth: 1,
    borderColor: "#ddd",
  },
  errorText: {
    color: "#d32f2f",
    fontSize: 14,
    marginBottom: 16,
  },
  retryButton: {
    backgroundColor: "#42909b",
    paddingHorizontal: 24,
    paddingVertical: 10,
    borderRadius: 8,
  },
  retryText: {
    color: "#fff",
    fontSize: 14,
    fontWeight: "600",
  },
  table: {
    borderWidth: 1,
    borderColor: "#ddd",
    borderRadius: 12,
    overflow: "hidden",
    backgroundColor: "#fff",
    elevation: 2,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 3,
  },
  tableHead: {
    flexDirection: "row",
    backgroundColor: "#42909b",
    paddingVertical: 14,
  },
  tableRow: {
    flexDirection: "row",
    backgroundColor: "#fff",
    paddingVertical: 14,
    paddingHorizontal: 8,
    borderTopWidth: 1,
    borderColor: "#f0f0f0",
  },
  cell: {
    flex: 1,
    textAlign: "center",
    fontSize: 14,
    color: "#333",
  },
  cellDate: {
    flex: 1.5,
  },
  head: {
    fontWeight: "700",
    color: "#fff",
    fontSize: 14,
  },
  emptyRow: {
    paddingVertical: 40,
    alignItems: "center",
  },
  emptyText: {
    color: "#999",
    fontSize: 14,
  },
});