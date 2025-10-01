import React, { useState, useMemo } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  FlatList,
  Platform,
} from "react-native";
import { router, Stack } from "expo-router";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  bg: "#ffffff",
  soft: "#eef4ff",
  card: "#f3f4f6",
  text: "#0f172a",
  sub: "#475569",
  brand: "#42909b",          // ⬅️ samakan dengan warna header gambar kedua
  border: "#e5e7eb",
  shadow: "#00000020",

  // modal
  modalBg: "#42909b",
  modalDivider: "#62aeb7",
};

const OPTIONS = [
  "Hari Efektif",
  "Sabtu Sehat MA",
  "Sabtu Sehat SD",
  "Sabtu Sehat SMP",
  "Sabtu Sehat Yayasan",
  "Kajian Tafsir",
  "PUD Ikadi Meri",
  "MTQ Ikadi Meri",
  "PUEP",
  "Pelatihan",
  "Peringatan Hari Besar Islam",
] as const;
type PresensiType = typeof OPTIONS[number];

export default function PresensiHome() {
  const [open, setOpen] = useState(false);
  const [selected, setSelected] = useState<PresensiType | null>("Hari Efektif");
  const data = useMemo(() => OPTIONS, []);

  const goDatang = () => {
    router.push({ pathname: "/presensi/datang", params: { jenis: selected ?? "" } });
  };
  const goPulang = () => {
    router.push({ pathname: "/presensi/pulang", params: { jenis: selected ?? "" } });
  };

  return (
    <View style={styles.container}>
      {/* ===== Header bar berwarna (expo-router) ===== */}
      <Stack.Screen
        options={{
          title: "Presensi",
          headerStyle: { backgroundColor: COLORS.brand },
          headerTintColor: "#fff",
          headerTitleStyle: { color: "#fff", fontWeight: "800" },
          headerShadowVisible: false,
          // Web kadang tidak mewarisi warna ikon; paksa putih:
          headerBackVisible: true,
        }}
      />

      {/* Selector (open modal) */}
      <View style={styles.block}>
        <Text style={styles.blockTitle}>Pilih Jenis Presensi</Text>

        <TouchableOpacity
          activeOpacity={0.8}
          style={styles.dropdown}
          onPress={() => setOpen(true)}
        >
          <Text style={styles.dropdownTextValue}>
            {selected ?? "Pilih salah satu"}
          </Text>
          <Ionicons name="chevron-down" size={18} color={COLORS.sub} />
        </TouchableOpacity>
      </View>

      {/* Kartu aksi */}
      <View style={styles.cardsWrap}>
        <TouchableOpacity
          style={[styles.card, { marginRight: 12 }]}
          activeOpacity={0.85}
          onPress={goDatang}
        >
          <View style={styles.cardIconBubble}>
            <Ionicons name="clipboard-outline" size={26} color={COLORS.brand} />
          </View>
          <Text style={styles.cardLabel}>Presensi{"\n"}Datang</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.card} activeOpacity={0.85} onPress={goPulang}>
          <View style={[styles.cardIconBubble, { backgroundColor: "#f6f7f9" }]}>
            <Ionicons name="checkmark-done-outline" size={26} color={COLORS.brand} />
          </View>
          <Text style={styles.cardLabel}>Presensi{"\n"}Pulang</Text>
        </TouchableOpacity>
      </View>

      {/* Modal list + radio */}
      <Modal visible={open} animationType="slide" transparent onRequestClose={() => setOpen(false)}>
        <Pressable style={styles.backdrop} onPress={() => setOpen(false)} />
        <View style={styles.sheet}>
          <View style={styles.sheetHeader}>
            <Text style={styles.sheetTitle}>Jenis Presensi</Text>
            <Pressable onPress={() => setOpen(false)} hitSlop={10}>
              <Ionicons name="close" size={22} color="#fff" />
            </Pressable>
          </View>

          <FlatList
            data={data}
            keyExtractor={(it) => it}
            ItemSeparatorComponent={() => <View style={styles.divider} />}
            renderItem={({ item }) => {
              const isSelected = item === selected;
              return (
                <Pressable
                  style={[styles.row, isSelected && { backgroundColor: "#36747d" }]}
                  onPress={() => {
                    setSelected(item);
                    setOpen(false);
                  }}
                >
                  <Text style={styles.rowLabel}>{item}</Text>
                  <Ionicons
                    name={isSelected ? "radio-button-on" : "radio-button-off"}
                    size={22}
                    color="#fff"
                  />
                </Pressable>
              );
            }}
            contentContainerStyle={{ paddingBottom: 8 }}
          />
        </View>
      </Modal>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg, padding: 16 },

  // blok selector
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
  dropdownTextValue: { color: COLORS.text, fontSize: 14, fontWeight: "700" },

  // kartu aksi
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
  cardLabel: { textAlign: "center", color: COLORS.text, fontWeight: "700" },

  // modal
  backdrop: { flex: 1, backgroundColor: "rgba(0,0,0,0.35)" },
  sheet: {
    position: "absolute",
    left: 0,
    right: 0,
    bottom: 0,
    maxHeight: "75%",
    backgroundColor: COLORS.modalBg,
    borderTopLeftRadius: 18,
    borderTopRightRadius: 18,
    paddingBottom: 8,
  },
  sheetHeader: {
    paddingHorizontal: 16,
    paddingTop: 12,
    paddingBottom: 8,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  sheetTitle: { fontSize: 16, fontWeight: "700", color: "#fff" },
  divider: { height: StyleSheet.hairlineWidth, backgroundColor: COLORS.modalDivider },
  row: {
    paddingHorizontal: 16,
    paddingVertical: 16,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "space-between",
  },
  rowLabel: { fontSize: 16, color: "#fff" },
});
