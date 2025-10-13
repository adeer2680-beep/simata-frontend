// app/presensi-pulang.tsx
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
import { Stack } from "expo-router";
import AsyncStorage from "@react-native-async-storage/async-storage";

const COLORS = {
  bg: "#ffffff",
  text: "#0f172a",
  sub: "#475569",
  brand: "#0ea5a3",
  border: "#e5e7eb",
};

const API_BASE =
  Platform.OS === "android"
    ? "http://192.168.1.123:8000/api" // ← GANTI ke IP LAN PC yang menjalankan Laravel
    : "http://localhost:8000/api";

const fmtDate = (d = new Date()) =>
  `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, "0")}-${String(
    d.getDate()
  ).padStart(2, "0")}`;

const fmtTime = (d = new Date()) =>
  `${String(d.getHours()).padStart(2, "0")}:${String(d.getMinutes()).padStart(
    2,
    "0"
  )}`;

type Unit = { id: number; nama: string };

export default function PresensiPulang() {
  // FE fields
  const [jenis, setJenis] = useState("Kegiatan Harian"); // bebas ubah default
  const [unitId, setUnitId] = useState<number | null>(null);
  const [tanggal, setTanggal] = useState(fmtDate());
  const [waktu, setWaktu] = useState(fmtTime());
  const [jarak, setJarak] = useState("");

  // meta
  const [units, setUnits] = useState<Unit[]>([]);
  const [loadingUnits, setLoadingUnits] = useState(true);
  const [submitting, setSubmitting] = useState(false);

  // segarkan waktu tiap 30 detik
  useEffect(() => {
    const id = setInterval(() => setWaktu(fmtTime()), 30_000);
    return () => clearInterval(id);
  }, []);

  // fetch units untuk dropdown
  useEffect(() => {
    (async () => {
      try {
        const token = await AsyncStorage.getItem("access_token");
        const res = await fetch(`${API_BASE}/units`, {
          headers: {
            Accept: "application/json",
            Authorization: token ? `Bearer ${token}` : "",
          },
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data?.message || "Gagal mengambil unit");
        setUnits(data);
        if (data?.length && unitId === null) setUnitId(data[0].id);
      } catch (e: any) {
        Alert.alert("Gagal", e?.message ?? "Gagal memuat daftar unit");
      } finally {
        setLoadingUnits(false);
      }
    })();
  }, []);

  const canSubmit = useMemo(
    () => jenis && unitId && tanggal && waktu,
    [jenis, unitId, tanggal, waktu]
  );

  const onSubmit = async () => {
    if (!canSubmit) {
      Alert.alert("Lengkapi Data", "Harap isi Jenis, Unit, Tanggal, dan Waktu.");
      return;
    }
    try {
      setSubmitting(true);

      const token = await AsyncStorage.getItem("access_token");
      if (!token) {
        Alert.alert("Auth", "Silakan login ulang. Token tidak ditemukan.");
        return;
      }

      // Timeout pakai AbortController
      const controller = new AbortController();
      const t = setTimeout(() => controller.abort(), 15000);

      const payload = {
        unit_id: unitId,
        jenis_presensi: jenis,
        tanggal,
        waktu,
        jarak: jarak ? Number(jarak) : null,
        status: "pulang", // ⟵ PERBEDAAN UTAMA (dibanding screen “datang”)
      };

      const res = await fetch(`${API_BASE}/presensi`, {
        method: "POST",
        headers: {
          Accept: "application/json",
          "Content-Type": "application/json",
          Authorization: `Bearer ${token}`,
        },
        body: JSON.stringify(payload),
        signal: controller.signal,
      });

      clearTimeout(t);
      const data = await res.json();

      if (!res.ok) {
        const msg =
          typeof data?.message === "string"
            ? data.message
            : data?.errors
            ? Object.values(data.errors).flat().join("\n")
            : "Gagal menyimpan presensi";
        throw new Error(msg);
      }

      Alert.alert("Berhasil", "Presensi pulang tercatat.");
    } catch (e: any) {
      if (e?.name === "AbortError") {
        Alert.alert("Timeout", "Server tidak merespons. Coba lagi.");
      } else {
        Alert.alert("Gagal", e?.message ?? "Network request failed");
      }
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      <Stack.Screen options={{ title: "Presensi Pulang" }} />
      <KeyboardAvoidingView
        behavior={Platform.OS === "ios" ? "padding" : undefined}
        style={{ flex: 1, backgroundColor: COLORS.bg }}
      >
        <ScrollView contentContainerStyle={styles.container}>
          <Field label="Jenis Presensi">
            <TextInput
              value={jenis}
              onChangeText={setJenis}
              placeholder="Jenis Presensi"
              style={styles.input}
              placeholderTextColor={COLORS.sub}
            />
          </Field>

          <Field label="Unit">
            {loadingUnits ? (
              <View style={{ paddingVertical: 8 }}>
                <ActivityIndicator />
              </View>
            ) : units.length ? (
              <View style={{ gap: 8 }}>
                {units.map((u) => (
                  <TouchableOpacity
                    key={u.id}
                    onPress={() => setUnitId(u.id)}
                    style={[
                      styles.option,
                      unitId === u.id && { borderColor: COLORS.brand, borderWidth: 2 },
                    ]}
                  >
                    <Text style={styles.input}>{u.nama}</Text>
                  </TouchableOpacity>
                ))}
              </View>
            ) : (
              <Text style={{ color: COLORS.sub }}>Tidak ada unit.</Text>
            )}
          </Field>

          <Field label="Tanggal">
            <TextInput
              value={tanggal}
              onChangeText={setTanggal}
              placeholder="YYYY-MM-DD"
              style={styles.input}
              placeholderTextColor={COLORS.sub}
            />
          </Field>

          <Field label="Waktu">
            <TextInput
              value={waktu}
              onChangeText={setWaktu}
              placeholder="HH:MM"
              style={styles.input}
              placeholderTextColor={COLORS.sub}
            />
          </Field>

          <Field label="Jarak (opsional)">
            <TextInput
              value={jarak}
              onChangeText={setJarak}
              placeholder="Jarak (km)"
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
              {submitting ? "Menyimpan..." : "Submit Presensi Pulang"}
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
  fieldWrap: { gap: 8 },
  fieldLabel: {
    fontSize: 12,
    color: COLORS.sub,
    fontWeight: "600",
    marginLeft: 6,
  },
  pill: {
    backgroundColor: "#f1f5f9",
    borderRadius: 16,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  input: { fontSize: 16, color: COLORS.text },
  option: {
    backgroundColor: "#fff",
    paddingVertical: 10,
    paddingHorizontal: 12,
    borderRadius: 12,
    borderWidth: 1,
    borderColor: COLORS.border,
  },
  button: {
    marginTop: 8,
    backgroundColor: COLORS.brand,
    borderRadius: 16,
    paddingVertical: 14,
    alignItems: "center",
  },
  buttonText: { color: "#fff", fontSize: 16, fontWeight: "700" },
});
