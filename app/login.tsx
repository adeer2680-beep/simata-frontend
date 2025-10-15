// app/login.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity, ActivityIndicator,
  Platform, KeyboardAvoidingView, Alert, SafeAreaView, ScrollView, Modal
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import * as Application from "expo-application";

const C = {
  bg: "#ffffff",
  text: "#0f172a",
  sub: "#6b7280",
  pill: "#f3f4f6",
  border: "#e5e7eb",
  brand: "#42909b",      // header brand color
  brandDim: "#a9d5db",
  danger: "#ef4444",
} as const;

const ENV_BASE = process.env.EXPO_PUBLIC_API_BASE;
const DEFAULT_BASE =
  Platform.OS === "android" ? "http://10.0.2.2:8000" : "http://localhost:8000";
const API_BASE = ENV_BASE || DEFAULT_BASE;

type Role = "siswa" | "guru";

export default function LoginRegisterScreen() {
  const [showRegModal, setShowRegModal] = useState(false);

  // LOGIN state
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [imei, setImei] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loadingLogin, setLoadingLogin] = useState(false);
  const [errLogin, setErrLogin] = useState<string | null>(null);

  // REGISTER state
  const [rUsername, setRUsername] = useState("");
  const [rPassword, setRPassword] = useState("");
  const [rRole, setRRole] = useState<Role>("siswa");
  const [rUnitId, setRUnitId] = useState("");
  const [rImei, setRImei] = useState("");
  const [loadingReg, setLoadingReg] = useState(false);

  // Prefill device ID
  useEffect(() => {
    (async () => {
      try {
        let stored = (await AsyncStorage.getItem("device.id")) ?? "";
        if (!stored) {
          if (Platform.OS === "android" && Application.getAndroidId) {
            stored = (await Application.getAndroidId()) ?? "";
          } else if (Platform.OS === "ios" && (Application as any).getIosIdForVendorAsync) {
            stored = (await (Application as any).getIosIdForVendorAsync()) ?? "";
          }
          if (stored) await AsyncStorage.setItem("device.id", stored);
        }
        if (stored) {
          setImei((p) => p || stored);
          setRImei((p) => p || stored);
        }
      } catch {}
    })();
  }, []);

  const loginValid = useMemo(
    () => username.trim() !== "" && password.trim() !== "" && imei.trim() !== "",
    [username, password, imei]
  );

  const registerValid = useMemo(
    () => rUsername.trim() !== "" && rPassword.trim().length >= 6 && rUnitId.trim() !== "" && rImei.trim() !== "",
    [rUsername, rPassword, rUnitId, rImei]
  );

  const persistAndGo = async (data: any) => {
    const accessToken: string | undefined = data?.access_token;
    const tokenType: string = data?.token_type || "Bearer";
    const user = data?.user;
    if (!accessToken || !user) throw new Error("Token atau data user tidak ditemukan.");

    const displayName = user?.nama ?? user?.username ?? "Pengguna";
    const unitLabel = user?.unit_name ?? user?.unit ?? String(user?.unit_id ?? "");
    const userObj = {
      id: user?.id, username: user?.username, role: user?.role,
      unit_id: user?.unit_id, nama: displayName, unit: unitLabel
    };

    await AsyncStorage.multiSet([
      ["auth.token", accessToken],
      ["auth.tokenType", tokenType],
      ["auth.user", JSON.stringify(userObj)],
      ["auth.beranda", [displayName, unitLabel].filter(Boolean).join(" • ")],
    ]);
    router.push("/tabs");
  };

  const handleLogin = async () => {
    if (!loginValid) {
      setErrLogin("Lengkapi username, password, dan IMEI.");
      Alert.alert("Login gagal", "Lengkapi username, password, dan IMEI.");
      return;
    }
    setLoadingLogin(true);
    setErrLogin(null);
    try {
      const res = await fetch(`${API_BASE}/api/login`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({ username: username.trim(), password, imei }),
      });
      const raw = await res.text();
      let json: any = null;
      try { json = JSON.parse(raw); } catch { throw new Error("Format respons server tidak valid."); }
      if (!res.ok || json?.status !== "success") {
        throw new Error(json?.message || `Login gagal (HTTP ${res.status})`);
      }
      await persistAndGo(json);
    } catch (e: any) {
      setErrLogin(e?.message || "Terjadi kesalahan saat login.");
      Alert.alert("Login gagal", e?.message || "Terjadi kesalahan saat login.");
    } finally {
      setLoadingLogin(false);
    }
  };

  const handleRegister = async () => {
    if (!registerValid) {
      Alert.alert("Lengkapi", "Semua field wajib diisi (password min 6 karakter).");
      return;
    }
    try {
      setLoadingReg(true);
      const res = await fetch(`${API_BASE}/api/register`, {
        method: "POST",
        headers: { "Content-Type": "application/json", Accept: "application/json" },
        body: JSON.stringify({
          username: rUsername.trim(),
          password: rPassword,
          imei: rImei,
          role: rRole,
          unit_id: Number(rUnitId),
        }),
      });
      if (!res.ok) {
        if (res.status === 422) {
          const data = await res.json();
          const msgs = data?.errors ? Object.values<string[]>(data.errors).flat() : [data?.message || "Validasi gagal"];
          Alert.alert("Gagal", msgs.join("\n"));
        } else {
          const t = await res.text();
          Alert.alert("Error", `Status ${res.status}: ${t}`);
        }
        return;
      }
      const data = await res.json();
      if (data?.access_token && data?.user) {
        Alert.alert("Berhasil", data?.message ?? "Registrasi sukses 🎉");
        await persistAndGo(data);
        return;
      }
      Alert.alert("Berhasil", data?.message ?? "Registrasi sukses. Silakan login.");
      setShowRegModal(false);
      setUsername(rUsername);
      setPassword(rPassword);
      setImei(rImei);
    } catch (e: any) {
      Alert.alert("Error", e?.message ?? "Terjadi kesalahan jaringan.");
    } finally {
      setLoadingReg(false);
    }
  };

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {/* ===== Header kustom: warna brand + tombol back kotak ===== */}
      <View style={s.header}>
        <TouchableOpacity
          onPress={() => router.back()}
          style={s.backBox}
          activeOpacity={0.7}
        >
          <Ionicons
            name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"}
            size={18}
            color="#000"
          />
        </TouchableOpacity>
        <Text style={s.headerTitle}>Masuk</Text>
        <View style={{ width: 40 }} />
      </View>

      <KeyboardAvoidingView style={{ flex: 1 }} behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
          <View style={s.hero}>
            <Text style={s.appTitle}>SIMATA</Text>
            <Text style={s.appSubtitle}>Sistem Informasi Permata</Text>
          </View>

          <View style={s.form}>
            <View style={s.pill}>
              <Ionicons name="person-outline" size={18} color={C.sub} style={s.icon} />
              <TextInput
                style={s.input}
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                placeholderTextColor={C.sub}
                autoCapitalize="none"
              />
            </View>

            <View style={s.pill}>
              <Ionicons name="lock-closed-outline" size={18} color={C.sub} style={s.icon} />
              <TextInput
                style={s.input}
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={C.sub}
                autoCapitalize="none"
                secureTextEntry={!showPass}
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)}>
                <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color={C.sub} />
              </TouchableOpacity>
            </View>

            <View style={s.pill}>
              <Ionicons name="phone-portrait-outline" size={18} color={C.sub} style={s.icon} />
              <TextInput
                style={s.input}
                value={imei}
                onChangeText={setImei}
                placeholder="IMEI / ANDROID_ID"
                placeholderTextColor={C.sub}
              />
            </View>

            {errLogin ? <Text style={s.errText}>{errLogin}</Text> : null}

            <TouchableOpacity
              style={[s.primaryBtn, (!loginValid || loadingLogin) && { backgroundColor: C.brandDim }]}
              disabled={!loginValid || loadingLogin}
              onPress={handleLogin}
              activeOpacity={0.9}
            >
              {loadingLogin ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>Login</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => setShowRegModal(true)} style={{ marginTop: 16 }} activeOpacity={0.8}>
              <Text style={{ textAlign: "center", color: C.text, fontWeight: "700" }}>
                Belum punya akun? <Text style={{ color: C.brand }}>Daftar →</Text>
              </Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 32 }} />
        </ScrollView>
      </KeyboardAvoidingView>

      {/* REGISTER (MODAL) */}
      <Modal visible={showRegModal} animationType="slide" onRequestClose={() => setShowRegModal(false)}>
        <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
          <View style={s.modalHeader}>
            <TouchableOpacity onPress={() => setShowRegModal(false)} style={s.modalClose} activeOpacity={0.85}>
              <Ionicons name="close" size={20} color={C.text} />
            </TouchableOpacity>
            <Text style={s.modalTitle}>Daftar Akun</Text>
            <View style={{ width: 40 }} />
          </View>

          <ScrollView contentContainerStyle={s.scroll} keyboardShouldPersistTaps="handled">
            <RegisterForm
              rUsername={rUsername} setRUsername={setRUsername}
              rPassword={rPassword} setRPassword={setRPassword}
              rRole={rRole} setRRole={setRRole}
              rUnitId={rUnitId} setRUnitId={setRUnitId}
              rImei={rImei} setRImei={setRImei}
              loadingReg={loadingReg} registerValid={registerValid}
              onSubmit={handleRegister}
              onBackToLogin={() => setShowRegModal(false)}
            />
            <View style={{ height: 24 }} />
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </SafeAreaView>
  );
}

