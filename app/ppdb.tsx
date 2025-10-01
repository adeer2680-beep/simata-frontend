// app/ppdb.tsx
import React, { useEffect, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ActivityIndicator,
  Platform,
  Linking,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router } from "expo-router";
import { WebView } from "react-native-webview";

const PPDB_URL = "https://ppdb.sitpermata.id/";

// Palette diseragamkan dengan brand teal mockup
const C = {
  bg: "#ffffff",
  text: "#0f172a",
  sub: "#475569",
  border: "#e5e7eb",
  brand: "#42909b", // ⬅️ teal seperti mockup
} as const;

export default function PPDBScreen() {
  const [loading, setLoading] = useState(true);
  const [err, setErr] = useState<string | null>(null);
  const webref = useRef<WebView>(null);

  // Web: banyak situs blok iframe (X-Frame-Options/CSP). Buka tab baru dan tampilkan fallback.
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

  const Header = (
    <View style={s.header}>
      <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85} style={s.backBtn}>
        <Ionicons name="chevron-back" size={22} color="#fff" />
      </TouchableOpacity>
      <Text style={s.title}>PPDB</Text>
      {/* spacer kanan supaya title tetap center */}
      <View style={{ width: 38 }} />
    </View>
  );

  return (
    <SafeAreaView style={s.container}>
      {Header}

      <View style={{ flex: 1 }}>
        {Platform.OS === "web" ? (
          // Fallback web (iframe diblokir)
          <View style={s.centerBox}>
            <Text style={s.webInfoText}>
              Situs PPDB tidak mengizinkan ditampilkan di dalam aplikasi (iframe).
            </Text>
            <TouchableOpacity onPress={openExternal} activeOpacity={0.92} style={s.btnPrimary}>
              <Text style={s.btnPrimaryText}>Buka PPDB di Tab Baru</Text>
            </TouchableOpacity>
          </View>
        ) : (
          <>
            <WebView
              ref={webref}
              source={{ uri: PPDB_URL }}
              onLoadStart={() => {
                setLoading(true);
                setErr(null);
              }}
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
                <Text style={{ color: "#ef4444", marginBottom: 8, textAlign: "center" }}>{err}</Text>
                <View style={{ flexDirection: "row", gap: 10, justifyContent: "center" }}>
                  <TouchableOpacity
                    onPress={() => webref.current?.reload()}
                    activeOpacity={0.92}
                    style={s.btnPrimary}
                  >
                    <Text style={s.btnPrimaryText}>Muat Ulang</Text>
                  </TouchableOpacity>
                  <TouchableOpacity onPress={openExternal} activeOpacity={0.92} style={s.btnGhost}>
                    <Text style={s.btnGhostText}>Buka di Browser</Text>
                  </TouchableOpacity>
                </View>
              </View>
            )}
          </>
        )}
      </View>
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  container: { flex: 1, backgroundColor: C.bg },

  // HEADER: teal + back button bulat transparan + title putih center
  header: {
    backgroundColor: C.brand,
    paddingHorizontal: 12,
    paddingBottom: 12,
    paddingTop: 12,
    flexDirection: "row",
    alignItems: "center",
    gap: 8,
    borderBottomWidth: 0,
  },
  backBtn: {
    width: 38,
    height: 38,
    borderRadius: 12,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.18)",
  },
  title: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // LOADING overlay
  overlay: {
    ...StyleSheet.absoluteFillObject,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(255,255,255,0.6)",
  },

  // ERROR / INFO
  errorBox: {
    position: "absolute",
    left: 16,
    right: 16,
    bottom: 20,
    backgroundColor: "#fff",
    borderWidth: 1,
    borderColor: C.border,
    borderRadius: 12,
    padding: 12,
  },
  centerBox: { flex: 1, alignItems: "center", justifyContent: "center", padding: 16, gap: 12 },
  webInfoText: { color: C.sub, textAlign: "center" },

  // BUTTONS
  btnPrimary: {
    backgroundColor: C.brand,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    alignItems: "center",
  },
  btnPrimaryText: { color: "#fff", fontWeight: "800", letterSpacing: 0.2 },
  btnGhost: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 10,
    borderWidth: 1,
    borderColor: C.brand,
    alignItems: "center",
  },
  btnGhostText: { color: C.brand, fontWeight: "800", letterSpacing: 0.2 },
});
