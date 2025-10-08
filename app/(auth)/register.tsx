// app/(auth)/register.tsx
import React, { useEffect, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Alert,
  StyleSheet,
  Platform,
} from "react-native";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";
import { Ionicons } from "@expo/vector-icons";

const API_BASE = "https://your-api-domain.com/api"; // TODO: ganti ke domain API kamu

const COLORS = {
  brand: "#42909b",
  border: "#e5e7eb",
  text: "#0f172a",
  sub: "#334155",
  bg: "#fff",
} as const;

export default function RegisterScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [role, setRole] = useState<"guru" | "siswa">("siswa");
  const [unitId, setUnitId] = useState<string>("");
  const [imei, setImei] = useState<string>(""); // ANDROID_ID dikirim pada field 'imei'
  const [loading, setLoading] = useState(false);

  // Ambil ANDROID_ID (disimpan sebagai device.id), kirim sebagai "imei"
  useEffect(() => {
    (async () => {
      try {
        let id = (await AsyncStorage.getItem("device.id")) ?? "";

        if (!id) {
          if (Platform.OS === "android") {
            const got = Application.getAndroidId?.() ?? "";
            if (got) id = got;
          } else if (Platform.OS === "ios") {
            // Opsional jika suatu saat support iOS
            const iosId = await Application.getIosIdForVendorAsync?.();
            if (iosId) id = iosId;
          }
          if (id) await AsyncStorage.setItem("device.id", id);
        }

        setImei(id);
      } catch {
        setImei("");
      }
    })();
  }, []);

  const onSubmit = async () => {
    if (!username.trim() || !password.trim() || !unitId.trim() || !role || !imei.trim()) {
      Alert.alert("Lengkapi", "Semua field wajib diisi.");
      return;
    }
    if (password.length < 6) {
      Alert.alert("Validasi", "Password minimal 6 karakter.");
      return;
    }

    try {
      setLoading(true);

      const res = await fetch(`${API_BASE}/register-aplikasi`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          username: username.trim(),
          password,
          imei,                    // ANDROID_ID dikirim sebagai 'imei'
          role,                    // 'guru' | 'siswa'
          unit_id: Number(unitId), // pastikan number untuk validasi exists:units,id
        }),
      });

      if (!res.ok) {
        if (res.status === 422) {
          const data = await res.json();
          const msgs = data?.errors
            ? Object.values<string[]>(data.errors).flat()
            : [data?.message || "Validasi gagal"];
          Alert.alert("Gagal", msgs.join("\n"));
        } else {
          const t = await res.text();
          Alert.alert("Error", `Status ${res.status}: ${t}`);
        }
        return;
      }

      const data = await res.json();
      await AsyncStorage.multiSet([
        ["auth.token", data.access_token],
        ["auth.user", JSON.stringify(data.user)],
      ]);

      Alert.alert("Berhasil", data?.message ?? "Registrasi sukses 🎉");
      router.replace("/"); // kembali ke beranda
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Terjadi kesalahan jaringan.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <View style={s.wrap}>
      <Text style={s.title}>Register Akun</Text>

      <Text style={s.label}>Username</Text>
      <TextInput
        style={s.input}
        value={username}
        onChangeText={setUsername}
        autoCapitalize="none"
        placeholder="username unik"
        placeholderTextColor={COLORS.sub}
      />

      <Text style={s.label}>Password</Text>
      <TextInput
        style={s.input}
        value={password}
        onChangeText={setPassword}
        secureTextEntry
        placeholder="min 6 karakter"
        placeholderTextColor={COLORS.sub}
      />

      <Text style={s.label}>Role</Text>
      <View style={s.segment}>
        <TouchableOpacity
          style={[s.segmentBtn, role === "siswa" && s.segmentBtnActive]}
          onPress={() => setRole("siswa")}
        >
          <Text style={[s.segmentText, role === "siswa" && s.segmentTextActive]}>Siswa</Text>
        </TouchableOpacity>
        <TouchableOpacity
          style={[s.segmentBtn, role === "guru" && s.segmentBtnActive]}
          onPress={() => setRole("guru")}
        >
          <Text style={[s.segmentText, role === "guru" && s.segmentTextActive]}>Guru</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.label}>Unit ID</Text>
      <TextInput
        style={s.input}
        value={unitId}
        onChangeText={setUnitId}
        keyboardType="number-pad"
        placeholder="contoh: 1"
        placeholderTextColor={COLORS.sub}
      />

      <Text style={s.label}>Device Identifier (otomatis → dikirim sebagai IMEI)</Text>
      <View style={s.pill}>
        <Ionicons
          name="phone-portrait-outline"
          size={18}
          color={COLORS.sub}
          style={{ marginRight: 8 }}
        />
        <TextInput
          value={imei}
          onChangeText={setImei} // boleh editable agar admin bisa override manual
          placeholder="otomatis terisi (ANDROID_ID)"
          placeholderTextColor={COLORS.sub}
          style={s.inputPill}
          editable
        />
      </View>

      <TouchableOpacity
        onPress={onSubmit}
        activeOpacity={0.85}
        style={[s.btnPrimary, (!username || !password || !unitId || !imei) && { opacity: 0.6 }]}
        disabled={loading || !username || !password || !unitId || !imei}
      >
        {loading ? (
          <ActivityIndicator color="#fff" />
        ) : (
          <>
            <Ionicons name="person-add-outline" size={18} color="#fff" style={{ marginRight: 8 }} />
            <Text style={s.btnPrimaryText}>Daftar</Text>
          </>
        )}
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  wrap: { flex: 1, backgroundColor: COLORS.bg, padding: 16, gap: 10 },
  title: { fontSize: 20, fontWeight: "800", color: COLORS.text, marginBottom: 4 },
  label: { fontSize: 12, color: COLORS.sub, fontWeight: "700", marginTop: 6 },
  input: {
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 12,
    color: COLORS.text,
    backgroundColor: "#fff",
  },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 12,
    paddingHorizontal: 10,
    backgroundColor: "#fff",
  },
  inputPill: { flex: 1, paddingVertical: 10, color: COLORS.text },
  segment: { flexDirection: "row", gap: 8, marginTop: 6 },
  segmentBtn: {
    flex: 1,
    borderWidth: 1,
    borderColor: COLORS.border,
    borderRadius: 10,
    paddingVertical: 10,
    alignItems: "center",
    backgroundColor: "#fff",
  },
  segmentBtnActive: { backgroundColor: COLORS.brand, borderColor: COLORS.brand },
  segmentText: { color: COLORS.text, fontWeight: "700" },
  segmentTextActive: { color: "#fff" },
  btnPrimary: {
    marginTop: 14,
    backgroundColor: COLORS.brand,
    borderRadius: 12,
    paddingVertical: 12,
    paddingHorizontal: 14,
    flexDirection: "row",
    alignItems: "center",
    justifyContent: "center",
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  btnPrimaryText: { color: "#fff", fontWeight: "800", fontSize: 14, marginLeft: 8 },
});