function RegisterForm({ rUsername, setRUsername, rPassword, setRPassword, rRole, setRRole, rUnitId, setRUnitId, rImei, setRImei, loadingReg, registerValid, onSubmit, onBackToLogin }: any) {
  return (
    <View style={s.form}>
      <Text style={s.label}>Username</Text>
      <TextInput style={s.inputBox} value={rUsername} onChangeText={setRUsername} autoCapitalize="none" placeholder="username unik" placeholderTextColor={C.sub} />

      <Text style={s.label}>Password (min 6)</Text>
      <TextInput style={s.inputBox} value={rPassword} onChangeText={setRPassword} secureTextEntry placeholder="••••••" placeholderTextColor={C.sub} />

      <Text style={s.label}>Role</Text>
      <View style={s.segment}>
        <TouchableOpacity style={[s.segmentBtn, rRole === "siswa" && s.segmentBtnActive]} onPress={() => setRRole("siswa")}>
          <Text style={[s.segmentText, rRole === "siswa" && s.segmentTextActive]}>Siswa</Text>
        </TouchableOpacity>
        <TouchableOpacity style={[s.segmentBtn, rRole === "guru" && s.segmentBtnActive]} onPress={() => setRRole("guru")}>
          <Text style={[s.segmentText, rRole === "guru" && s.segmentTextActive]}>Guru</Text>
        </TouchableOpacity>
      </View>

      <Text style={s.label}>Unit ID</Text>
      <TextInput style={s.inputBox} value={rUnitId} onChangeText={setRUnitId} keyboardType="number-pad" placeholder="contoh: 1" placeholderTextColor={C.sub} />

      <Text style={s.label}>Device Identifier (IMEI)</Text>
      <View style={s.pill}>
        <Ionicons name="phone-portrait-outline" size={18} color={C.sub} style={s.icon} />
        <TextInput style={s.input} value={rImei} onChangeText={setRImei} placeholder="otomatis terisi — bisa edit" placeholderTextColor={C.sub} />
      </View>

      <TouchableOpacity onPress={onSubmit} activeOpacity={0.9} style={[s.primaryBtn, (!registerValid || loadingReg) && { backgroundColor: C.brandDim }]} disabled={!registerValid || loadingReg}>
        {loadingReg ? <ActivityIndicator color="#fff" /> : <Text style={s.primaryText}>Daftar</Text>}
      </TouchableOpacity>

      <TouchableOpacity onPress={onBackToLogin} style={{ marginTop: 16 }} activeOpacity={0.8}>
        <Text style={{ textAlign: "center", color: C.text, fontWeight: "700" }}>
          Sudah punya akun? <Text style={{ color: C.brand }}>Login →</Text>
        </Text>
      </TouchableOpacity>
    </View>
  );
}

