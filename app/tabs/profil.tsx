import React, { useState, useEffect, useCallback } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Image,
  Alert,
  ScrollView,
  ActivityIndicator,
  Platform,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import * as ImagePicker from "expo-image-picker";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const COLORS = {
  bg: "#fff",
  card: "#f8fafc",
  text: "#0f172a",
  sub: "#475569",
  border: "#e5e7eb",
  brand: "#42909b",
  danger: "#ef4444",
};
const AVATAR_SIZE = 104;
const API_URL = 
  Platform.OS === "android"
    ? "http://192.123.99.156:8000/api/profil"
    : "http://localhost:8000/api/profil";

export default function ProfilScreen() {
  const [username, setUsername] = useState("");
  const [nama, setNama] = useState("");
  const [unit, setUnit] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // 🔹 Ambil data user login dari backend
  useEffect(() => {
    const loadProfile = async () => {
      setLoading(true);
      // Tambahkan delay kecil untuk memastikan token sudah tersimpan
      await new Promise(resolve => setTimeout(resolve, 100));
      
      try {
        const token = await AsyncStorage.getItem("auth.token");
        const userData = await AsyncStorage.getItem("auth.user");
        
        // DEBUG: Cek apakah token ada
        console.log("🔑 Token:", token ? "Ada" : "Tidak ada");
        console.log("👤 User data:", userData);
        
        if (!token) {
          console.log("❌ Token tidak ditemukan, redirect ke login");
          Alert.alert("Sesi Habis", "Silakan login kembali");
          router.replace("/login");
          return;
        }

        // Jika ada data user di storage, gunakan itu dulu
        if (userData) {
          const user = JSON.parse(userData);
          setUsername(user.username || "");
          setNama(user.nama || "");
          setUnit(user.unit || "");
          console.log("✅ Data user dari storage:", user);
        }

        console.log("📡 Fetching profil dari:", API_URL);
        
        const res = await fetch(API_URL, {
          method: "GET",
          headers: { 
            Authorization: `Bearer ${token}`,
            "Content-Type": "application/json"
          },
        });

        // DEBUG: Cek status response
        console.log("📊 Response status:", res.status);
        
        const json = await res.json();
        console.log("📦 Response data:", JSON.stringify(json, null, 2));

        if (json.status === "success" && json.data) {
          const data = json.data;
          console.log("✅ Data profil berhasil dimuat:", data);
          
          setUsername(data.username || "");
          setNama(data.nama || "");
          setUnit(data.unit || "");
          setPhotoUri(data.photo || null);
        } else {
          console.log("⚠️ Fetch profil gagal:", json.message);
          Alert.alert("Gagal", json.message || "Tidak dapat memuat profil");
        }
      } catch (e) {
        console.error("❌ Error fetch profil:", e);
        Alert.alert("Error", "Terjadi kesalahan saat memuat profil");
      } finally {
        setLoading(false);
      }
    };

    loadProfile();
  }, []);

  // 🔹 Pilih gambar
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
    }
  }, []);

  // 🔹 Hapus foto
  const removeImage = useCallback(() => {
    Alert.alert("Hapus Foto", "Yakin hapus foto profil?", [
      { text: "Batal", style: "cancel" },
      { text: "Hapus", style: "destructive", onPress: () => setPhotoUri(null) },
    ]);
  }, []);

  // 🔹 Simpan data profil
  const handleSave = async () => {
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("auth.token");
      if (!token) {
        Alert.alert("Error", "Token tidak ditemukan");
        return;
      }

      const formData = new FormData();
      formData.append("username", username);
      formData.append("unit", unit);
      formData.append("nama", nama);

      if (photoUri && photoUri.startsWith('file://')) {
        formData.append("photo", {
          uri: photoUri,
          type: "image/jpeg",
          name: "photo.jpg",
        } as any);
      }

      console.log("💾 Menyimpan profil...");

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
        },
        body: formData,
      });

      const json = await res.json();
      console.log("📦 Response update:", json);

      if (json.status === "success") {
        Alert.alert("Berhasil", "Profil diperbarui!");
        setEditing(false);

        // reload data dari backend
        const reloadRes = await fetch(API_URL, {
          headers: { Authorization: `Bearer ${token}` },
        });
        const reloadJson = await reloadRes.json();
        if (reloadJson.status === "success") {
          const data = reloadJson.data;
          setUsername(data.username || "");
          setNama(data.nama || "");
          setUnit(data.unit || "");
          setPhotoUri(data.photo || null);
        }
      } else {
        Alert.alert("Gagal", json.message || "Update profil gagal");
      }
    } catch (e) {
      console.error("❌ Error update profil:", e);
      Alert.alert("Error", "Terjadi kesalahan saat update profil");
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Logout
  const handleLogout = () => {
    Alert.alert("Logout", "Yakin ingin keluar?", [
      { text: "Batal", style: "cancel" },
      {
        text: "Keluar",
        style: "destructive",
        onPress: async () => {
          try {
            setLoggingOut(true);
            await AsyncStorage.removeItem("auth.token");
            await AsyncStorage.removeItem("auth.tokenType");
            await AsyncStorage.removeItem("auth.user");
            await AsyncStorage.removeItem("auth.beranda");
            router.replace("/login");
          } finally {
            setLoggingOut(false);
          }
        },
      },
    ]);
  };

  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.brand} />
        <Text style={{ marginTop: 8, color: COLORS.sub }}>Memuat profil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
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
            <Text style={styles.value}>{username || "Belum diisi"}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Nama</Text>
          {editing ? (
            <TextInput value={nama} onChangeText={setNama} style={styles.input} />
          ) : (
            <Text style={styles.value}>{nama || "Belum diisi"}</Text>
          )}
        </View>

        <View style={styles.card}>
          <Text style={styles.label}>Unit</Text>
          {editing ? (
            <TextInput value={unit} onChangeText={setUnit} style={styles.input} />
          ) : (
            <Text style={styles.value}>{unit || "Belum diisi"}</Text>
          )}
        </View>

        <TouchableOpacity 
          style={styles.primaryBtn} 
          onPress={() => (editing ? handleSave() : setEditing(true))} 
          disabled={saving}
        >
          <Text style={styles.primaryText}>
            {saving ? "Menyimpan..." : editing ? "Simpan" : "Edit"}
          </Text>
        </TouchableOpacity>

        <TouchableOpacity 
          style={styles.logoutBtn} 
          onPress={handleLogout} 
          disabled={loggingOut}
        >
          <Ionicons name="log-out-outline" size={18} color="#fff" />
          <Text style={styles.logoutText}>
            {loggingOut ? "Keluar..." : "Logout"}
          </Text>
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { backgroundColor: COLORS.brand, padding: 16 },
  headerTitle: { color: "#fff", fontWeight: "800", fontSize: 18 },
  center: { flex: 1, justifyContent: "center", alignItems: "center" },

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
    borderRadius: (AVATAR_SIZE - 4) / 2 
  },
  cameraBtn: {
    position: "absolute",
    right: -6,
    bottom: -6,
    backgroundColor: COLORS.brand,
    width: 34,
    height: 34,
    borderRadius: 17,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  trashBtn: {
    position: "absolute",
    left: -6,
    bottom: -6,
    backgroundColor: COLORS.danger,
    width: 30,
    height: 30,
    borderRadius: 15,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 2,
    borderColor: COLORS.bg,
  },
  card: { 
    backgroundColor: COLORS.card, 
    borderRadius: 12, 
    padding: 14, 
    marginVertical: 6, 
    borderWidth: 1, 
    borderColor: COLORS.border 
  },
  label: { fontSize: 12, color: COLORS.sub, marginBottom: 6 },
  value: { fontSize: 14, fontWeight: "600", color: COLORS.text },
  input: { 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: 10, 
    padding: 8, 
    backgroundColor: "#fff", 
    fontSize: 14 
  },
  primaryBtn: { 
    marginTop: 18, 
    backgroundColor: COLORS.brand, 
    padding: 14, 
    borderRadius: 14, 
    alignItems: "center" 
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
    gap: 8 
  },
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 16 },
});