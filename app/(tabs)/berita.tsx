import React, { useCallback, useRef, useState } from "react";
import {
  View,
  Text,
  StyleSheet,
  ActivityIndicator,
  Pressable,
  Platform,
  BackHandler,
  Linking,
  TouchableOpacity,
  SafeAreaView,
} from "react-native";
import { Ionicons } from "@expo/vector-icons";
import { router, Stack, useFocusEffect } from "expo-router";

// URL berita
const NEWS_URL = "https://yayasansitpermata.blogspot.com/p/tentang-kami.html";

// Import WebView hanya di native (Android/iOS)
let WebViewComp: any = null;
if (Platform.OS !== "web") {
  WebViewComp = require("react-native-webview").WebView;
}

const C = {
  brand: "#42909b",
  bg: "#ffffff",
  text: "#0f172a",
  sub: "#475569",
  border: "#e5e7eb",
};

export default function BeritaScreen() {
  const webRef = useRef<any>(null);
  const [loading, setLoading] = useState(true);
  const [canGoBack, setCanGoBack] = useState(false);
  const [hasError, setHasError] = useState(false);
  const [reloadKey, setReloadKey] = useState(0);

  // Tangani tombol back Android untuk kembali di dalam WebView
  useFocusEffect(
    useCallback(() => {
      const onBack = () => {
        if (canGoBack && webRef.current) {
          webRef.current.goBack();
          return true;
        }
        return false;
      };
      const sub = BackHandler.addEventListener("hardwareBackPress", onBack);
      return () => sub.remove();
    }, [canGoBack])
  );

  const onReload = () => {
    setHasError(false);
    setReloadKey((k) => k + 1);
  };

  const openExternal = () => {
    if (Platform.OS === "web") {
      window.open(NEWS_URL, "_blank");
    } else {
      Linking.openURL(NEWS_URL);
    }
  };

  const Header = (
    <View style={s.header}>
      <TouchableOpacity onPress={() => router.back()} activeOpacity={0.85} style={s.backBtn}>
        <Ionicons name="chevron-back" size={22} color="#000" /> {/* Back hitam */}
      </TouchableOpacity>
      <Text style={s.title}>Berita</Text>
      <View style={{ width: 38 }} />
    </View>
  );

  // Fallback untuk platform Web
  if (Platform.OS === "web") {
    return (
      <SafeAreaView style={s.fill}>
        {Header}
        <View style={[s.fill, s.center, { padding: 16 }]}>
          <Text style={s.subtitle}>Buka halaman di tab baru:</Text>
          <Pressable style={s.btnPrimary} onPress={openExternal}>
            <Text style={s.btnPrimaryText}>Buka Berita</Text>
          </Pressable>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={s.fill}>
      <Stack.Screen options={{ headerShown: false }} />
      {Header}

      <WebViewComp
        key={reloadKey}
        ref={webRef}
        source={{ uri: NEWS_URL }}
        style={s.fill}
        onLoadStart={() => {
          setLoading(true);
          setHasError(false);
        }}
        onLoadEnd={() => setLoading(false)}
        onError={() => {
          setLoading(false);
          setHasError(true);
        }}
        onNavigationStateChange={(navState: any) => setCanGoBack(navState.canGoBack)}
        javaScriptEnabled
        domStorageEnabled
        allowsBackForwardNavigationGestures
        pullToRefreshEnabled
      />

      {/* Loading overlay */}
      {loading && !hasError && (
        <View style={s.loading}>
          <ActivityIndicator size="large" color={C.sub} />
          <Text style={s.loadingText}>Memuat…</Text>
        </View>
      )}

      {/* Error fallback */}
      {hasError && (
        <View style={[s.fill, s.center, { backgroundColor: "#fff", padding: 16 }]}>
          <Text style={s.errTitle}>Gagal memuat halaman</Text>
          <Text style={s.errSub}>Periksa koneksi internet kamu.</Text>

          <View style={{ height: 12 }} />

          <Pressable style={s.btnPrimary} onPress={onReload}>
            <Text style={s.btnPrimaryText}>Coba Lagi</Text>
          </Pressable>

          <View style={{ height: 8 }} />

          <Pressable style={s.btnGhost} onPress={openExternal}>
            <Text style={s.btnGhostText}>Buka di Browser</Text>
          </Pressable>
        </View>
      )}
    </SafeAreaView>
  );
}

const s = StyleSheet.create({
  fill: { flex: 1, backgroundColor: C.bg },
  center: { alignItems: "center", justifyContent: "center" },

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
  title: {
    flex: 1,
    textAlign: "center",
    color: "#fff",
    fontSize: 18,
    fontWeight: "800",
    letterSpacing: 0.3,
  },

  // Loading
  loading: {
    position: "absolute",
    left: 0,
    right: 0,
    top: 0,
    bottom: 0,
    alignItems: "center",
    justifyContent: "center",
    backgroundColor: "rgba(248,250,252,0.6)",
  },
  loadingText: {
    marginTop: 8,
    color: C.text,
    fontWeight: "600",
  },

  // Buttons
  btnPrimary: {
    backgroundColor: C.brand,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  btnPrimaryText: { color: "#000", fontWeight: "700" }, // teks hitam
  btnGhost: {
    marginTop: 8,
    backgroundColor: "transparent",
    borderWidth: 1,
    borderColor: C.brand,
    paddingHorizontal: 16,
    paddingVertical: 12,
    borderRadius: 12,
    alignItems: "center",
  },
  btnGhostText: { color: C.brand, fontWeight: "700" },

  subtitle: { color: C.sub, marginBottom: 16 },
  errTitle: { fontSize: 18, fontWeight: "800", color: C.text },
  errSub: { color: "#64748b", marginTop: 4 },
});
