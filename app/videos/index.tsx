import React, { useEffect, useMemo, useState, useCallback } from "react";
import { View, Text, StyleSheet, FlatList, Image, TouchableOpacity, RefreshControl, TextInput } from "react-native";
import { useRouter } from "expo-router";
import { Ionicons } from "@expo/vector-icons";
import { fetchChannelVideos, formatViews, YTVideo } from "../shared/api/youtube";

const COLORS = {
  bg: "#ffffff",
  brand: "#0ea5a3",
  brandSoft: "#e8fbfa",
  text: "#0f172a",
  sub: "#475569",
  card: "#f3f4f6",
  border: "#e5e7eb",
  badge: "#eff6ff",
  shadow: "#00000014",
};

const TAGS: string[] = ["Semua", "Pembelajaran", "Akhlak"]; // opsional: mapping ke tags YouTube

export default function Videos() {
  const router = useRouter();
  const [videos, setVideos] = useState<YTVideo[]>([]);
  const [nextToken, setNextToken] = useState<string | undefined>();
  const [loading, setLoading] = useState<boolean>(false);
  const [refreshing, setRefreshing] = useState<boolean>(false);
  const [q, setQ] = useState<string>("");
  const [activeTag, setActiveTag] = useState<string>("Semua");

  const load = useCallback(async (cursor?: string, replace: boolean = false) => {
    setLoading(true);
    try {
      const { items, nextPageToken } = await fetchChannelVideos(cursor);
      setVideos((prev: YTVideo[]) => (replace ? items : [...prev, ...items]));
      setNextToken(nextPageToken);
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(undefined, true);
  }, [load]);

  const onRefresh = async () => {
    setRefreshing(true);
    try {
      await load(undefined, true);
    } finally {
      setRefreshing(false);
    }
  };

  const filtered = useMemo<YTVideo[]>(() => {
    return videos.filter((v: YTVideo) => {
      const matchQ =
        q.trim().length === 0 ||
        (v.title + " " + v.description).toLowerCase().includes(q.toLowerCase());
      const matchTag =
        activeTag === "Semua" ||
        (v.tags?.some((t: string) => t.toLowerCase().includes(activeTag.toLowerCase())) ?? false);
      return matchQ && matchTag;
    });
  }, [videos, q, activeTag]);

  const renderItem = ({ item }: { item: YTVideo }) => (
    <TouchableOpacity
      style={styles.card}
      activeOpacity={0.9}
      onPress={() =>
        router.push({
          pathname: "/videos/[id]",
          params: { id: item.id },
        })
      }
    >
      <View style={styles.thumbWrap}>
        <Image source={{ uri: item.thumbnails?.url }} style={styles.thumb} />
        <View style={styles.durationBadge}>
          <Text style={styles.durationText}>{item.durationLabel}</Text>
        </View>
        <View style={styles.bookmarkBadge}>
          <Ionicons name="bookmark-outline" size={16} color="#0f172a" />
        </View>
        <View style={styles.playIcon}>
          <Ionicons name="play-circle-outline" size={42} color="#ffffff" />
        </View>
      </View>

      <View style={styles.meta}>
        <Text style={styles.title} numberOfLines={2}>{item.title}</Text>
        <Text style={styles.desc} numberOfLines={2}>{item.description}</Text>

        <View style={styles.rowMeta}>
          <View style={styles.rowMini}>
            <Ionicons name="eye-outline" size={14} color={COLORS.sub} />
            <Text style={styles.metaText}>{formatViews(item.views)} views</Text>
          </View>
          <View style={styles.rowMini}>
            <Ionicons name="calendar-outline" size={14} color={COLORS.sub} />
            <Text style={styles.metaText}>{new Date(item.publishedAt).toLocaleDateString()}</Text>
          </View>
          <TouchableOpacity style={styles.rowMini}>
            <Ionicons name="share-outline" size={14} color={COLORS.sub} />
            <Text style={styles.metaText}>Bagikan</Text>
          </TouchableOpacity>
        </View>

        {activeTag !== "Semua" ? (
          <View style={styles.badge}>
            <Text style={styles.badgeText}>{activeTag}</Text>
          </View>
        ) : null}
      </View>
    </TouchableOpacity>
  );

  return (
    <View style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <Text style={styles.headerTitle}>Permata TV Mojokerto</Text>
        <View style={styles.actions}>
          <Ionicons name="search-outline" size={20} color="#fff" />
          <Ionicons name="notifications-outline" size={20} color="#fff" style={{ marginLeft: 14 }} />
        </View>
      </View>
      <Text style={styles.sub}>Selamat datang di SIMATA</Text>

      {/* Search */}
      <View style={styles.search}>
        <Ionicons name="search-outline" size={18} color={COLORS.sub} />
        <TextInput
          value={q}
          onChangeText={(text: string) => setQ(text)}
          placeholder="Cari video..."
          placeholderTextColor={COLORS.sub}
          style={styles.input}
        />
        <Ionicons name="filter-outline" size={18} color={COLORS.sub} />
      </View>

      {/* Tabs / Chips */}
      <View style={styles.tabs}>
        {TAGS.map((t: string) => (
          <TouchableOpacity
            key={t}
            onPress={() => setActiveTag(t)}
            style={[styles.tab, activeTag === t && styles.tabActive]}
          >
            <Text style={[styles.tabText, activeTag === t && styles.tabTextActive]}>{t}</Text>
          </TouchableOpacity>
        ))}
      </View>

      {/* List */}
      <FlatList
        data={filtered}
        keyExtractor={(it: YTVideo) => it.id}
        renderItem={renderItem}
        contentContainerStyle={{ paddingHorizontal: 12, paddingBottom: 24 }}
        refreshControl={<RefreshControl refreshing={refreshing} onRefresh={onRefresh} />}
        onEndReachedThreshold={0.5}
        onEndReached={() => {
          if (!loading && nextToken) load(nextToken);
        }}
        ListHeaderComponent={<Text style={styles.sectionTitle}>Video Terbaru</Text>}
      />
    </View>
  );
}

const styles = StyleSheet.create({
  container: { flex: 1, backgroundColor: COLORS.bg },
  header: { backgroundColor: COLORS.brand, paddingTop: 14, paddingBottom: 12, paddingHorizontal: 16, flexDirection: "row", justifyContent: "space-between", alignItems: "center" },
  headerTitle: { color: "#fff", fontSize: 18, fontWeight: "800" },
  actions: { flexDirection: "row", alignItems: "center" },
  sub: { color: "#e6fffb", backgroundColor: COLORS.brand, paddingHorizontal: 16, paddingBottom: 12 },

  search: { marginTop: 12, marginHorizontal: 12, backgroundColor: "#fff", borderRadius: 12, borderWidth: 1, borderColor: COLORS.border, paddingHorizontal: 12, paddingVertical: 10, flexDirection: "row", alignItems: "center", gap: 10 },
  input: { flex: 1, color: COLORS.text },

  tabs: { flexDirection: "row", gap: 8, paddingHorizontal: 12, marginTop: 10, marginBottom: 6 },
  tab: { paddingHorizontal: 12, paddingVertical: 8, borderRadius: 999, backgroundColor: COLORS.badge, borderWidth: 1, borderColor: COLORS.border },
  tabActive: { backgroundColor: COLORS.brandSoft, borderColor: COLORS.brand },
  tabText: { color: COLORS.sub, fontWeight: "700", fontSize: 12 },
  tabTextActive: { color: COLORS.brand },

  sectionTitle: { marginTop: 8, marginBottom: 8, paddingHorizontal: 4, color: COLORS.text, fontSize: 14, fontWeight: "800" },

  card: { backgroundColor: "#fff", borderRadius: 16, overflow: "hidden", marginBottom: 12, borderWidth: 1, borderColor: COLORS.border, shadowColor: COLORS.shadow, shadowOpacity: 0.2, shadowRadius: 8, elevation: 1 },
  thumbWrap: { position: "relative", backgroundColor: COLORS.brand },
  thumb: { width: "100%", height: 180, resizeMode: "cover" },
  durationBadge: { position: "absolute", right: 8, bottom: 8, backgroundColor: "#00000088", paddingHorizontal: 6, paddingVertical: 2, borderRadius: 6 },
  durationText: { color: "#fff", fontSize: 12, fontWeight: "800" },
  bookmarkBadge: { position: "absolute", right: 8, top: 8, backgroundColor: "#ffffffcc", borderRadius: 8, padding: 6 },
  playIcon: { position: "absolute", left: 12, top: 12 },

  meta: { padding: 12 },
  title: { color: COLORS.text, fontWeight: "800", fontSize: 16, marginBottom: 4 },
  desc: { color: COLORS.sub, fontSize: 12, lineHeight: 16, marginBottom: 10 },
  rowMeta: { flexDirection: "row", alignItems: "center", gap: 14, marginBottom: 6, flexWrap: "wrap" },
  rowMini: { flexDirection: "row", alignItems: "center", gap: 6 },
  metaText: { color: COLORS.sub, fontSize: 12 },
  badge: { alignSelf: "flex-start", backgroundColor: COLORS.badge, paddingHorizontal: 8, paddingVertical: 4, borderRadius: 999, borderColor: COLORS.border, borderWidth: 1 },
  badgeText: { color: COLORS.sub, fontSize: 11, fontWeight: "700" },
});
