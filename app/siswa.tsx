// app/siswa.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Pressable,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";

const C = {
  bg: "#ffffff",
  text: "#0f172a",
  sub: "#475569",
  border: "#e5e7eb",
  brand: "#0ea5a3",
};

export default function SiswaScreen() {
  const [open, setOpen] = useState(false);

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Siswa</Text>
      </View>

      {/* Konten kosong + tombol untuk memicu modal */}
      <View style={s.content}>
        <TouchableOpacity style={s.bigBtn} onPress={() => setOpen(true)}>
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
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: C.text },

  content: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },
  bigBtn: {
    backgroundColor: "#f3f4f6",
    paddingVertical: 16,
    paddingHorizontal: 28,
    borderRadius: 14,
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
