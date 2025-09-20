// app/inventaris.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity,
  ActivityIndicator, Platform, Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { WebView } from "react-native-webview";

// ─── GANTI INI KALAU LINKNYA SUDAH ADA ────────────────────────────────────────
const INVENTARIS_URL = ""; // contoh: "https://inventaris.sitpermata.id/"
// ──────────────────────────────────────────────────────────────────────────────

const C = { bg:"#fff", text:"#0f172a", sub:"#475569", border:"#e5e7eb", brand:"#0ea5a3" };

export default function InventarisScreen() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const webref = useRef<any>(null);

  // Kalau di web & URL tersedia: buka tab baru (beberapa situs block iframe)
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
    // Belum ada link → placeholder
    if (!INVENTARIS_URL) {
      return (
        <View style={s.centerBox}>
          <Ionicons name="cube-outline" size={40} color={C.brand} />
          <Text style={s.centerTitle}>Fitur Inventaris</Text>
          <Text style={s.centerSub}>Fitur inventaris akan segera hadir.</Text>
          <TouchableOpacity disabled style={[s.btn, { opacity: 0.5 }]}>
            <Text style={s.btnText}>Buka Inventaris</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Ada link → Web/native
    if (Platform.OS === "web") {
      // Di web kita sudah membuka tab baru via useEffect; tampilkan tombol ulang
      return (
        <View style={s.centerBox}>
          <Text style={{ color: C.sub, textAlign: "center", marginBottom: 10 }}>
            Inventaris dibuka di tab baru.
          </Text>
          <TouchableOpacity onPress={openExternal} style={s.btn}>
            <Text style={s.btnText}>Buka Lagi</Text>
          </TouchableOpacity>
        </View>
      );
    }

    // Native (Android/iOS) → WebView
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
              <TouchableOpacity onPress={() => webref.current?.reload()} style={[s.btn, { backgroundColor: C.brand }]}>
                <Text style={s.btnText}>Muat Ulang</Text>
              </TouchableOpacity>
              <TouchableOpacity onPress={openExternal} style={s.btnGhost}>
                <Text style={{ color: C.brand, fontWeight: "700" }}>Buka di Browser</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}
      </>
    );
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={s.title}>Inventaris</Text>
        <View style={{ width: 22 }} />
      </View>

      <View style={{ flex: 1 }}>{renderContent()}</View>
    </View>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },
  header: {
    flexDirection: "row", alignItems: "center",
    paddingHorizontal: 16, paddingVertical: 12,
    borderBottomWidth: 1, borderBottomColor: C.border,
  },
  title: { fontSize: 16, fontWeight: "700", color: C.text },

  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16, gap: 10 },
  centerTitle: { fontSize: 16, fontWeight: "700", color: C.text, marginTop: 6 },
  centerSub: { color: C.sub, textAlign: "center", marginBottom: 6 },

  btn: { backgroundColor: C.brand, paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10 },
  btnText: { color: "#fff", fontWeight: "700" },
  btnGhost: { paddingHorizontal: 14, paddingVertical: 10, borderRadius: 10, borderWidth: 1, borderColor: C.brand },

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
