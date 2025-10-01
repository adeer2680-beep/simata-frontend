// app/siswa.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const C = {
  brand: "#42909b",
  bg: "#ffffff",
  text: "#0f172a",
  sub: "#475569",
  border: "#e5e7eb",
  card: "#f3f4f6",
} as const;

export default function SiswaScreen() {
  const [open, setOpen] = useState(false);

  const Header = (
    <View style={s.header}>
      <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85} style={s.backBtn}>
        <Ionicons name="chevron-back" size={22} color="#000" />
      </TouchableOpacity>
      <Text style={s.headerTitle}>Siswa</Text>
      <View style={{ width: 38 }} />
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      {Header}

      {/* Konten kosong + tombol untuk memicu modal */}
      <View style={s.content}>
        <TouchableOpacity style={s.bigBtn} onPress={() => setOpen(true)} activeOpacity={0.9}>
          <Text style={s.bigBtnText}>Siswa</Text>
        </TouchableOpacity>
        <Text style={s.hint}>Halaman ini masih kosong.</Text>
      </View>

      {/* Modal info */}
      <Modal visible={open} transparent animationType="fade" onRequestClose={() => setOpen(false)}>
        <View style={s.modalBackdrop}>
          <View style={s.modalCard}>
            <Ionicons name="information-circle-outline" size={32} color={C.brand} />
            <Text style={s.modalTitle}>Fitur siswa</Text>
            <Text style={s.modalText}>Fitur siswa akan segera hadir</Text>
            <Pressable style={s.modalBtn} onPress={() => setOpen(false)}>
              <Text style={s.modalBtnText}>Oke</Text>
            </Pressable>
          </View>
        </View>
      </Modal>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // Header seragam (teal, back putih tipis, judul putih center)
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

  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  bigBtn: {
    backgroundColor: C.card,
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
  },
  bigBtnText: { fontSize: 16, fontWeight: "700", color: C.text },
  hint: { marginTop: 10, color: C.sub },

  modalBackdrop: {
    flex: 1,
    backgroundColor: "rgba(0,0,0,0.35)",
    alignItems: "center",
    justifyContent: "center",
    padding: 24,
  },
  modalCard: {
    width: "100%",
    maxWidth: 380,
    backgroundColor: "#fff",
    borderRadius: 16,
    padding: 18,
    alignItems: "center",
  },
  modalTitle: { marginTop: 8, fontSize: 16, fontWeight: "700", color: C.text },
  modalText: { marginTop: 6, color: C.sub, textAlign: "center" },
  modalBtn: {
    marginTop: 14,
    backgroundColor: C.brand,
    paddingVertical: 10,
    paddingHorizontal: 18,
    borderRadius: 10,
  },
  modalBtnText: { color: "#fff", fontWeight: "700" },
});
