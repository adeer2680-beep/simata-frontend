import React, { useState, useEffect } from "react";
import {
  View,
  Text,
  Image,
  StyleSheet,
  ScrollView,
  Pressable,
  Linking,
  Dimensions,
  Platform,
  ActivityIndicator,
  Alert,
  RefreshControl,
} from "react-native";

// ==== Config API ====
const API_BASE_URL = "http://http://10.29.82.182/aplikasi_simata/public/api";

// ==== Types ====
type YTVideo = {
  id: number;
  title: string;
  description?: string;
  youtube_url: string;
  durationSec: number | null;
  durationLabel: string | null;
  views: number | null;
  thumbnail: { url: string; width: number; height: number };
  tags: string[];
};

// ==== Utils ====
function parseYoutubeId(input: string): string | null {
  try {
    const u = new URL(input);
    if (u.hostname.includes("youtu.be")) return u.pathname.slice(1);
    const v = u.searchParams.get("v");
    if (v) return v;
    const m = u.pathname.match(/\/(embed|shorts)\/([^/?#]+)/i);
    if (m?.[2]) return m[2];
    return null;
  } catch {
    if (/^[\w-]{6,}$/.test(input)) return input;
    return null;
  }
}

function makeThumbnail(id: string, quality: "hq" | "mq" = "hq") {
  const url = `https://img.youtube.com/vi/${id}/${quality}default.jpg`;
  return { url, width: 480, height: 360 };
}

function formatDuration(sec?: number | null) {
  if (sec == null) return null;
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}

function formatViews(n?: number | null) {
  if (n == null) return "—";
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`.replace(".0", "");
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(1)}M`.replace(".0", "");
  return `${(n / 1_000_000_000).toFixed(1)}B`.replace(".0", "");
}

function normalizeVideo(data: any): YTVideo {
  const id = parseYoutubeId(data.youtube_url) || "";
  const thumb = id ? makeThumbnail(id) : { url: "", width: 480, height: 360 };

  const tags = data.tags
    ? Array.isArray(data.tags)
      ? data.tags
      : typeof data.tags === "string"
        ? data.tags.split(",").map((t: string) => t.trim())
        : []
    : [];

  return {
    id: data.id,
    title: data.title,
    description: data.description,
    youtube_url: data.youtube_url,
    durationSec: data.duration_sec || null,
    durationLabel: formatDuration(data.duration_sec || null),
    views: data.views || null,
    thumbnail: thumb,
    tags: tags,
  };
}

// ==== Component ====
const { width } = Dimensions.get("window");
const CARD_IMAGE_W = width - 32;
const CARD_IMAGE_H = Math.round(CARD_IMAGE_W * (9 / 16));

export default function YouTubeListScreen() {
  const [videos, setVideos] = useState<YTVideo[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [refreshing, setRefreshing] = useState(false);

  const fetchVideos = async () => {
    try {
      setError(null);
      
      const url = `${API_BASE_URL}/videos`;
      console.log("🔄 Fetching dari:", url);

      const response = await fetch(url, {
        method: "GET",
        headers: {
          "Accept": "application/json",
          "Content-Type": "application/json",
        },
      });

      console.log("📊 Response status:", response.status);

      if (!response.ok) {
        throw new Error(`HTTP Error: ${response.status}`);
      }

      const data = await response.json();
      console.log("✅ Data diterima:", data);

      // Handle different response formats
      let videoList = [];
      if (data.data && Array.isArray(data.data)) {
        videoList = data.data;
      } else if (Array.isArray(data)) {
        videoList = data;
      } else {
        throw new Error("Format response tidak sesuai");
      }

      const normalized = videoList.map(normalizeVideo);
      setVideos(normalized);
      console.log("✅ Videos loaded:", normalized.length);
    } catch (err) {
      const message = err instanceof Error ? err.message : "Gagal memuat video";
      setError(message);
      console.error("❌ Fetch error:", err);
    } finally {
      setLoading(false);
      setRefreshing(false);
    }
  };

  useEffect(() => {
    fetchVideos();
  }, []);

  const handleRefresh = () => {
    setRefreshing(true);
    fetchVideos();
  };

  const handleOpenVideo = (url: string) => {
    Linking.openURL(url).catch(() => {
      Alert.alert("Error", "Tidak bisa membuka URL video");
    });
  };

  if (loading) {
    return (
      <View style={styles.centerContainer}>
        <ActivityIndicator size="large" color="#0f172a" />
        <Text style={styles.loadingText}>Memuat video tutorial...</Text>
      </View>
    );
  }

  if (error) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.errorText}>Error: {error}</Text>
        <Pressable style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Coba Lagi</Text>
        </Pressable>
      </View>
    );
  }

  if (videos.length === 0) {
    return (
      <View style={styles.centerContainer}>
        <Text style={styles.emptyText}>Tidak ada video tutorial</Text>
        <Pressable style={styles.retryButton} onPress={handleRefresh}>
          <Text style={styles.retryButtonText}>Refresh</Text>
        </Pressable>
      </View>
    );
  }

  return (
    <ScrollView
      contentContainerStyle={styles.container}
      refreshControl={
        <RefreshControl
          refreshing={refreshing}
          onRefresh={handleRefresh}
          tintColor="#0f172a"
        />
      }
    >
      <Text style={styles.header}>Video Tutorial SIMATA</Text>

      {videos.map((v) => (
        <Pressable
          key={v.id}
          style={styles.card}
          onPress={() => handleOpenVideo(v.youtube_url)}
        >
          <View style={styles.thumbWrap}>
            {v.thumbnail.url ? (
              <Image
                source={{ uri: v.thumbnail.url }}
                style={styles.thumb}
                resizeMode="cover"
              />
            ) : (
              <View style={[styles.thumb, styles.thumbPlaceholder]}>
                <Text style={styles.placeholderText}>No Image</Text>
              </View>
            )}
            {v.durationLabel && (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{v.durationLabel}</Text>
              </View>
            )}
          </View>

          <View style={styles.meta}>
            <Text numberOfLines={2} style={styles.title}>
              {v.title}
            </Text>
            <Text style={styles.sub}>
              {formatViews(v.views)} views
              {v.tags.length > 0 && ` • ${v.tags.slice(0, 2).join(" · ")}`}
            </Text>
          </View>
        </Pressable>
      ))}

      <View style={{ height: 24 }} />
    </ScrollView>
  );
}

// ==== Styles ====
const styles = StyleSheet.create({
  container: {
    padding: 16,
    backgroundColor: "#f8fafc",
  },
  centerContainer: {
    flex: 1,
    justifyContent: "center",
    alignItems: "center",
    backgroundColor: "#f8fafc",
    padding: 16,
  },
  header: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 12,
  },
  loadingText: {
    marginTop: 12,
    color: "#64748b",
    fontSize: 14,
  },
  errorText: {
    color: "#e11d48",
    fontSize: 14,
    textAlign: "center",
    marginHorizontal: 16,
  },
  emptyText: {
    color: "#64748b",
    fontSize: 14,
  },
  retryButton: {
    marginTop: 12,
    paddingHorizontal: 24,
    paddingVertical: 10,
    backgroundColor: "#0f172a",
    borderRadius: 8,
  },
  retryButtonText: {
    color: "#fff",
    fontWeight: "600",
    fontSize: 14,
  },
  card: {
    backgroundColor: "#fff",
    borderRadius: 16,
    marginBottom: 14,
    overflow: "hidden",
    ...Platform.select({
      ios: {
        shadowColor: "#000",
        shadowOpacity: 0.12,
        shadowRadius: 10,
        shadowOffset: { width: 0, height: 6 },
      },
      android: {
        elevation: 3,
      },
      default: {},
    }),
  },
  thumbWrap: {
    width: CARD_IMAGE_W,
    height: CARD_IMAGE_H,
    backgroundColor: "#e2e8f0",
    position: "relative",
  },
  thumb: {
    width: "100%",
    height: "100%",
  },
  thumbPlaceholder: {
    backgroundColor: "#e2e8f0",
    justifyContent: "center",
    alignItems: "center",
  },
  placeholderText: {
    color: "#94a3b8",
    fontSize: 14,
  },
  badge: {
    position: "absolute",
    right: 8,
    bottom: 8,
    paddingHorizontal: 8,
    paddingVertical: 4,
    backgroundColor: "rgba(15,23,42,0.85)",
    borderRadius: 8,
  },
  badgeText: {
    color: "#fff",
    fontWeight: "700",
    fontSize: 12,
    letterSpacing: 0.2,
  },
  meta: {
    paddingHorizontal: 12,
    paddingVertical: 10,
    gap: 4,
  },
  title: {
    color: "#0f172a",
    fontSize: 15,
    fontWeight: "700",
    lineHeight: 20,
  },
  sub: {
    color: "#64748b",
    fontSize: 12,
    fontWeight: "600",
  },
});