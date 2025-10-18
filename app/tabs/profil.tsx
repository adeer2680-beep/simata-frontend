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

// Fallback base URL bila app.apiBase belum ada di storage
const DEFAULT_BASE_URL =
  Platform.OS === "android" ? "http://172.31.129.242:8000" : "http://localhost:8000";

export default function ProfilScreen() {
  const [apiBase, setApiBase] = useState(DEFAULT_BASE_URL);
  const API_URL = `${apiBase}/api/profile`;

  const [username, setUsername] = useState("");
  const [nama, setNama] = useState("");

  // simpan ID untuk submit, tapi yang ditampilkan ke user adalah nama unit
  const [unitId, setUnitId] = useState("");
  const [unitName, setUnitName] = useState("");

  const [photoUri, setPhotoUri] = useState<string | null>(null);

  const [editing, setEditing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [loggingOut, setLoggingOut] = useState(false);

  // Prefill dari AsyncStorage (apiBase + auth.user)
  const prefillFromStorage = useCallback(async () => {
    try {
      const [storedApiBase, storedUserStr] = await Promise.all([
        AsyncStorage.getItem("app.apiBase"),
        AsyncStorage.getItem("auth.user"),
      ]);

      if (storedApiBase && typeof storedApiBase === "string") {
        setApiBase(storedApiBase);
        console.log("🔗 apiBase from storage:", storedApiBase);
      } else {
        console.log("🔗 apiBase fallback:", DEFAULT_BASE_URL);
      }

      if (storedUserStr) {
        try {
          const u = JSON.parse(storedUserStr);

          if (u?.username) setUsername(u.username);
          if (u?.nama) setNama((prev: string) => prev || u.nama);

          if (u?.unit_id != null) {
            const idStr = String(u.unit_id);
            setUnitId(idStr);
            console.log("✅ Prefilled unit_id:", idStr);
          }

          // Ambil label unit dari cache login jika tersedia
          if (typeof u?.unit === "string") {
            setUnitName(u.unit);
          } else if (typeof u?.unit === "object" && u?.unit) {
            setUnitName(u.unit?.nama_unit ?? u.unit?.name ?? u.unit?.nama ?? "");
          }
        } catch (e) {
          console.warn("⚠️ parse auth.user failed:", e);
        }
      }
    } catch (e) {
      console.warn("⚠️ prefillFromStorage error:", e);
    }
  }, []);

  // Fallback: kalau hanya punya unit_id, ambil nama unit by id
  const fetchUnitNameById = useCallback(
    async (id: string) => {
      try {
        if (!id) return;
        const token = await AsyncStorage.getItem("auth.token");
        if (!token) return;

        // UBAH endpoint sesuai backend kamu
        // Misal kamu punya route: GET /api/units/{id}
        const res = await fetch(`${apiBase}/api/units/${id}`, {
          headers: { Authorization: `Bearer ${token}`, Accept: "application/json" },
        });
        if (!res.ok) return;
        const j = await res.json();
        const label =
          j?.data?.nama_unit ||
          j?.data?.name ||
          j?.unit?.nama_unit ||
          j?.unit?.name ||
          j?.nama_unit ||
          j?.name ||
          "";
        if (label) {
          setUnitName(label);
          // simpan ke cache user juga biar screen lain bisa pakai
          const userStr = await AsyncStorage.getItem("auth.user");
          if (userStr) {
            const user = JSON.parse(userStr);
            await AsyncStorage.setItem(
              "auth.user",
              JSON.stringify({ ...user, unit: label })
            );
          }
        }
      } catch (e) {
        console.log("⚠️ fetchUnitNameById error:", e);
      }
    },
    [apiBase]
  );

  // Load profil dari server
  const loadProfile = useCallback(async () => {
    try {
      const token = await AsyncStorage.getItem("auth.token");

      if (!token) {
        Alert.alert("Sesi Habis", "Silakan login kembali");
        router.replace("/login");
        return;
      }

      console.log("📡 Fetching profile:", API_URL);
      const res = await fetch(API_URL, {
        method: "GET",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          "Content-Type": "application/json",
        },
      });

      console.log("📊 Response status:", res.status);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const json = await res.json();
      console.log("📦 Response data:", JSON.stringify(json, null, 2));

      if (json.status === "success" && json.user) {
        const user = json.user;
        const profil = user.profil;

        setUsername(user.username || "");
        setNama(profil?.nama_pegawai || user.username || "");

        // ID untuk submit
        const serverUnitId =
          (profil?.unit_id != null && String(profil.unit_id)) ||
          (user?.unit_id != null && String(user.unit_id)) ||
          unitId;
        setUnitId(serverUnitId || "");

        // Label unit untuk ditampilkan
        const nameFromServer =
          (typeof user?.unit === "object" &&
            (user.unit?.nama_unit ?? user.unit?.name ?? user.unit?.nama)) ||
          user?.unit_name ||
          (typeof user?.unit === "string" ? user.unit : "") ||
          "";

        if (nameFromServer) {
          setUnitName(nameFromServer);
        } else if (!unitName && serverUnitId) {
          // fallback lookup jika label belum ada
          await fetchUnitNameById(serverUnitId);
        }

        // Foto
        if (json.photo_url) setPhotoUri(json.photo_url);
        else setPhotoUri(null);

        // Sinkronkan cache
        const updatedUser = {
          id: user.id,
          username: user.username,
          nama: profil?.nama_pegawai || user.username,
          unit_id: serverUnitId ? Number(serverUnitId) : undefined,
          role: user.role,
          unit: nameFromServer || unitName || undefined,
        };
        await AsyncStorage.setItem("auth.user", JSON.stringify(updatedUser));
      } else {
        throw new Error(json.message || "Gagal memuat profil");
      }
    } catch (e) {
      console.error("❌ Error fetch profil:", e);
      Alert.alert("Error", "Terjadi kesalahan saat memuat profil");
    }
  }, [API_URL, unitId, unitName, fetchUnitNameById]);

  useEffect(() => {
    const init = async () => {
      setLoading(true);
      await prefillFromStorage();
      await new Promise((r) => setTimeout(r, 100));
      await loadProfile();
      setLoading(false);
    };
    init();
  }, [prefillFromStorage, loadProfile]);

  // Ganti foto
  const pickImage = useCallback(async () => {
    const { status } = await ImagePicker.requestMediaLibraryPermissionsAsync();
    if (status !== "granted") {
      Alert.alert("Izin diperlukan", "Beri akses galeri untuk ganti foto.");
      return;
    }

    const result = await ImagePicker.launchImageLibraryAsync({
      mediaTypes: ["images"],
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

  // Hapus foto (local state saja; server dihapus saat Save bila kamu implement)
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

  // Simpan profil (kirim unit_id, bukan nama unit)
  const handleSave = async () => {
    try {
      setSaving(true);
      const token = await AsyncStorage.getItem("auth.token");
      if (!token) {
        Alert.alert("Error", "Token tidak ditemukan");
        return;
      }

      const formData = new FormData();
      if (nama) formData.append("nama_pegawai", nama);
      if (unitId) formData.append("unit_id", unitId);

      if (photoUri) {
        if (photoUri.startsWith("file://") || photoUri.startsWith("blob:")) {
          if (Platform.OS === "web" && photoUri.startsWith("blob:")) {
            const response = await fetch(photoUri);
            const blob = await response.blob();
            formData.append("photo", blob, "photo.jpg");
          } else {
            const filename = photoUri.split("/").pop() || "photo.jpg";
            const match = /\.(\w+)$/.exec(filename);
            const type = match ? `image/${match[1]}` : "image/jpeg";
            formData.append("photo", {
              uri: photoUri,
              name: filename,
              type,
            } as any);
          }
        }
      }

      console.log("💾 POST:", `${apiBase}/api/profile`);
      const res = await fetch(`${apiBase}/api/profile`, {
        method: "POST",
        headers: {
          Authorization: `Bearer ${token}`,
          Accept: "application/json",
          // biarkan RN set boundary untuk FormData
        },
        body: formData,
      });

      console.log("📊 Update status:", res.status);
      if (!res.ok) throw new Error(`HTTP error! status: ${res.status}`);

      const json = await res.json();
      console.log("📦 Update response:", JSON.stringify(json, null, 2));

      if (json.status === "success") {
        Alert.alert("Berhasil", json.message || "Profil berhasil diperbarui!");
        setEditing(false);
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

  // Logout
  const handleLogout = async () => {
    let confirmed = false;

    if (Platform.OS === "web") {
      confirmed = window.confirm("Yakin ingin keluar?");
    } else {
      confirmed = await new Promise((resolve) => {
        Alert.alert("Logout", "Yakin ingin keluar?", [
          { text: "Batal", style: "cancel", onPress: () => resolve(false) },
          { text: "Keluar", style: "destructive", onPress: () => resolve(true) },
        ]);
      });
    }

    if (!confirmed) return;

    try {
      setLoggingOut(true);
      await AsyncStorage.multiRemove(["auth.user", "auth.token"]);
      router.replace("/login");
    } catch (error) {
      console.error("❌ Error logout:", error);
      setLoggingOut(false);
      Alert.alert("Error", "Gagal logout. Silakan coba lagi.");
    }
  };

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

      <ScrollView contentContainerStyle={styles.scrollContent} showsVerticalScrollIndicator={false}>
        {/* Avatar */}
        <View className="avatarSection" style={styles.avatarSection}>
          <View style={styles.avatarWrap}>
            <View style={styles.avatarCircle}>
              {photoUri ? (
                <Image
                  source={{ uri: photoUri }}
                  style={styles.avatarImg}
                  onError={(e) => console.error("❌ Image error:", e.nativeEvent.error)}
                />
              ) : (
                <Ionicons name="person" size={56} color={COLORS.sub} />
              )}
            </View>

            <TouchableOpacity style={styles.cameraBtn} onPress={pickImage} disabled={saving}>
              <Ionicons name="camera" size={18} color="#fff" />
            </TouchableOpacity>

            {photoUri && (
              <TouchableOpacity style={styles.trashBtn} onPress={removeImage} disabled={saving}>
                <Ionicons name="trash" size={16} color="#fff" />
              </TouchableOpacity>
            )}
          </View>
        </View>

        {/* Username */}
        <View style={styles.card}>
          <Text style={styles.label}>Username</Text>
          <Text style={styles.value}>{username || "Belum diisi"}</Text>
        </View>

        {/* Nama Pegawai */}
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

        {/* Unit (tampilkan nama unit, bukan ID) */}
        <View style={styles.card}>
          <Text style={styles.label}>Unit</Text>
          <Text style={styles.value}>{unitName || "Belum diisi"}</Text>
        </View>

        {/* Edit/Save */}
        <TouchableOpacity
          style={[styles.primaryBtn, saving && styles.btnDisabled]}
          onPress={() => (editing ? handleSave() : setEditing(true))}
          disabled={saving}
        >
          {saving ? (
            <ActivityIndicator color="#fff" />
          ) : (
            <Text style={styles.primaryText}>{editing ? "Simpan Perubahan" : "Edit Profil"}</Text>
          )}
        </TouchableOpacity>

        {/* Cancel */}
        {editing && !saving && (
          <TouchableOpacity
            style={styles.cancelBtn}
            onPress={() => {
              setEditing(false);
              loadProfile();
            }}
          >
            <Text style={styles.cancelText}>Batal</Text>
          </TouchableOpacity>
        )}

        {/* Logout */}
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
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { backgroundColor: COLORS.brand, padding: 16, paddingTop: Platform.OS === "ios" ? 50 : 16 },
  headerTitle: { color: "#fff", fontWeight: "800", fontSize: 20, textAlign: "center" },
  center: { flex: 1, justifyContent: "center", alignItems: "center", backgroundColor: COLORS.bg },
  loadingText: { marginTop: 12, color: COLORS.sub, fontSize: 14 },
  scrollContent: { padding: 16, paddingBottom: 32 },

  // Avatar
  avatarSection: { alignItems: "center", marginVertical: 24 },
  avatarWrap: { position: "relative" },
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
  avatarImg: { width: AVATAR_SIZE, height: AVATAR_SIZE },
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
  value: { fontSize: 16, fontWeight: "600", color: COLORS.text },
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
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  cancelBtn: {
    marginTop: 12,
    backgroundColor: COLORS.card,
    padding: 16,
    borderRadius: 12,
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  cancelText: { color: COLORS.text, fontWeight: "700", fontSize: 16 },
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
  logoutText: { color: "#fff", fontWeight: "700", fontSize: 16 },
  btnDisabled: { opacity: 0.6 },
});
