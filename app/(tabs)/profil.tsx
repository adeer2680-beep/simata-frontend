// app/(tabs)/profil.tsx
import React, { useState, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";

const COLORS = {
  bg: "#ffffff",
  card: "#f3f4f6",
  text: "#0f172a",
  sub: "#475569",
  border: "#e5e7eb",
  brand: "#0ea5a3",
};
const AVATAR_SIZE = 104;

export default function ProfilScreen() {
  const [username, setUsername] = useState("admin");
  const [nama, setNama] = useState("Nama Pegawai");
  const [unit, setUnit] = useState("Unit 1");

  // foto profil
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);

  const handleSave = () => {
    setEditing(false);
    Alert.alert("Berhasil", "Profil berhasil diperbarui!");
  };

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Izin diperlukan", "Beri akses galeri untuk ganti foto.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.7,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
    }
  }, []);

  const removeImage = useCallback(() => {
    Alert.alert("Hapus Foto", "Yakin hapus foto profil?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: () => setPhotoUri(null),
      },
    ]);
  }, []);

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      {/* Avatar */}
      <View style={styles.avatarSection}>
        <View style={styles.avatarWrap}>
          <View style={styles.avatarCircle}>
            {photoUri ? (
              <Image source={{ uri: photoUri }} style={styles.avatarImg} />
            ) : (
              <Ionicons name="person" size={56} color={COLORS.sub} />
            )}
          </View>

          {/* Tombol kamera → ganti foto */}
          <TouchableOpacity style={styles.cameraBtn} onPress={pickImage}>
            <Ionicons name="camera" size={18} color="#fff" />
          </TouchableOpacity>

          {/* Tombol hapus → hanya muncul kalau ada foto */}
          {photoUri && (
            <TouchableOpacity style={styles.trashBtn} onPress={removeImage}>
              <Ionicons name="trash" size={16} color="#fff" />
            </TouchableOpacity>
          )}
        </View>
      </View>

      {/* Konten */}
      <View style={styles.content}>
        <View style={styles.card}>
          {editing ? (
            <TextInput value={username} onChangeText={setUsername} style={styles.input} />
          ) : (
            <Text style={styles.value}>{username}</Text>
          )}
          <Text style={styles.label}>Username</Text>
        </View>

        <View style={styles.card}>
          {editing ? (
            <TextInput value={nama} onChangeText={setNama} style={styles.input} />
          ) : (
            <Text style={styles.value}>{nama}</Text>
          )}
          <Text style={styles.label}>Nama Pegawai</Text>
        </View>

        <View style={styles.card}>
          {editing ? (
            <TextInput value={unit} onChangeText={setUnit} style={styles.input} />
          ) : (
            <Text style={styles.value}>{unit}</Text>
          )}
          <Text style={styles.label}>Unit</Text>
        </View>

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

  avatarSection: { alignItems: "center", paddingTop: 20, paddingBottom: 8 },
  avatarWrap: { position: "relative" },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    backgroundColor: "#fff",
    borderWidth: 2,
    borderColor: COLORS.brand,
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: {
    width: AVATAR_SIZE - 4,
    height: AVATAR_SIZE - 4,
    borderRadius: (AVATAR_SIZE - 4) / 2,
  },
  cameraBtn: {
    position: "absolute",
    right: -4,
    bottom: -4,
    backgroundColor: COLORS.brand,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  trashBtn: {
    position: "absolute",
    left: -4,
    bottom: -4,
    backgroundColor: "#ef4444",
    width: 28,
    height: 28,
    borderRadius: 14,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.bg,
  },

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
