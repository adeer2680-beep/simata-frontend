// app/login.tsx
import React, { useMemo, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TextInput,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  KeyboardAvoidingView,
  Alert,
  SafeAreaView,
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
  brand: "#42909b",     // ⬅️ seragam
  brandDim: "#a9d5db",  // ⬅️ versi redup untuk disabled
  danger: "#ef4444",
} as const;

const API_URL =
  Platform.OS === "android"
    ? "http://10.0.2.2:8000/api/login"
    : "http://localhost:8000/api/login";

export default function LoginScreen() {
  const [username, setUsername] = useState("");
  const [password, setPassword] = useState("");
  const imei = "1234567890"; // dummy jika backend memerlukan
  const [showPass, setShowPass] = useState(false);
  const [loading, setLoading] = useState(false);
  const [err, setErr] = useState<string | null>(null);

  const valid = useMemo(() => username.trim() && password.trim(), [username, password]);

  const handleLogin = async () => {
    if (!valid) return;
    setErr(null);
    setLoading(true);
    try {
      const res = await fetch(API_URL, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ username, password, imei }),
      });

      const text = await res.text();
      let json: any = {};
      try { json = JSON.parse(text); } catch {}

      if (!res.ok) {
        const msg = json?.message || `Login gagal (HTTP ${res.status})`;
        throw new Error(msg);
      }

      await AsyncStorage.setItem("auth.user", JSON.stringify(json.data ?? {}));
      router.replace("/");
    } catch (e: any) {
      const msg = e?.message ?? "Terjadi kesalahan saat login.";
      setErr(msg);
      Alert.alert("Login gagal", msg);
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

      <KeyboardAvoidingView
        style={{ flex: 1, backgroundColor: C.bg }}
        behavior={Platform.OS === "ios" ? "padding" : undefined}
      >
        <View style={s.container}>
          {/* Logo / Title */}
          <View style={s.hero}>
            <Text style={s.appTitle}>SIMATA</Text>
            <Text style={s.appSubtitle}>Sistem Informasi Permata</Text>
          </View>

          {/* Form */}
          <View style={s.form}>
            {/* Username */}
            <View style={s.pill}>
              <Ionicons name="person-outline" size={18} color={C.sub} style={{ marginRight: 8 }} />
              <TextInput
                value={username}
                onChangeText={setUsername}
                placeholder="Username"
                placeholderTextColor={C.sub}
                style={s.input}
                autoCapitalize="none"
                autoCorrect={false}
                returnKeyType="next"
              />
            </View>

            {/* Password */}
            <View style={s.pill}>
              <Ionicons name="lock-closed-outline" size={18} color={C.sub} style={{ marginRight: 8 }} />
              <TextInput
                value={password}
                onChangeText={setPassword}
                placeholder="Password"
                placeholderTextColor={C.sub}
                style={s.input}
                secureTextEntry={!showPass}
                autoCapitalize="none"
                returnKeyType="done"
              />
              <TouchableOpacity onPress={() => setShowPass((v) => !v)}>
                <Ionicons name={showPass ? "eye-off-outline" : "eye-outline"} size={18} color={C.sub} />
              </TouchableOpacity>
            </View>

            {/* Forgot password */}
            <TouchableOpacity onPress={() => Alert.alert("Info", "Fitur lupa kata sandi akan tersedia.")}>
              <Text style={s.forgot}>Forgot password?</Text>
            </TouchableOpacity>

            {/* Error */}
            {err ? <Text style={s.errText}>{err}</Text> : null}

            {/* Login button */}
            <TouchableOpacity
              style={[s.loginBtn, (!valid || loading) && { backgroundColor: C.brandDim }]}
              disabled={!valid || loading}
              onPress={handleLogin}
            >
              {loading ? <ActivityIndicator color="#fff" /> : <Text style={s.loginText}>Login</Text>}
            </TouchableOpacity>
          </View>

          <View style={{ height: 32 }} />
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  // Header seragam
  header: {
    backgroundColor: C.brand,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.85)", // putih tipis
  },
  headerTitle: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  container: { flex: 1, backgroundColor: C.bg, paddingHorizontal: 24, paddingTop: 24 },
  hero: { alignItems: "center", marginTop: 24, marginBottom: 24 },
  appTitle: { fontSize: 28, fontWeight: "900", letterSpacing: 1, color: C.text },
  appSubtitle: { color: C.sub, marginTop: 4 },

  form: { marginTop: 8 },
  pill: {
    flexDirection: "row",
    alignItems: "center",
    backgroundColor: C.pill,
    borderRadius: 999,
    paddingHorizontal: 16,
    paddingVertical: 12,
    marginBottom: 12,
  },
  input: { flex: 1, color: C.text, fontSize: 14 },
  forgot: { color: C.sub, textAlign: "center", marginVertical: 12 },

  loginBtn: {
    backgroundColor: C.brand,
    borderRadius: 999,
    paddingVertical: 14,
    alignItems: "center",
    marginTop: 6,
  },
  loginText: { color: "#fff", fontWeight: "800", fontSize: 16 },

  errText: { color: C.danger, textAlign: "center", marginBottom: 8 },
});
