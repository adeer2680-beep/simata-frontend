import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform, Linking, SafeAreaView
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack } from "expo-router";
import { WebView } from "react-native-webview";

// ─── GANTI INI KALAU LINKNYA SUDAH ADA ───────────────────────────
const INVENTARIS_URL = ""; // contoh: "https://inventaris.sitpermata.id/"
// ────────────────────────────────────────────────────────────────

const C = {
  brand: "#42909b",
  bg: "#fff",
  text: "#0f172a",
  sub: "#475569",
  border: "#e5e7eb",
};

export default function InventarisScreen() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const webref = useRef<any>(null);

  // Kalau di web & URL tersedia: buka tab baru
  useEffect(() => {
    if (Platform.OS === "web" && INVENTARIS_URL) {
      try { window.open(INVENTARIS_URL, "_blank", "noopener,noreferrer"); } catch {}
      setLoading(false);
      setErr("Inventaris dibuka di tab baru.");
    }
  }, []);

  const openExternal = () => {
    if (!INVENTARIS_URL) return;
    if (Platform.OS === "web") window.open(INVENTARIS_URL, "_blank", "noopener,noreferrer");
    else Linking.openURL(INVENTARIS_URL);
  };

  const renderContent = () => {
    if (!INVENTARIS_URL) {
      return (
        <View style={s.centerBox}>
          <Ionicons name="cube-outline" size={40} color={C.brand} />
          <Text style={s.centerTitle}>Fitur Inventaris</Text>
          <Text style={s.centerSub}>Fitur inventaris akan segera hadir.</Text>
          <TouchableOpacity disabled style={[s.btnPrimary, { opacity: 0.5 }]}>
            <Text style={s.btnPrimaryText}>Buka Inventaris</Text>
          </TouchableOpacity>
        </View>
      );
    }

    if (Platform.OS === "web") {
      return (
        <View style={s.centerBox}>
          <Text style={{ color: C.sub, textAlign: "center", marginBottom: 10 }}>
            Inventaris dibuka di tab baru.
          </Text>
          <TouchableOpacity onPress={openExternal} style={s.btnPrimary}>
            <Text style={s.btnPrimaryText}>Buka Lagi</Text>
          </TouchableOpacity>
        </View>
      );
    }

    return (
      <>
        <WebView
          ref={webref}
          source={{ uri: INVENTARIS_URL }}
          onLoadStart={() => { setLoading(true); setErr(null); }}
          onLoadEnd={() => setLoading(false)}
          onError={(e: any) => {
            setLoading(false);
            setErr(e?.nativeEvent?.description || "Gagal memuat halaman.");
          }}
          startInLoadingState
          style={{ flex: 1 }}
        />

        {loading && !err && (
          <View style={s.overlay}>
            <ActivityIndicator size="large" color={C.sub} />
            <Text style={{ marginTop: 8, color: C.sub }}>Memuat Inventaris…</Text>
          </View>
        )}

        {err && (
          <View style={s.errorBox}>
            <Text style={{ color: "red", marginBottom: 8 }}>{err}</Text>
            <View style={{ flexDirection: "row", gap: 10 }}>
              <TouchableOpacity onPress={() => webref.current?.reload()} style={s.btnPrimary}>
                <Text style={s.btnPrimaryText}>Muat Ulang</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={openExternal} style={s.btnGhost}>
                <Text style={s.btnGhostText}>Buka di Browser</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </>
    );
  };

  const Header = (
    <View style={s.header}>
      <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85} style={s.backBtn}>
        <Ionicons name="chevron-back" size={22} color="#000" />
      </TouchableOpacity>
      <Text style={s.title}>Inventaris</Text>
      <View style={{ width: 38 }} />
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      <Stack.Screen options={{ headerShown: false }} />
      {Header}
      <View style={{ flex: 1 }}>{renderContent()}</View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

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
    backgroundColor: "rgba(255,255,255,0.85)",
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // Content placeholder
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16, gap: 10 },
  centerTitle: { fontSize: 16, fontWeight: "700", color: C.text, marginTop: 6 },
  centerSub: { color: C.sub, textAlign: "center", marginBottom: 6 },

  // Buttons
  btnPrimary: {
    backgroundColor: C.brand,
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    alignItems: "center",
  },
  btnPrimaryText: { color: "#000", fontWeight: "700" },
  btnGhost: {
    paddingHorizontal: 14,
    paddingVertical: 10,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.brand,
    alignItems: "center",
  },
  btnGhostText: { color: C.brand, fontWeight: "700" },

  // Loading & Error
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center", justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
  },
  errorBox: {
    position: "absolute", left: 16, right: 16, bottom: 20,
    backgroundColor: "#fff", borderWidth: 1, borderColor: C.border,
    borderRadius: 12, padding: 12,
  },
});
