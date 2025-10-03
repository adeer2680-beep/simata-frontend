// app/index.tsx
import React, { useEffect, useState } from "react";
import { View, Text, ActivityIndicator, StyleSheet, Platform } from "react-native";
import AsyncStorage from "@react-native-async-storage/async-storage";
import { router } from "expo-router";

const COLORS = {
  brand: "#42909b",
  text: "#0f172a",
  sub: "#475569",
  bg: "#ffffff",
};

export default function Index() {
  const [checking, setChecking] = useState(true);

  useEffect(() => {
    let cancelled = false;

    (async () => {
      try {
        // Cek token (utamakan auth.token, fallback token)
        const t1 = await AsyncStorage.getItem("auth.token");
        const t2 = t1 || (await AsyncStorage.getItem("token"));

        if (!t2) {
          // Belum login → ke halaman login
          if (!cancelled) router.replace("/login");
          return;
        }

        // Sudah login → langsung ke tabs/dashboard
        if (!cancelled) router.replace("/tabs/dashboard");
      } catch {
        // Kalau ada error baca storage, arahkan ke login saja
        if (!cancelled) router.replace("/login");
      } finally {
        if (!cancelled) setChecking(false);
      }
    })();

    return () => {
      cancelled = true;
    };
  }, []);

  // Sambil redirect, tampilkan indikator sederhana
  if (checking) {
    return (
      <View style={styles.center}>
        <ActivityIndicator />
        <Text style={styles.hint}>Mengecek sesi login…</Text>
      </View>
    );
  }

  // Tidak akan sempat ter-render (karena replace), tapi return View kosong agar komponen valid.
  return <View style={{ flex: 1, backgroundColor: COLORS.bg }} />;
}

const styles = StyleSheet.create({
  center: {
    flex: 1,
    backgroundColor: COLORS.bg,
    alignItems: "center",
    justifyContent: "center",
    paddingBottom: Platform.select({ ios: 24, android: 0, default: 0 }),
  },
  hint: { marginTop: 8, color: COLORS.sub, fontSize: 13, fontWeight: "600" },
});
