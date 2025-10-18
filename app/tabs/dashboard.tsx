import React, { useState, useEffect } from "react";
import {
  View, Text, StyleSheet, ScrollView, Dimensions,
  ActivityIndicator, Alert, RefreshControl
} from "react-native";
import { PieChart } from "react-native-chart-kit";
import AsyncStorage from "@react-native-async-storage/async-storage";

const screenWidth = Dimensions.get("window").width;

// ⚙️ Ganti sesuai IP backend kamu
const API_BASE_URL = "http://localhost:8000/api";

export default function DashboardGuru() {
  const [guru, setGuru] = useState({ nama: "" });
  const [statistik, setStatistik] = useState({
    periode: "",
    datang: 0,
    pulang: 0,
    ijin: 0,
    hadir: 0,
  });
  const [loading, setLoading] = useState(true);
  const [refreshing, setRefreshing] = useState(false);

  // Ambil token
  const getAuthToken = async () => {
    try {
      return await AsyncStorage.getItem("authToken");
    } catch (error) {
      console.error("Error getting token:", error instanceof Error ? error.message : String(error));
      return null;
    }
  };

  // Ambil data dari backend /api/dashboard/statistik
  const fetchDashboardStatistik = async () => {
    try {
      const token = await getAuthToken();
      if (!token) {
        Alert.alert("Error", "Token tidak ditemukan. Silakan login kembali.");
        throw new Error("Token tidak ditemukan");
      }

      const now = new Date();
      const bulan = now.getMonth() + 1;
      const tahun = now.getFullYear();

      console.log(`Fetching: ${API_BASE_URL}/statistik?bulan=${bulan}&tahun=${tahun}`);

      const response = await fetch(
        `${API_BASE_URL}/statistik?bulan=${bulan}&tahun=${tahun}`,
        {
          headers: {
            Authorization: `Bearer ${token}`,
            Accept: "application/json",
          },
        }
      );

      if (!response.ok) {
        const errorText = await response.text();
        console.log("Response Error:", response.status, errorText);
        throw new Error(`Gagal mengambil data statistik (${response.status})`);
      }

      const data = await response.json();
      console.log("Data received:", data);

      // Sesuaikan struktur data backend
      setGuru({ nama: data.user?.username || "Guru" });
      setStatistik({
        periode: data.periode || "",
        datang: data.statistik?.datang || 0,
        pulang: data.statistik?.pulang || 0,
        ijin: data.statistik?.ijin || 0,
        hadir: data.statistik?.hadir || 0,
      });
    } catch (error) {
      console.error("Error:", error);
      const errorMessage = error instanceof Error ? error.message : "Tidak dapat memuat data dashboard";
      Alert.alert("Gagal", errorMessage);
    }
  };

  const loadAllData = async () => {
    setLoading(true);
    try {
      await fetchDashboardStatistik();
    } finally {
      setLoading(false);
    }
  };

  const onRefresh = async () => {
    setRefreshing(true);
    await loadAllData();
    setRefreshing(false);
  };

  useEffect(() => {
    loadAllData();
  }, []);

  const dataPresensi = [
    {
      name: "Datang",
      jumlah: statistik.datang,
      color: "#4CAF50",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Pulang",
      jumlah: statistik.pulang,
      color: "#FFB300",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
  ];

  const dataIjin = [
    {
      name: "Ijin",
      jumlah: statistik.ijin,
      color: "#F44336",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Hadir",
      jumlah: statistik.hadir,
      color: "#4CAF50",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
  ];

  if (loading) {
    return (
      <View style={styles.loadingContainer}>
        <ActivityIndicator size="large" color="#42909b" />
        <Text style={styles.loadingText}>Memuat data...</Text>
      </View>
    );
  }

  return (
    <ScrollView
      style={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={onRefresh}
          colors={["#42909b"]}
        />
      }
    >
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard Guru</Text>
        <Text style={styles.headerSubtitle}>
          {guru.nama} - {statistik.periode}
        </Text>
      </View>

      {/* Presensi */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Presensi Datang & Pulang</Text>
        <Text style={styles.cardSubtitle}>{statistik.periode}</Text>
        {statistik.datang > 0 || statistik.pulang > 0 ? (
          <PieChart
            data={dataPresensi}
            width={screenWidth - 32}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor={"jumlah"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            absolute
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Belum ada data presensi</Text>
          </View>
        )}
      </View>

      {/* Ijin */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Laporan Ijin</Text>
        <Text style={styles.cardSubtitle}>{statistik.periode}</Text>
        {statistik.ijin > 0 || statistik.hadir > 0 ? (
          <PieChart
            data={dataIjin}
            width={screenWidth - 32}
            height={220}
            chartConfig={{
              color: (opacity = 1) => `rgba(0, 0, 0, ${opacity})`,
            }}
            accessor={"jumlah"}
            backgroundColor={"transparent"}
            paddingLeft={"15"}
            absolute
          />
        ) : (
          <View style={styles.emptyState}>
            <Text style={styles.emptyText}>Belum ada data ijin</Text>
          </View>
        )}
      </View>

      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          Diagram pertama menampilkan perbandingan datang dan pulang. Diagram
          kedua menampilkan perbandingan ijin dengan total kehadiran.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: "#F9FAFB" },
  loadingContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#F9FAFB",
  },
  loadingText: { marginTop: 10, fontSize: 16, color: "#666" },
  header: {
    backgroundColor: "#42909b",
    paddingVertical: 40,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  headerTitle: { fontSize: 22, fontWeight: "700", color: "#fff" },
  headerSubtitle: { fontSize: 16, color: "#e3f2f4", marginTop: 6 },
  card: {
    backgroundColor: "#fff",
    marginHorizontal: 16,
    padding: 20,
    borderRadius: 16,
    shadowColor: "#000",
    shadowOpacity: 0.1,
    shadowOffset: { width: 0, height: 2 },
    shadowRadius: 6,
    elevation: 3,
    marginBottom: 16,
  },
  cardTitle: {
    fontSize: 18,
    fontWeight: "600",
    marginBottom: 4,
    color: "#222",
    textAlign: "center",
  },
  cardSubtitle: {
    fontSize: 15,
    color: "#777",
    textAlign: "center",
    marginBottom: 20,
  },
  emptyState: { paddingVertical: 40, alignItems: "center" },
  emptyText: { fontSize: 16, color: "#999" },
  infoCard: {
    backgroundColor: "#E7F3FF",
    padding: 16,
    borderRadius: 12,
    margin: 16,
  },
  infoText: {
    color: "#1E40AF",
    fontSize: 14,
    textAlign: "center",
    lineHeight: 20,
  },
});