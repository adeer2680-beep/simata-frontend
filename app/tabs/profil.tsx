// app/(tabs)/profil.tsx
import React, { useState, useCallback, useEffect } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, TextInput,
  Image, Alert, ScrollView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const COLORS = {
  bg: "#ffffff",
  card: "#f8fafc",
  text: "#0f172a",
  sub: "#475569",
  border: "#e5e7eb",
  brand: "#42909b",
  danger: "#ef4444",
};
const AVATAR_SIZE = 104;

export default function ProfilScreen() {
  const [username, setUsername] = useState("admin");
  const [nama, setNama] = useState("Nama Pegawai");
  const [unit, setUnit] = useState("Unit 1");
  const [role, setRole] = useState("admin");
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Load dari storage saat buka
  useEffect(() => {
    (async () => {
      const u = await AsyncStorage.getItem("username");
      const n = await AsyncStorage.getItem("nama");
      const un = await AsyncStorage.getItem("unit");
      const r = await AsyncStorage.getItem("role");
      const p = await AsyncStorage.getItem("photoUri");
      if (u) setUsername(u);
      if (n) setNama(n);
      if (un) setUnit(un);
      if (r) setRole(r);
      if (p) setPhotoUri(p);
    })();
  }, []);

  const handleSave = async () => {
    try {
      await AsyncStorage.setItem("username", username);
      await AsyncStorage.setItem("nama", nama);
      await AsyncStorage.setItem("unit", unit);
      await AsyncStorage.setItem("role", role);
      if (photoUri) await AsyncStorage.setItem("photoUri", photoUri);
      Alert.alert("Berhasil", "Profil disimpan di perangkat!");
    } catch {
      Alert.alert("Error", "Gagal simpan profil.");
    } finally {
      setEditing(false);
    }
  };

  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Izin diperlukan", "Beri akses galeri untuk ganti foto.");
      return;
    }
    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ImagePicker.MediaTypeOptions.Images,
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });
    if (!result.canceled && result.assets?.[0]?.uri) {
      setPhotoUri(result.assets[0].uri);
      await AsyncStorage.setItem("photoUri", result.assets[0].uri);
    }
  }, []);

  const removeImage = useCallback(() => {
    Alert.alert("Hapus Foto", "Yakin hapus foto profil?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Hapus",
        style: "destructive",
        onPress: async () => {
          setPhotoUri(null);
          await AsyncStorage.removeItem("photoUri");
        },
      },
    ]);
  }, []);

  const handleLogout = () => {
    Alert.alert("Logout", "Yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          try {
            setLoggingOut(true);
            // hapus semua yang mungkin tersimpan
            await AsyncStorage.multiRemove([
              "token", "role", "name",
              "username", "nama", "unit", "photoUri"
            ]);
            router.replace("/login");
          } catch {
            Alert.alert("Gagal", "Tidak dapat logout sekarang.");
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <ScrollView contentContainerStyle={{ padding: 16, paddingBottom: 32 }}>
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

            <TouchableOpacity style={styles.cameraBtn} onPress={pickImage}>
              <Ionicons name="camera" size={18} color="#fff" />
            </TouchableOpacity>

            {photoUri && (
              <TouchableOpacity style={styles.trashBtn} onPress={removeImage}>
                <Ionicons name="trash" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Data Profil */}
        <View style={styles.card}>
          <Text style={styles.label}>Username</Text>
          {editing ? (
            <TextInput value={username} onChangeText={setUsername} style={styles.input} />
          ) : (
            <Text style={styles.value}>{username}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Nama Pegawai</Text>
          {editing ? (
            <TextInput value={nama} onChangeText={setNama} style={styles.input} />
          ) : (
            <Text style={styles.value}>{nama}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Unit</Text>
          {editing ? (
            <TextInput value={unit} onChangeText={setUnit} style={styles.input} />
          ) : (
            <Text style={styles.value}>{unit}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Role</Text>
          <Text style={styles.value}>{role}</Text>
        </View>

        {/* Aksi */}
        <TouchableOpacity
          style={styles.primaryBtn}
          onPress={() => (editing ? handleSave() : setEditing(true))}
        >
          <Text style={styles.primaryText}>{editing ? "Simpan" : "Edit"}</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.logoutBtn}
          onPress={handleLogout}
          disabled={loggingOut}
          activeOpacity={0.85}
        >
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutText}>{loggingOut ? "Keluar..." : "Logout"}</Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { backgroundColor: COLORS.brand, padding: 16 },
  headerTitle: { color: "#fff", fontWeight: "800", fontSize: 18 },

  avatarSection: { alignItems: "center", marginVertical: 16 },
  avatarWrap: { position: "relative" },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 2,
    borderColor: COLORS.brand,
    backgroundColor: "#fff",
    alignItems: "center",
    justifyContent: "center",
  },
  avatarImg: {
    width: AVATAR_SIZE - 4,
    height: AVATAR_SIZE - 4,
    borderRadius: (AVATAR_SIZE - 4) / 2,
  },
  cameraBtn: {
    position: "absolute", right: -6, bottom: -6,
    backgroundColor: COLORS.brand,
    width: 34, height: 34, borderRadius: 17,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: COLORS.bg,
  },
  trashBtn: {
    position: "absolute", left: -6, bottom: -6,
    backgroundColor: COLORS.danger,
    width: 30, height: 30, borderRadius: 15,
    alignItems: "center", justifyContent: "center",
    borderWidth: 2, borderColor: COLORS.bg,
  },

  card: {
    backgroundColor: COLORS.card,
    borderRadius: 12,
    padding: 14,
    marginVertical: 6,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  label: { fontSize: 12, color: COLORS.sub, marginBottom: 6 },
  value: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    padding: 8,
    backgroundColor: "#fff",
    fontSize: 14,
  },

  primaryBtn: {
    marginTop: 18,
    backgroundColor: COLORS.brand,
    padding: 14,
    borderRadius: 14,
    alignItems: "center",
  },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  logoutBtn: {
    marginTop: 12,
    backgroundColor: COLORS.danger,
    paddingVertical: 12,
    borderRadius: 14,
    alignItems: "center",
    flexDirection: "row",
    justifyContent: "center",
    gap: 8,
  },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});
