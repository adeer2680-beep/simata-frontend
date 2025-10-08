import React, { useMemo } from "react";
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
} from "react-native";

// ==== Dummy Data (tanpa API) ====
type YTRow = { id?: string; nama: string; url: string; durationSec?: number | null; views?: number | null; tags?: string[] };

const DATA: YTRow[] = [
  { nama: "Intro SIMATA - Visi & Modul", url: "https://www.youtube.com/watch?v=dQw4w9WgXcQ", durationSec: 212, views: 125000, tags: ["SIMATA","intro"] },
  { nama: "Tutorial Presensi Siswa (Datang & Pulang)", url: "https://youtu.be/9bZkp7q19f0", durationSec: 458, views: 987654, tags: ["presensi","siswa"] },
  { nama: "Cara Akses Berita & Pengumuman", url: "https://www.youtube.com/watch?v=3JZ_D3ELwOQ", durationSec: 315, views: 54321, tags: ["berita","pengumuman"] },
  { nama: "PPDB Online: Alur Pendaftaran", url: "https://youtu.be/e-ORhEE9VVg", durationSec: 606, views: 210345, tags: ["PPDB","alur"] },
  { nama: "Dashboard Guru: Rekap Nilai & Absensi", url: "https://www.youtube.com/watch?v=L_jWHffIx5E", durationSec: 389, views: 75310, tags: ["dashboard","guru"] },
  { nama: "Inventaris Sekolah: Tambah & Audit", url: "https://youtu.be/kXYiU_JCYtU", durationSec: 271, views: 29000, tags: ["inventaris","audit"] },
  { nama: "Kotak Masuk & Notifikasi Orang Tua", url: "https://www.youtube.com/watch?v=RgKAFK5djSk", durationSec: 244, views: 112000, tags: ["notifikasi","orangtua"] },
  { nama: "Kalender Pendidikan & Event", url: "https://youtu.be/fJ9rUzIMcZQ", durationSec: 501, views: 660000, tags: ["kalender","event"] },
  { nama: "Profil Pengguna & Keamanan Akun", url: "https://www.youtube.com/watch?v=opbmQJ2nO7c", durationSec: 298, views: 43210, tags: ["profil","keamanan"] },
  { nama: "Best Practices SIMATA Harian", url: "https://youtu.be/2Vv-BfVoq4g", durationSec: 420, views: 77777, tags: ["bestpractice","harian"] },
];

// ==== Utils: parse ID & thumbnail YouTube (tanpa API) ====
type Thumbnail = { url: string; width: number; height: number };
type YTVideo = {
  id: string;
  title: string;
  url: string;
  durationSec: number | null;
  durationLabel: string | null;
  views: number | null;
  thumbnail: Thumbnail;
  tags: string[];
};

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

function makeThumbnail(id: string, quality: "maxres" | "sd" | "hq" | "mq" | "default" = "hq"): Thumbnail {
  const url = `https://img.youtube.com/vi/${id}/${quality}default.jpg`;
  const sizes: Record<string, { w: number; h: number }> = {
    maxres: { w: 1280, h: 720 },
    sd: { w: 640, h: 480 },
    hq: { w: 480, h: 360 },
    mq: { w: 320, h: 180 },
    default: { w: 120, h: 90 },
  };
  const s = sizes[quality];
  return { url, width: s.w, height: s.h };
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

function normalizeRow(row: YTRow): YTVideo {
  const id = row.id || parseYoutubeId(row.url) || "";
  const thumb = id ? makeThumbnail(id, "hq") : { url: "https://via.placeholder.com/1", width: 1, height: 1 };
  return {
    id,
    title: row.nama,
    url: row.url,
    durationSec: row.durationSec ?? null,
    durationLabel: formatDuration(row.durationSec ?? null),
    views: row.views ?? null,
    thumbnail: thumb,
    tags: row.tags ?? [],
  };
}

// ==== UI: Card List dalam ScrollView ====

const { width } = Dimensions.get("window");
const CARD_IMAGE_W = width - 32; // padding horizontal 16+16
const CARD_IMAGE_H = Math.round(CARD_IMAGE_W * (9 / 16)); // rasio 16:9

export default function YouTubeListScreen() {
  const videos = useMemo(() => DATA.map(normalizeRow), []);

  return (
    <ScrollView contentContainerStyle={styles.container}>
      <Text style={styles.header}>Video Tutorial SIMATA</Text>

      {videos.map((v) => (
        <Pressable key={v.id} style={styles.card} onPress={() => Linking.openURL(v.url)}>
          <View style={styles.thumbWrap}>
            <Image
              source={{ uri: v.thumbnail.url }}
              style={styles.thumb}
              resizeMode="cover"
            />
            {/* Badge Durasi */}
            {v.durationLabel ? (
              <View style={styles.badge}>
                <Text style={styles.badgeText}>{v.durationLabel}</Text>
              </View>
            ) : null}
          </View>

          <View style={styles.meta}>
            <Text numberOfLines={2} style={styles.title}>
              {v.title}
            </Text>
            <Text style={styles.sub}>
              {formatViews(v.views)} views
              {v.tags.length ? ` • ${v.tags.slice(0, 2).join(" · ")}` : ""}
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
  header: {
    fontSize: 20,
    fontWeight: "800",
    color: "#0f172a",
    marginBottom: 12,
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
  },
  thumb: {
    width: "100%",
    height: "100%",
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
