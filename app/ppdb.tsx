// app/ppdb.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View, Text, StyleSheet, TouchableOpacity, ActivityIndicator, Platform, Linking,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { WebView } from "react-native-webview";

const PPDB_URL = "https://ppdb.sitpermata.id/";

const C = { bg:"#fff", text:"#0f172a", sub:"#475569", border:"#e5e7eb", brand:"#0ea5a3" };

export default function PPDBScreen() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const webref = useRef<any>(null);

  // Web: langsung buka tab baru (karena iframe diblokir)
  useEffect(() => {
    if (Platform.OS === "web") {
      try {
        window.open(PPDB_URL, "_blank", "noopener,noreferrer");
      } catch {}
      setLoading(false);
      setErr("Situs PPDB dibuka di tab baru.");
    }
  }, []);

  const openExternal = () => {
    if (Platform.OS === "web") {
      window.open(PPDB_URL, "_blank", "noopener,noreferrer");
    } else {
      Linking.openURL(PPDB_URL);
    }
  };

  return (
    <View style={s.container}>
      {/* Header */}
      <View style={s.header}>
        <TouchableOpacity onPress={() => router.back()} style={{ marginRight: 12 }}>
          <Ionicons name="arrow-back" size={22} color={C.text} />
        </TouchableOpacity>
        <Text style={s.title}>PPDB</Text>
        <View style={{ width: 22 }} />
      </View>

      {/* Konten */}
      <View style={{ flex: 1 }}>
        {Platform.OS === "web" ? (
          // Web tidak render iframe (diblokir). Tampilkan info + tombol.
          <View style={s.centerBox}>
            <Text style={{ color: C.sub, textAlign: "center", marginBottom: 10 }}>
              Situs PPDB tidak mengizinkan ditampilkan di dalam aplikasi (iframe).
            </Text>
            <TouchableOpacity onPress={openExternal} style={s.btn}>
              <Text style={s.btnText}>Buka PPDB di Tab Baru</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <WebView
              ref={webref}
              source={{ uri: PPDB_URL }}
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
                <Text style={{ marginTop: 8, color: C.sub }}>Memuat PPDB…</Text>
              </View>
            )}

            {err && (
              <View style={s.errorBox}>
                <Text style={{ color: "red", marginBottom: 8 }}>{err}</Text>
                <View style={{ flexDirection: "row", gap: 10 }}>
                  <TouchableOpacity
                    onPress={() => webref.current?.reload()}
                    style={[s.btn, { backgroundColor: C.brand }]}
                  >
                    <Text style={s.btnText}>Muat Ulang</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={openExternal} style={s.btnGhost}>
                    <Text style={{ color: C.brand, fontWeight: "700" }}>Buka di Browser</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </View>
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

  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16 },

  btn: {
    backgroundColor: C.brand, paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, alignItems: "center",
  },
  btnText: { color: "#fff", fontWeight: "700" },
  btnGhost: {
    paddingHorizontal: 14, paddingVertical: 10,
    borderRadius: 10, borderWidth: 1, borderColor: C.brand,
    alignItems: "center",
  },
});
