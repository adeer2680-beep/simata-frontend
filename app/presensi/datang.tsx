// app/presensi/datang.tsx
import AsyncStorage from "@react-native-async-storage/async-storage";
import { Stack, useLocalSearchParams } from "expo-router";
import React, { useEffect, useMemo, useState } from "react";
import {
  ActivityIndicator,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  TouchableOpacity,
  View,
} from "react-native";

/* ========= UI ========= */
const COLORS = {
  bg: "#ffffff",
  text: "#0f172a",
  sub: "#475569",
  brand: "#0ea5a3",
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

/* ========= KONFIG API =========
 * - ANDROID EMULATOR => 10.0.2.2
 * - DEVICE FISIK / iOS SIMULATOR => pakai IP LAN laptop kamu
 */
const LAN_IP = "192.168.43.182"; // ganti sesuai IP LAN kamu
const USE_ANDROID_EMULATOR = true;

const HOST =
  Platform.OS === "android"
    ? USE_ANDROID_EMULATOR
      ? "10.0.2.2"
      : LAN_IP
    : LAN_IP;

const API_BASE = `http://localhost:8000/api`;
const PRESENSI_URL = `${API_BASE}/presensi`;

/* ========= TIPE DATA ========= */
type AuthUser = {
  id?: number | string;
  username?: string;
  role?: string;
  unit_id?: number | string;
  nama?: string; // diset di login.tsx (displayName)
  unit?: string; // diset di login.tsx (unitLabel)
};

export default function PresensiDatang() {
  const { jenis: jenisParam } = useLocalSearchParams<{ jenis?: string }>();

  // form
  const [jenis, setJenis] = useState(jenisParam ?? "");
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

  // debug
  const [lastReq, setLastReq] = useState<any>(null);
  const [lastRes, setLastRes] = useState<{
    url?: string;
    status?: number;
    headers?: Record<string, string>;
    bodyText?: string;
    bodyJson?: any;
    when?: string;
  } | null>(null);

  // segarkan waktu per 30 detik
  useEffect(() => {
    const id = setInterval(() => setWaktu(fmtTime()), 30_000);
    return () => clearInterval(id);
  }, []);

  // baca sesi yang diset di login.tsx (auth.token, auth.tokenType, auth.user, auth.beranda)
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

        // beranda hanya label gabungan, bukan logic
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
      const payload: Record<string, any> = {
        unit_id: unitId,
        jenis_presensi: jenis,
        tanggal,
        waktu,
      };
      if (jarak.trim().length > 0 && !isNaN(Number(jarak))) {
        payload.jarak = Number(jarak);
      }

      setLastReq({
        url: PRESENSI_URL,
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${token}`,
        },
        body: payload,
        when: new Date().toISOString(),
      });

      const res = await fetch(PRESENSI_URL, {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Accept: "application/json",
          Authorization: `${tokenType || "Bearer"} ${token}`,
        },
        body: JSON.stringify(payload),
      });

      const headersObj: Record<string, string> = {};
      res.headers.forEach((v, k) => (headersObj[k] = v));

      const rawText = await res.text();
      let json: any = null;
      try {
        json = JSON.parse(rawText);
      } catch {
        json = null;
      }

      setLastRes({
        url: PRESENSI_URL,
        status: res.status,
        headers: headersObj,
        bodyText: rawText,
        bodyJson: json,
        when: new Date().toISOString(),
      });

      console.log("🛰️ RES:", res.status, headersObj, json ?? rawText);

      if (res.status === 201) {
        const msg =
          json?.message ??
          `Presensi berhasil disimpan${
            json?.data?.status ? ` (${json.data.status})` : ""
          }.`;
        Alert.alert("Sukses", msg);
        setJarak("");
        setJenis(jenisParam ?? "");
        return;
      }

      if (res.status === 401) {
        Alert.alert(
          "401 Unauthorized",
          json?.message ??
            "Sesi tidak valid/kedaluwarsa. Pastikan Authorization header benar (Bearer token)."
        );
        return;
      }

      if (res.status === 422) {
        const firstErr =
          json?.message ??
          (json?.errors &&
            json.errors[Object.keys(json.errors || {})[0]]?.[0]) ??
          "Validasi gagal (422).";
        Alert.alert("422 Unprocessable Entity", firstErr);
        return;
      }

      if (res.status === 404) {
        Alert.alert(
          "404 Not Found",
          "Endpoint tidak ditemukan. Cek route: POST /api/presensi dan base URL/IP."
        );
        return;
      }

      if (res.status >= 500) {
        Alert.alert(
          `Server Error ${res.status}`,
          json?.message ??
            "Terjadi error di server. Cek storage/logs/laravel.log."
        );
        return;
      }

      Alert.alert(
        `Error ${res.status}`,
        typeof json === "object" && json !== null
          ? JSON.stringify(json, null, 2)
          : rawText || "Respon tidak diketahui."
      );
    } catch (e: any) {
      console.log("❌ SUBMIT error:", e?.message ?? e);
      setLastRes({
        status: 0,
        headers: {},
        bodyText: String(e?.message ?? e),
        when: new Date().toISOString(),
      });
      Alert.alert(
        "Network Error",
        (e?.message ?? "Gagal terhubung ke server.") +
          "\nCek IP/PORT, hotspot, atau izin HTTP cleartext (Android)."
      );
    } finally {
      setSubmitting(false);
    }
  };

  if (loading) {
    return (
      <>
        <Stack.Screen options={{ title: "Presensi Datang" }} />
        <View style={{ flex: 1, alignItems: "center", justifyContent: "center" }}>
          <ActivityIndicator size="large" />
          <Text style={{ marginTop: 8, color: COLORS.sub }}>Memuat sesi…</Text>
        </View>
      </>
    );
  }

  return (
    <>
      <Stack.Screen options={{ title: "Presensi Datang" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: COLORS.bg }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          {/* Jenis Presensi (editable) */}
          <Field label="datang">
            <TextInput
              value={jenis}
              onChangeText={setJenis}
              placeholder="cth: Apel Pagi / Rapat / Mengajar"
              style={styles.input}
              placeholderTextColor={COLORS.sub}
            />
          </Field>

          {/* Nama (otomatis dari sesi, read-only) */}
          <Field label="Nama (otomatis)">
            <TextInput
              value={displayName}
              editable={false}
              style={[styles.input, { color: "#64748b" }]}
            />
          </Field>

          {/* Unit (otomatis dari sesi, read-only) */}
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

          {/* Debug Panel */}
          <DebugPanel req={lastReq} res={lastRes} />

          {!token && (
            <Text style={{ color: COLORS.danger, marginTop: 8 }}>
              Token tidak ditemukan. Silakan login ulang.
            </Text>
          )}
          {unitId == null && (
            <Text style={{ color: COLORS.danger, marginTop: 4 }}>
              Unit ID tidak ada di sesi. Pastikan backend mengirim unit_id saat login.
            </Text>
          )}
        </ScrollView>
      </KeyboardAvoidingView>
    </>
  );
}

/* ========= KOMPONEN KECIL ========= */
function Field({ label, children }: { label: string; children: React.ReactNode }) {
  return (
    <View style={styles.fieldWrap}>
      <Text style={styles.fieldLabel}>{label}</Text>
      <View style={styles.pill}>{children}</View>
    </View>
  );
}

function DebugPanel({
  req,
  res,
}: {
  req: any;
  res: {
    url?: string;
    status?: number;
    headers?: Record<string, string>;
    bodyText?: string;
    bodyJson?: any;
    when?: string;
  } | null;
}) {
  return (
    <View style={{ marginTop: 16, padding: 12, borderWidth: 1, borderColor: "#e5e7eb", borderRadius: 12 }}>
      <Text style={{ fontWeight: "700", marginBottom: 6 }}>🔎 Debug Panel</Text>
      {req ? (
        <>
          <Text style={{ fontWeight: "600" }}>Last Request:</Text>
          <Text selectable style={{ fontSize: 12 }}>
            {JSON.stringify(req, null, 2)}
          </Text>
        </>
      ) : (
        <Text style={{ fontSize: 12, color: "#64748b" }}>Belum ada request.</Text>
      )}
      <View style={{ height: 8 }} />
      {res ? (
        <>
          <Text style={{ fontWeight: "600" }}>Last Response:</Text>
          <Text selectable style={{ fontSize: 12 }}>
            {JSON.stringify(
              {
                url: res.url,
                status: res.status,
                headers: res.headers,
                when: res.when,
                body: res.bodyJson ?? res.bodyText,
              },
              null,
              2
            )}
          </Text>
        </>
      ) : (
        <Text style={{ fontSize: 12, color: "#64748b" }}>
          Belum ada response.
        </Text>
      )}
    </View>
  );
}

/* ========= STYLES ========= */
const styles = StyleSheet.create({
  container: { padding: 16, gap: 14 },
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

