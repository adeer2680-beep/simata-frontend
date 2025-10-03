// app/login.tsx
import React, { useMemo, useState } from "react";
import {
  View, Text, StyleSheet, TextInput, TouchableOpacity,
  ActivityIndicator, Platform, KeyboardAvoidingView, Alert, SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const C = {
  bg: "#ffffff",
  text: "#0f172a",
  sub: "#6b7280",
  pill: "#f3f4f6",
  border: "#e5e7eb",
  brand: "#42909b",
  brandDim: "#a9d5db",
  danger: "#ef4444",
} as const;

const API_URL =
  Platform.OS === "android"
    ? "http://192.123.99.156:8000/api/login"
    : "http://localhost:8000/api/login";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const [imei, setImei] = useState("");
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const valid = useMemo(
    () => username.trim() !== "" && password.trim() !== "" && imei.trim() !== "",
    [username, password, imei]
  );

const handleLogin = async () => {
  if (!username?.trim() || !password?.trim() || !imei?.trim()) {
    setErr("Lengkapi username, password, dan IMEI.");
    Alert.alert("Login gagal", "Lengkapi username, password, dan IMEI.");
    return;
  }

  setLoading(true);
  setErr(null);

  try {
    console.log("🔑 MULAI LOGIN =>", { username, imei });

    const res = await fetch(API_URL, {
      method: "POST",
      headers: { "Content-Type": "application/json", Accept: "application/json" },
      body: JSON.stringify({ username, password, imei }),
    });

    const raw = await res.text();
    let json: any = null;
    try { json = JSON.parse(raw); } catch {
      throw new Error("Format respons server tidak valid.");
    }

    console.log("📩 RESPON SERVER:", json);

    if (!res.ok || json?.status !== "success") {
      throw new Error(json?.message || `Login gagal (HTTP ${res.status})`);
    }

    const accessToken: string | undefined = json?.access_token;
    const tokenType: string = json?.token_type || "Bearer";
    const user = json?.user;

    if (!accessToken || !user) {
      throw new Error("Token atau data pengguna tidak ditemukan pada respons.");
    }

    // Siapkan label tampilan untuk Dashboard: nama • unit
    // Backend Anda mengirim "username" & "unit_id". Jika nanti ada "nama" atau "unit_name",
    // kode di bawah otomatis memakainya; kalau belum ada, pakai fallback username & unit_id.
    const displayName = user?.nama ?? user?.username ?? "Pengguna";
    const unitLabel   = user?.unit_name ?? user?.unit ?? String(user?.unit_id ?? "");

    const userObj = {
      id: user?.id,
      username: user?.username,
      role: user?.role,
      unit_id: user?.unit_id,
      // Tambahan field untuk memudahkan tampilan:
      nama: displayName,
      unit: unitLabel,
    };

    // Simpan sesi
    await AsyncStorage.multiSet([
      ["auth.token", accessToken],
      ["auth.tokenType", tokenType],
      ["auth.user", JSON.stringify(userObj)],
      ["auth.beranda", [displayName, unitLabel].filter(Boolean).join(" • ")],
    ]);

    // Verifikasi simpanan
    const t = await AsyncStorage.getItem("auth.token");
    const u = await AsyncStorage.getItem("auth.user");
    console.log("💾 SESSION TERSIMPAN:", {
      tokenPreview: t ? t.slice(0, 12) + "…" : null,
      tokenType,
      userParsed: u ? JSON.parse(u) : null,
    });

    // Arahkan ke Dashboard (pakai push; jika tetap bandel, coba navigate/replace)
    console.log("➡️ ARAHKAN ROUTE KE: /tabs");
    router.push("/tabs");

    // Opsional: beri notifikasi
    // Alert.alert("Berhasil", `Selamat datang ${displayName}`);
  } catch (e: any) {
    console.log("❌ LOGIN ERROR:", e?.message);
    setErr(e?.message || "Terjadi kesalahan saat login.");
    Alert.alert("Login gagal", e?.message || "Terjadi kesalahan saat login.");
  } finally {
    setLoading(false);
  }
};

  const Header = (
    <View style={s.header}>
      <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85} style={s.backBtn}>
        <Ionicons name="chevron-back" size={22} color="#000" />
      </TouchableOpacity>
      <Text style={s.headerTitle}>Login</Text>
      <View style={{ width: 38 }} />
    </View>
  );

  return (
    <SafeAreaView style={{ flex: 1, backgroundColor: C.bg }}>
      {Header}
      <KeyboardAvoidingView style={{ flex: 1, backgroundColor: C.bg }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}>
        <View style={s.container}>
          <View style={s.hero}>
            <Text style={s.appTitle}>SIMATA</Text>
            <Text style={s.appSubtitle}>Sistem Informasi Permata</Text>
          </View>

          <View style={s.form}>
            <View style={s.pill}>
              <Ionicons name="person-outline" size={18} color={C.sub} style={{ marginRight: 8 }} />
              <TextInput
                value={username} onChangeText={setUsername}
                placeholder="Username (admin / user1)" placeholderTextColor={C.sub}
                style={s.input} autoCapitalize="none" autoCorrect={false} returnKeyType="next"
              />
            </View>

            <View style={s.pill}>
              <Ionicons name="lock-closed-outline" size={18} color={C.sub} style={{ marginRight: 8 }} />
              <TextInput
                value={password} onChangeText={setPassword}
                placeholder="Password (admin123 / user123)" placeholderTextColor={C.sub}
                style={s.input} secureTextEntry={!showPass} autoCapitalize="none" returnKeyType="done"
              />
              <TouchableOpacity onPress={() => setShowPass(v => !v)}>
                <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color={C.sub} />
              </TouchableOpacity>
            </View>

            <View style={s.pill}>
              <Ionicons name="phone-portrait-outline" size={18} color={C.sub} style={{ marginRight: 8 }} />
              <TextInput
                value={imei} onChangeText={setImei}
                placeholder="IMEI (000111222 / 1234567890)" placeholderTextColor={C.sub}
                style={s.input} keyboardType="numeric"
              />
            </View>

            {err ? <Text style={s.errText}>{err}</Text> : null}

            <TouchableOpacity
              style={[s.loginBtn, (!valid || loading) && { backgroundColor: C.brandDim }]}
              disabled={!valid || loading}
              onPress={handleLogin}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.loginText}>Login</Text>}
            </TouchableOpacity>

            <TouchableOpacity onPress={() => Alert.alert("Info", "Fitur lupa kata sandi akan tersedia.")}
              style={{ marginTop: 12 }}>
              <Text style={{ color: C.sub, textAlign: "center" }}>Forgot password?</Text>
            </TouchableOpacity>
          </View>

          <View style={{ height: 32 }} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  header: {
    backgroundColor: C.brand,
    paddingHorizontal: 12, paddingBottom: 12, paddingTop: 12,
    flexDirection: "row", alignItems: "center", gap: 8,
  },
  backBtn: {
    width: 38, height: 38, borderRadius: 12,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  headerTitle: { flex: 1, textAlign: "center", color: "#fff", fontSize: 18, fontWeight: "800", letterSpacing: 0.3 },
  container: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 24, paddingTop: 24 },
  hero: { alignItems: "center", marginTop: 24, marginBottom: 24 },
  appTitle: { fontSize: 28, fontWeight: "900", letterSpacing: 1, color: C.text },
  appSubtitle: { color: C.sub, marginTop: 4 },
  form: { marginTop: 8 },
  pill: {
    flexDirection: "row", alignItems: "center", backgroundColor: C.pill,
    borderRadius: 999, paddingHorizontal: 16, paddingVertical: 12, marginBottom: 12,
  },
  input: { flex: 1, color: C.text, fontSize: 14 },
  loginBtn: { backgroundColor: C.brand, borderRadius: 999, paddingVertical: 14, alignItems: "center", marginTop: 6 },
  loginText: { color: "#fff", fontWeight: "800", fontSize: 16 },
  errText: { color: C.danger, textAlign: "center", marginBottom: 8 },
});