const s = StyleSheet.create({
  // Header
  header: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.brand,
    paddingHorizontal: 16,
    paddingTop: Platform.select({ ios: 8, android: 10, default: 10 }),
    paddingBottom: 12,
    gap: 12,
  },
  backBox: {
    width: 40,
    height: 32,
    borderRadius: 6,           // ← kotak (bukan bulat)
    backgroundColor: "#e7f1f3",
    alignItems: "center",
    justifyContent: "center",
  },
  headerTitle: {
    flex: 1,
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
  },

  // Body
  scroll: { paddingHorizontal: 24, paddingTop: 24, paddingBottom: 48, backgroundColor: C.bg },
  hero: { alignItems: "center", marginBottom: 12 },
  appTitle: { fontSize: 28, fontWeight: "900", letterSpacing: 1, color: C.text },
  appSubtitle: { color: C.sub, marginTop: 4 },
  form: { marginTop: 8 },
  pill: { flexDirection: "row", alignItems: "center", backgroundColor: C.pill, borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12 },
  icon: { marginRight: 8 },
  input: { flex: 1, color: C.text, fontSize: 14 },
  errText: { color: C.danger, textAlign: "center", marginBottom: 8 },
  primaryBtn: { backgroundColor: C.brand, borderRadius: 999, paddingVertical: 14, alignItems: "center", marginTop: 6 },
  primaryText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  label: { fontSize: 12, color: C.sub, fontWeight: "700", marginTop: 6, marginBottom: 6 },
  inputBox: { borderWidth: 1, borderColor: C.border, borderRadius: 12, paddingVertical: 12, paddingHorizontal: 12, color: C.text, backgroundColor: "#fff", marginBottom: 8 },
  segment: { flexDirection: "row", gap: 8, marginBottom: 8 },
  segmentBtn: { flex: 1, borderWidth: 1, borderColor: C.border, borderRadius: 10, paddingVertical: 10, alignItems: "center", backgroundColor: "#fff" },
  segmentBtnActive: { backgroundColor: C.brand, borderColor: C.brand },
  segmentText: { color: C.text, fontWeight: "700" },
  segmentTextActive: { color: "#fff" },

  // Modal
  modalHeader: { flexDirection: "row", alignItems: "center", justifyContent: "space-between", paddingHorizontal: 16, paddingVertical: 12, borderBottomWidth: 1, borderColor: C.border, backgroundColor: "#fff" },
  modalClose: { width: 40, height: 40, borderRadius: 10, alignItems: "center", justifyContent: "center", backgroundColor: C.pill }, // kotak rounded
  modalTitle: { fontSize: 16, fontWeight: "800", color: C.text },
});
