import React, { useState } from "react";
import { View, Text, StyleSheet, ScrollView, Dimensions } from "react-native";
import { PieChart } from "react-native-chart-kit";

const screenWidth = Dimensions.get("window").width;

export default function DashboardGuru() {
  // Data dummy
  const [guru] = useState({
    nama: "Tiara Difa",
    unit: "FTI",
  });

  const [laporanPresensi] = useState({
    bulan: "Oktober",
    tahun: 2025,
    totalHadir: 18,
    totalPulang: 18,
  });

  const [laporanIzin] = useState({
    totalIzin: 2,
  });

  // Data untuk Pie Chart
  const data = [
    {
      name: "Hadir",
      jumlah: laporanPresensi.totalHadir,
      color: "#4CAF50",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Pulang",
      jumlah: laporanPresensi.totalPulang,
      color: "#FFB300",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
    {
      name: "Izin",
      jumlah: laporanIzin.totalIzin,
      color: "#F44336",
      legendFontColor: "#333",
      legendFontSize: 14,
    },
  ];

  return (
    <ScrollView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Dashboard Guru</Text>
        <Text style={styles.headerSubtitle}>
          {guru.nama} - {guru.unit}
        </Text>
      </View>

      {/* Statistik Bulanan */}
      <View style={styles.card}>
        <Text style={styles.cardTitle}>Statistik Bulan Ini</Text>
        <Text style={styles.cardSubtitle}>
          {laporanPresensi.bulan} {laporanPresensi.tahun}
        </Text>

        {/* Diagram Lingkaran */}
        <PieChart
          data={data}
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
      </View>

      {/* Info tambahan */}
      <View style={styles.infoCard}>
        <Text style={styles.infoText}>
          Diagram ini menampilkan perbandingan total hadir, pulang, dan izin Anda selama bulan ini.
        </Text>
      </View>
    </ScrollView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: "#F9FAFB",
  },
  header: {
    backgroundColor: "#42909b",
    paddingVertical: 40,
    alignItems: "center",
    borderBottomLeftRadius: 30,
    borderBottomRightRadius: 30,
    marginBottom: 20,
  },
  headerTitle: {
    fontSize: 22,
    fontWeight: "700",
    color: "#fff",
  },
  headerSubtitle: {
    fontSize: 16,
    color: "#e3f2f4",
    marginTop: 6,
  },
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
