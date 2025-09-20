// app/(tabs)/profil.tsx
import React, { useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";

const COLORS = {
  bg: "#ffffff",
  card: "#f3f4f6",
  text: "#0f172a",
  sub: "#475569",
  border: "#e5e7eb",
  brand: "#0ea5a3",
};

export default function ProfilScreen() {
  // Dummy data (nanti bisa ambil dari API atau AsyncStorage)
  const [username, setUsername] = useState("admin");
  const [nama, setNama] = useState("Nama Pegawai");
  const [unit, setUnit] = useState("Unit 1");

  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    setEditing(false);
    // TODO: kirim ke backend kalau perlu
    alert("Profil berhasil diperbarui!");
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      {/* Konten */}
      <View style={styles.content}>
        {/* Username */}
        <View style={styles.card}>
          {editing ? (
            <TextInput
              value={username}
              onChangeText={setUsername}
              style={styles.input}
            />
          ) : (
            <Text style={styles.value}>{username}</Text>
          )}
          <Text style={styles.label}>Username</Text>
        </View>

        {/* Nama Pegawai */}
        <View style={styles.card}>
          {editing ? (
            <TextInput value={nama} onChangeText={setNama} style={styles.input} />
          ) : (
            <Text style={styles.value}>{nama}</Text>
          )}
          <Text style={styles.label}>Nama Pegawai</Text>
        </View>

        {/* Unit */}
        <View style={styles.card}>
          {editing ? (
            <TextInput value={unit} onChangeText={setUnit} style={styles.input} />
          ) : (
            <Text style={styles.value}>{unit}</Text>
          )}
          <Text style={styles.label}>Unit</Text>
        </View>

        {/* Tombol Edit / Simpan */}
        <TouchableOpacity
          style={styles.editBtn}
          onPress={() => (editing ? handleSave() : setEditing(true))}
        >
          <Text style={styles.editText}>{editing ? "Simpan" : "Edit"}</Text>
        </TouchableOpacity>
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: {
    paddingHorizontal: 16,
    paddingVertical: 14,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    backgroundColor: COLORS.bg,
  },
  headerTitle: { fontSize: 16, fontWeight: "700", color: COLORS.text },

  content: { padding: 16, gap: 16 },
  card: {
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    position: "relative",
  },
  label: {
    fontSize: 12,
    color: COLORS.sub,
    position: "absolute",
    top: 6,
    right: 16,
  },
  value: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  input: {
    fontSize: 14,
    color: COLORS.text,
    borderBottomWidth: 1,
    borderBottomColor: COLORS.border,
    paddingVertical: 4,
  },

  editBtn: {
    marginTop: 20,
    backgroundColor: COLORS.brand,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  editText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
