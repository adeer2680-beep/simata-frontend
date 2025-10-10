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

// 🔧 Base URL untuk API
const BASE_URL = Platform.OS === "android" 
  ? "http://172.31.129.242:8000" 
  : "http://localhost:8000";
const API_URL = `${BASE_URL}/api/profile`;

export default function ProfilScreen() {
  const [username, setUsername] = useState("");
  const [nama, setNama] = useState("");
  const [unitId, setUnitId] = useState("");
  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // 🔹 Ambil data profil dari backend
  const loadProfile = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("auth.token");
      
      console.log("🔑 Token:", token ? "Ada" : "Tidak ada");
      
      if (!token) {
        console.log("❌ Token tidak ditemukan, redirect ke login");
        Alert.alert("Sesi Habis", "Silakan login kembali");
        router.replace("/login");
        return;
      }

      console.log("📡 Fetching profil dari:", API_URL);
      
      const res = await fetch(API_URL, {
        method: "GET",
        headers: { 
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json"
        },
      });

      console.log("📊 Response status:", res.status);
      
      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();
      console.log("📦 Response data:", JSON.stringify(json, null, 2));

      if (json.status === "success" && json.user) {
        const user = json.user;
        const profil = user.profil;
        
        // Set data user
        setUsername(user.username || "");
        setNama(profil?.nama_pegawai || "");
        setUnitId(String(profil?.unit_id || ""));
        
        // Set foto profil
        if (json.photo_url) {
          console.log("🖼️ Photo URL dari server:", json.photo_url);
          setPhotoUri(json.photo_url);
        } else {
          console.log("⚠️ Tidak ada photo_url dari server");
          setPhotoUri(null);
        }
        
        // Simpan ke AsyncStorage untuk cache
        const updatedUser = {
          id: user.id,
          username: user.username,
          nama: profil?.nama_pegawai || user.username,
          unit_id: profil?.unit_id || user.unit_id,
          role: user.role,
        };
        await AsyncStorage.setItem("auth.user", JSON.stringify(updatedUser));
        console.log("✅ Profil berhasil dimuat");
      } else {
        throw new Error(json.message || "Gagal memuat profil");
      }
    } catch (e) {
      console.error("❌ Error fetch profil:", e);
      Alert.alert("Error", "Terjadi kesalahan saat memuat profil");
    }
  }, []);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await new Promise(resolve => setTimeout(resolve, 100));
      await loadProfile();
      setLoading(false);
    };
    init();
  }, [loadProfile]);

  // 🔹 Pilih gambar
  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Izin diperlukan", "Beri akses galeri untuk ganti foto.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ['images'],
      quality: 0.8,
      allowsEditing: true,
      aspect: [1, 1],
    });

    if (!result.canceled && result.assets?.[0]?.uri) {
      const uri = result.assets[0].uri;
      console.log("📸 Foto baru dipilih:", uri);
      setPhotoUri(uri);
    }
  }, []);

  // 🔹 Hapus foto
  const removeImage = useCallback(() => {
    Alert.alert("Hapus Foto", "Yakin hapus foto profil?", [
      { text: "Batal", style: "cancel" },
      { 
        text: "Hapus", 
        style: "destructive", 
        onPress: () => {
          setPhotoUri(null);
          console.log("🗑️ Foto dihapus dari state");
        }
      },
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
      
      // Append data profil
      if (nama) {
        formData.append("nama_pegawai", nama);
      }
      if (unitId) {
        formData.append("unit_id", unitId);
      }

      // 🔧 Handle upload foto
      if (photoUri) {
        // Jika foto baru dari galeri (file:// atau blob:)
        if (photoUri.startsWith('file://') || photoUri.startsWith('blob:')) {
          console.log("📤 Uploading foto baru:", photoUri);
          
          if (Platform.OS === 'web' && photoUri.startsWith('blob:')) {
            // Untuk web: convert blob ke file
            try {
              const response = await fetch(photoUri);
              const blob = await response.blob();
              console.log("📦 Blob info:", { type: blob.type, size: blob.size });
              
              formData.append("photo", blob, "photo.jpg");
            } catch (blobError) {
              console.error("❌ Error converting blob:", blobError);
              Alert.alert("Error", "Gagal memproses foto");
              setSaving(false);
              return;
            }
          } else {
            // Untuk mobile: append langsung dengan URI
            const filename = photoUri.split('/').pop() || 'photo.jpg';
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : 'image/jpeg';
            
            formData.append("photo", {
              uri: photoUri,
              name: filename,
              type: type,
            } as any);
          }
        }
        // Jika foto dari server (http://...), tidak perlu upload ulang
      }

      console.log("💾 Menyimpan profil ke:", API_URL);

      const res = await fetch(API_URL, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          // JANGAN set Content-Type untuk FormData, biarkan browser/RN yang set
        },
        body: formData,
      });

      console.log("📊 Update response status:", res.status);

      if (!res.ok) {
        throw new Error(`HTTP error! status: ${res.status}`);
      }

      const json = await res.json();
      console.log("📦 Update response:", JSON.stringify(json, null, 2));

      if (json.status === "success") {
        Alert.alert("Berhasil", json.message || "Profil berhasil diperbarui!");
        setEditing(false);

        // Reload profil dari server untuk sinkronisasi
        await loadProfile();
      } else {
        throw new Error(json.message || "Update profil gagal");
      }
    } catch (e) {
      console.error("❌ Error update profil:", e);
      Alert.alert("Error", e instanceof Error ? e.message : "Terjadi kesalahan saat update profil");
    } finally {
      setSaving(false);
    }
  };

  // 🔹 Logout
   const handleLogout = async () => {
    console.log("🔴 TOMBOL LOGOUT DIKLIK!");
    console.log("🔴 loggingOut state:", loggingOut);
    console.log("🔴 editing state:", editing);
    
    // Untuk web gunakan window.confirm, untuk native gunakan Alert
    let confirmed = false;
    
    if (Platform.OS === 'web') {
      confirmed = window.confirm("Yakin ingin keluar?");
      console.log("🔴 Web confirm result:", confirmed);
    } else {
      // Untuk native, gunakan Alert dengan Promise
      confirmed = await new Promise((resolve) => {
        Alert.alert(
          "Logout", 
          "Yakin ingin keluar?", 
          [
            { 
              text: "Batal", 
              style: "cancel",
              onPress: () => {
                console.log("❌ User membatalkan logout");
                resolve(false);
              }
            },
            {
              text: "Keluar",
              style: "destructive",
              onPress: () => {
                console.log("✅ User konfirmasi logout");
                resolve(true);
              }
            },
          ]
        );
      });
    }
    
    if (!confirmed) {
      console.log("❌ Logout dibatalkan");
      return;
    }
    
    // Proses logout
    try {
      setLoggingOut(true);
      console.log("🗑️ Menghapus data auth...");
      await AsyncStorage.multiRemove(["auth.user", "auth.token"]);
      console.log("✅ Data auth berhasil dihapus");
      console.log("🔄 Redirect ke /login...");
      router.replace("/login");
    } catch (error) {
      console.error("❌ Error logout:", error);
      setLoggingOut(false);
      Alert.alert("Error", "Gagal logout. Silakan coba lagi.");
    }
  };

  // 🔹 Loading state
  if (loading) {
    return (
      <View style={styles.center}>
        <ActivityIndicator size="large" color={COLORS.brand} />
        <Text style={styles.loadingText}>Memuat profil...</Text>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Profil</Text>
      </View>

      <ScrollView 
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        {/* Avatar Section */}
        <View style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              {photoUri ? (
                <Image 
                  source={{ uri: photoUri }} 
                  style={styles.avatarImg}
                  onError={(e) => {
                    console.error("❌ Error loading image:", e.nativeEvent.error);
                    console.error("Failed URI:", photoUri);
                  }}
                  onLoad={() => console.log("✅ Image loaded:", photoUri)}
                />
              ) : (
                <Ionicons name="person" size={56} color={COLORS.sub} />
              )}
            </View>

            {/* Camera Button */}
            <TouchableOpacity 
              style={styles.cameraBtn} 
              onPress={pickImage}
              disabled={saving}
            >
              <Ionicons name="camera" size={18} color="#fff" />
            </TouchableOpacity>

            {/* Trash Button - hanya muncul jika ada foto */}
            {photoUri && (
              <TouchableOpacity 
                style={styles.trashBtn} 
                onPress={removeImage}
                disabled={saving}
              >
                <Ionicons name="trash" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Username Card (Read Only) */}
        <View style={styles.card}>
          <Text style={styles.label}>Username</Text>
          <Text style={styles.value}>{username || "Belum diisi"}</Text>
        </View>

        {/* Nama Pegawai Card */}
        <View style={styles.card}>
          <Text style={styles.label}>Nama Pegawai</Text>
          {editing ? (
            <TextInput 
              value={nama} 
              onChangeText={setNama} 
              style={styles.input}
              placeholder="Masukkan nama lengkap"
              placeholderTextColor={COLORS.sub}
              editable={!saving}
            />
          ) : (
            <Text style={styles.value}>{nama || "Belum diisi"}</Text>
          )}
        </View>

        {/* Unit ID Card */}
        <View style={styles.card}>
          <Text style={styles.label}>Unit ID</Text>
          {editing ? (
            <TextInput 
              value={unitId} 
              onChangeText={setUnitId} 
              style={styles.input}
              keyboardType="numeric"
              placeholder="Masukkan ID Unit"
              placeholderTextColor={COLORS.sub}
              editable={!saving}
            />
          ) : (
            <Text style={styles.value}>{unitId || "Belum diisi"}</Text>
          )}
        </View>

        {/* Edit/Save Button */}
        <TouchableOpacity 
          style={[styles.primaryBtn, saving && styles.btnDisabled]} 
          onPress={() => (editing ? handleSave() : setEditing(true))} 
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>
              {editing ? "Simpan Perubahan" : "Edit Profil"}
            </Text>
          )}
        </TouchableOpacity>

        {/* Cancel Button - hanya muncul saat editing */}
        {editing && !saving && (
          <TouchableOpacity 
            style={styles.cancelBtn} 
            onPress={() => {
              setEditing(false);
              loadProfile(); // Reload data asli
            }}
          >
            <Text style={styles.cancelText}>Batal</Text>
          </TouchableOpacity>
        )}

        {/* Logout Button */}
        <TouchableOpacity 
          style={[styles.logoutBtn, loggingOut && styles.btnDisabled]} 
          onPress={handleLogout} 
          disabled={loggingOut}
        >
          {loggingOut ? (
            <ActivityIndicator color="#fff" size="small" />
          ) : (
            <>
              <Ionicons name="log-out-outline" size={18} color="#fff" />
              <Text style={styles.logoutText}>Logout</Text>
            </>
          )}
        </TouchableOpacity>
      </ScrollView>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { 
    flex: 1, 
    backgroundColor: COLORS.bg 
  },
  header: { 
    backgroundColor: COLORS.brand, 
    padding: 16,
    paddingTop: Platform.OS === 'ios' ? 50 : 16,
  },
  headerTitle: { 
    color: "#fff", 
    fontWeight: "800", 
    fontSize: 20,
    textAlign: "center",
  },
  center: { 
    flex: 1, 
    justifyContent: "center", 
    alignItems: "center",
    backgroundColor: COLORS.bg,
  },
  loadingText: {
    marginTop: 12,
    color: COLORS.sub,
    fontSize: 14,
  },
  scrollContent: {
    padding: 16,
    paddingBottom: 32,
  },

  // Avatar Section
  avatarSection: { 
    alignItems: "center", 
    marginVertical: 24 
  },
  avatarWrap: { 
    position: "relative" 
  },
  avatarCircle: {
    width: AVATAR_SIZE,
    height: AVATAR_SIZE,
    borderRadius: AVATAR_SIZE / 2,
    borderWidth: 3,
    borderColor: COLORS.brand,
    backgroundColor: COLORS.card,
    alignItems: "center",
    justifyContent: "center",
    overflow: "hidden",
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 5,
  },
  avatarImg: { 
    width: AVATAR_SIZE, 
    height: AVATAR_SIZE,
  },
  cameraBtn: {
    position: "absolute",
    right: -6,
    bottom: -6,
    backgroundColor: COLORS.brand,
    width: 36,
    height: 36,
    borderRadius: 18,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.bg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },
  trashBtn: {
    position: "absolute",
    left: -6,
    bottom: -6,
    backgroundColor: COLORS.danger,
    width: 32,
    height: 32,
    borderRadius: 16,
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 3,
    borderColor: COLORS.bg,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.2,
    shadowRadius: 4,
    elevation: 5,
  },

  // Cards
  card: { 
    backgroundColor: COLORS.card, 
    borderRadius: 12, 
    padding: 16, 
    marginVertical: 6, 
    borderWidth: 1, 
    borderColor: COLORS.border,
    shadowColor: "#000",
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.05,
    shadowRadius: 2,
    elevation: 1,
  },
  label: { 
    fontSize: 12, 
    color: COLORS.sub, 
    marginBottom: 8,
    fontWeight: "600",
    textTransform: "uppercase",
    letterSpacing: 0.5,
  },
  value: { 
    fontSize: 16, 
    fontWeight: "600", 
    color: COLORS.text 
  },
  input: { 
    borderWidth: 1, 
    borderColor: COLORS.border, 
    borderRadius: 10, 
    padding: 12, 
    backgroundColor: "#fff", 
    fontSize: 16,
    color: COLORS.text,
  },

  // Buttons
  primaryBtn: { 
    marginTop: 24, 
    backgroundColor: COLORS.brand, 
    padding: 16, 
    borderRadius: 12, 
    alignItems: "center",
    shadowColor: COLORS.brand,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  primaryText: { 
    color: "#fff", 
    fontWeight: "800", 
    fontSize: 16 
  },
  cancelBtn: {
    marginTop: 12,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelText: {
    color: COLORS.text,
    fontWeight: "700",
    fontSize: 16,
  },
  logoutBtn: { 
    marginTop: 24, 
    backgroundColor: COLORS.danger, 
    paddingVertical: 14, 
    borderRadius: 12, 
    alignItems: "center", 
    flexDirection: "row", 
    justifyContent: "center", 
    gap: 8,
    shadowColor: COLORS.danger,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 5,
  },
  logoutText: { 
    color: "#fff", 
    fontWeight: "700", 
    fontSize: 16 
  },
  btnDisabled: {
    opacity: 0.6,
  },
});