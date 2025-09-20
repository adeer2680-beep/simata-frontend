import React, { useState } from "react";
import { View, Text, StyleSheet, TouchableOpacity } from "react-native";
import { router } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  bg: "#ffffff",
  soft: "#eef4ff",
  card: "#f3f4f6",
  text: "#0f172a",
  sub: "#475569",
  brand: "#0ea5a3",
  border: "#e5e7eb",
  shadow: "#00000020",
};

const OPTIONS = ["Guru", "Siswa", "Karyawan"]; // contoh; ganti sesuai kebutuhan

export default function PresensiHome() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<string | null>(null);

  return (
    <View style={styles.container}>
      {/* Dropdown */}
      <View style={styles.block}>
        <Text style={styles.blockTitle}>Pilih Jenis Presensi</Text>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.dropdown}
          onPress={() => setOpen((v) => !v)}
        >
          <Text style={styles.dropdownText}>
            {selected ?? "Pilih salah satu"}
          </Text>
          <Ionicons
            name={open ? "chevron-up" : "chevron-down"}
            size={18}
            color={COLORS.sub}
          />
        </TouchableOpacity>

        {open && (
          <View style={styles.dropdownList}>
            {OPTIONS.map((opt) => (
              <TouchableOpacity
                key={opt}
                style={styles.dropdownItem}
                onPress={() => {
                  setSelected(opt);
                  setOpen(false);
                }}
              >
                <Text style={styles.dropdownItemText}>{opt}</Text>
              </TouchableOpacity>
            ))}
          </View>
        )}
      </View>

      {/* Kartu aksi */}
      <View style={styles.cardsWrap}>
        <TouchableOpacity
          style={[styles.card, { marginRight: 12 }]}
          activeOpacity={0.85}
          onPress={() => router.push("../(tabs)/presensi/datang")}
        >
          <View style={styles.cardIconBubble}>
            <Ionicons name="clipboard-outline" size={26} color={COLORS.brand} />
          </View>
          <Text style={styles.cardLabel}>Presensi{"\n"}Datang</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.card}
          activeOpacity={0.85}
          onPress={() => router.push("../(tabs)/presensi/pulang")}
        >
          <View style={[styles.cardIconBubble, { backgroundColor: "#f6f7f9" }]}>
            <Ionicons
              name="checkmark-done-outline"
              size={26}
              color={COLORS.brand}
            />
          </View>
          <Text style={styles.cardLabel}>Presensi{"\n"}Pulang</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },
  block: {
    backgroundColor: COLORS.soft,
    borderRadius: 16,
    padding: 12,
    marginBottom: 16,
  },
  blockTitle: {
    fontSize: 14,
    fontWeight: "700",
    color: COLORS.text,
    marginBottom: 8,
  },
  dropdown: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
    paddingHorizontal: 12,
    paddingVertical: 12,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
    shadowColor: "#000",
    shadowOpacity: 0.05,
    shadowRadius: 6,
    elevation: 1,
  },
  dropdownText: { color: COLORS.sub, fontSize: 14, fontWeight: "600" },
  dropdownList: {
    backgroundColor: COLORS.bg,
    borderRadius: 12,
    marginTop: 8,
    overflow: "hidden",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  dropdownItem: { paddingVertical: 12, paddingHorizontal: 12 },
  dropdownItemText: { fontSize: 14, color: COLORS.text, fontWeight: "600" },

  cardsWrap: {
    backgroundColor: COLORS.bg,
    borderRadius: 16,
    padding: 16,
    marginTop: 4,
    flexDirection: "row",
    justifyContent: "center",
    shadowColor: COLORS.shadow,
    shadowOpacity: 0.2,
    shadowRadius: 12,
    elevation: 2,
  },
  card: {
    width: 150,
    height: 120,
    borderRadius: 16,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
  },
  cardIconBubble: {
    width: 56,
    height: 56,
    borderRadius: 28,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "#e8fbfa",
    marginBottom: 10,
  },
  cardLabel: {
    textAlign: "center",
    color: COLORS.text,
    fontWeight: "700",
  },
});
