// app/presensi/pulang.tsx
import React, { useEffect, useMemo, useState } from "react";
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  ActivityIndicator,
} from "react-native";
import { Stack, router } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Ionicons } from "@expo/vector-icons";

/* ========= UI ========= */
const COLORS = {
  bg: "#ffffff",
  text: "#0f172a",
  sub: "#475569",
  brand: "#42909b", // ← ganti warna header
  border: "#e5e7eb",
  danger: "#ef4444",
};

const fmtDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const fmtTime = (d = new Date()) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(
    d.getMinutes()
  ).padStart(2, "0")}`;

/* ========= KONFIG API ========= */
const LAN_IP = "192.168.43.182"; // ganti sesuai IP LAN kamu
const USE_ANDROID_EMULATOR = true;

const HOST =
  Platform.OS === "android"
    ? (USE_ANDROID_EMULATOR ? "10.0.2.2" : LAN_IP)
    : LAN_IP;

const API_BASE = `http://localhost:8000/api`;
const PRESENSI_URL = `${API_BASE}/presensi`;

/* ========= TIPE DATA ========= */
type AuthUser = {
  id?: number | string;
  username?: string;
  role?: string;
  unit_id?: number | string;
  nama?: string;
  unit?: string;
};

export default function PresensiPulang() {
  // default jenis boleh diubah sesuai kebutuhan
  const [jenis, setJenis] = useState("Kegiatan Harian");
  const [tanggal, setTanggal] = useState(fmtDate());
  const [waktu, setWaktu] = useState(fmtTime());
  const [jarak, setJarak] = useState("");

  // auto dari sesi login.tsx
  const [displayName, setDisplayName] = useState<string>("");
  const [unitLabel, setUnitLabel] = useState<string>("");
  const [unitId, setUnitId] = useState<number | null>(null);

  // auth
  const [token, setToken] = useState<string | null>(null);
  const [tokenType, setTokenType] = useState<string>("Bearer");

  // status
  const [loading, setLoading] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // segarkan waktu per 30 detik
  useEffect(() => {
    const id = setInterval(() => setWaktu(fmtTime()), 30_000);
    return () => clearInterval(id);
  }, []);

  // baca sesi seperti login.tsx
  useEffect(() => {
    (async () => {
      try {
        const [[, t], [, ttype], [, u], [, beranda]] = await AsyncStorage.multiGet([
          "auth.token",
          "auth.tokenType",
          "auth.user",
          "auth.beranda",
        ]);

        if (t) setToken(t);
        if (ttype) setTokenType(ttype || "Bearer");

        let parsed: AuthUser | null = null;
        if (u) {
          try {
            parsed = JSON.parse(u);
          } catch {
            parsed = null;
          }
        }

        const nameFromUser = (parsed?.nama ?? parsed?.username ?? "Pengguna") + "";
        const unitFromUser = (parsed?.unit ?? String(parsed?.unit_id ?? "")) + "";

        setDisplayName(nameFromUser);
        setUnitLabel(unitFromUser);

        if (parsed?.unit_id != null && parsed.unit_id !== "") {
          const n = Number(parsed.unit_id);
          setUnitId(isNaN(n) ? null : n);
        } else {
          setUnitId(null);
        }

        if (!nameFromUser && beranda) {
          setDisplayName(beranda.split("•")[0].trim());
        }
      } catch (e: any) {
        console.log("Load session error:", e?.message ?? e);
      } finally {
        setLoading(false);
      }
    })();
  }, []);

  const canSubmit = useMemo(
    () => Boolean(jenis && tanggal && waktu && unitId && token),
    [jenis, tanggal, waktu, unitId, token]
  );

  const onSubmit = async () => {
    if (!canSubmit) {
      Alert.alert(
        "Lengkapi Data",
        !token
          ? "Token login tidak ditemukan. Silakan login ulang."
          : !unitId
          ? "Unit belum terdeteksi dari sesi. Pastikan akun punya unit_id."
          : "Harap isi Jenis, Tanggal, dan Waktu."
      );
      return;
    }

    setSubmitting(true);
    try {
      // ⚠️ Jangan kirim 'status': backend menentukan otomatis (datang/pulang)
      const payload: Record<string, any> = {
        unit_id: unitId,
        jenis_presensi: jenis,
        tanggal,
        waktu,
      };
      if (jarak.trim().length > 0 && !isNaN(Number(jarak))) {
        payload.jarak = Number(jarak);
      }

      const res = await fetch(PRESENSI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const text = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(text);
      } catch {}

      if (res.status === 201) {
        const msg =
          json?.message ??
          `Presensi berhasil disimpan${
            json?.data?.status ? ` (${json.data.status})` : ""
          }.`;
        Alert.alert("Sukses", msg);
        setJarak("");
        setJenis("Kegiatan Harian");
      } else {
        console.log("Presensi pulang gagal:", res.status, json ?? text);
      }
    } catch (e: any) {
      console.log("SUBMIT error (pulang):", e?.message ?? e);
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        {/* Header: warna + tombol back bulat */}
        <Stack.Screen
          options={{
            title: "Presensi Pulang",
            headerStyle: { backgroundColor: COLORS.brand },
            headerTitleStyle: { color: "#fff", fontWeight: "800" },
            headerTitleAlign: "center",
            headerShadowVisible: false,
            headerLeft: () => (
              <TouchableOpacity
                onPress={() => router.back()}
                style={styles.backCircle}
                activeOpacity={0.7}
              >
                <Ionicons
                  name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"}
                  size={18}
                  color="#000"
                />
              </TouchableOpacity>
            ),
          }}
        />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 8, color: COLORS.sub }}>Memuat sesi…</Text>
        </View>
      </>
    );
  }

  return (
    <>
      {/* Header: warna #42909b + tombol back bulat */}
      <Stack.Screen
        options={{
          title: "Presensi Pulang",
          headerStyle: { backgroundColor: COLORS.brand },
          headerTitleStyle: { color: "#fff", fontWeight: "800" },
          headerTitleAlign: "center",
          headerShadowVisible: false,
          headerLeft: () => (
            <TouchableOpacity
              onPress={() => router.back()}
              style={styles.backCircle}
              activeOpacity={0.7}
            >
              <Ionicons
                name={Platform.OS === "ios" ? "chevron-back" : "arrow-back"}
                size={18}
                color="#000"
              />
            </TouchableOpacity>
          ),
        }}
      />

      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: COLORS.bg }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          {/* Jenis Presensi (editable) */}
          <Field label="Jenis Presensi">
            <TextInput
              value={jenis}
              onChangeText={setJenis}
              placeholder="cth: Kegiatan Harian / Mengajar / Rapat"
              style={styles.input}
              placeholderTextColor={COLORS.sub}
            />
          </Field>

          {/* Nama (otomatis) */}
          <Field label="Nama (otomatis)">
            <TextInput
              value={displayName}
              editable={false}
              style={[styles.input, { color: "#64748b" }]}
            />
          </Field>

          {/* Unit (otomatis) */}
          <Field label="Unit (otomatis)">
            <TextInput
              value={
                unitLabel
                  ? `${unitLabel}${unitId ? ` (ID: ${unitId})` : ""}`
                  : unitId
                  ? `ID: ${unitId}`
                  : "-"
              }
              editable={false}
              style={[styles.input, { color: "#64748b" }]}
            />
          </Field>

          {/* Tanggal */}
          <Field label="Tanggal">
            <TextInput
              value={tanggal}
              onChangeText={setTanggal}
              placeholder="YYYY-MM-DD"
              style={styles.input}
              placeholderTextColor={COLORS.sub}
            />
          </Field>

          {/* Waktu */}
          <Field label="Waktu">
            <TextInput
              value={waktu}
              onChangeText={setWaktu}
              placeholder="HH:MM"
              style={styles.input}
              placeholderTextColor={COLORS.sub}
            />
          </Field>

          {/* Jarak (opsional) */}
          <Field label="Jarak (opsional)">
            <TextInput
              value={jarak}
              onChangeText={setJarak}
              placeholder="Jarak ke lokasi (km)"
              keyboardType="decimal-pad"
              style={styles.input}
              placeholderTextColor={COLORS.sub}
            />
          </Field>

          <TouchableOpacity
            style={[styles.button, (!canSubmit || submitting) && { opacity: 0.6 }]}
            activeOpacity={0.85}
            onPress={onSubmit}
            disabled={!canSubmit || submitting}
          >
            <Text style={styles.buttonText}>
              {submitting ? "Menyimpan..." : "Submit"}
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.pill}>{children}</View>
    </View>
  );
}

const styles = StyleSheet.create({
  container: { padding: 16, gap: 14 },

  backCircle: {
    marginLeft: 12,
    width: 34,
    height: 34,
    borderRadius: 17,
    backgroundColor: "#e7f1f3",
    alignItems: "center",
    justifyContent: "center",
  },

  fieldWrap: { gap: 8 },
  fieldLabel: { fontSize: 12, color: COLORS.sub, fontWeight: "600", marginLeft: 6 },
  pill: {
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: { fontSize: 16, color: COLORS.text },
  button: {
    marginTop: 8,
    backgroundColor: COLORS.brand,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
