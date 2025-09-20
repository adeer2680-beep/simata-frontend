import axios from "axios";
import Constants from "expo-constants";

const API_KEY = Constants.expoConfig?.extra?.YT_API_KEY as string;
const CHANNEL_ID = Constants.expoConfig?.extra?.YT_CHANNEL_ID as string;
const BASE = "https://www.googleapis.com/youtube/v3";

export type YTVideo = {
  id: string;
  title: string;
  description: string;
  publishedAt: string;
  durationSec: number;
  durationLabel: string;
  thumbnails: { url: string; width: number; height: number };
  views: number | null;
  tags?: string[];
};

function parseISODurationToSec(iso: string) {
  // contoh: PT1H2M3S / PT15M32S / PT22M
  const m = iso.match(/PT(?:(\d+)H)?(?:(\d+)M)?(?:(\d+)S)?/);
  if (!m) return 0;
  const h = Number(m[1] || 0);
  const mi = Number(m[2] || 0);
  const s = Number(m[3] || 0);
  return h * 3600 + mi * 60 + s;
}
function formatDuration(sec: number) {
  const h = Math.floor(sec / 3600);
  const m = Math.floor((sec % 3600) / 60);
  const s = sec % 60;
  if (h) return `${h}:${String(m).padStart(2, "0")}:${String(s).padStart(2, "0")}`;
  return `${m}:${String(s).padStart(2, "0")}`;
}
export function formatViews(n?: number | null) {
  if (n == null) return "—";
  if (n < 1000) return `${n}`;
  if (n < 1_000_000) return `${(n / 1000).toFixed(1)}k`.replace(".0", "");
  if (n < 1_000_000_000) return `${(n / 1_000_000).toFixed(1)}M`.replace(".0", "");
  return `${(n / 1_000_000_000).toFixed(1)}B`.replace(".0", "");
}

async function getUploadsPlaylistId(channelId: string) {
  const { data } = await axios.get(`${BASE}/channels`, {
    params: { part: "contentDetails", id: channelId, key: API_KEY },
  });
  const uploads = data?.items?.[0]?.contentDetails?.relatedPlaylists?.uploads;
  if (!uploads) throw new Error("Uploads playlist tidak ditemukan.");
  return uploads as string;
}

export type Page<T> = { items: T[]; nextPageToken?: string };

export async function fetchChannelVideos(pageToken?: string): Promise<Page<YTVideo>> {
  const uploadsId = await getUploadsPlaylistId(CHANNEL_ID);

  // 1) Ambil daftar video (id + snippet dasar)
  const { data: list } = await axios.get(`${BASE}/playlistItems`, {
    params: {
      part: "snippet,contentDetails",
      maxResults: 10,
      playlistId: uploadsId,
      key: API_KEY,
      pageToken,
    },
  });

  const ids: string[] = list.items.map((it: any) => it.contentDetails.videoId).filter(Boolean);
  if (ids.length === 0) return { items: [], nextPageToken: list.nextPageToken };

  // 2) Ambil detail (duration + statistics)
  const { data: vids } = await axios.get(`${BASE}/videos`, {
    params: {
      part: "snippet,contentDetails,statistics",
      id: ids.join(","),
      key: API_KEY,
    },
  });

  const items: YTVideo[] = vids.items.map((v: any) => {
    const durationSec = parseISODurationToSec(v.contentDetails?.duration || "PT0S");
    return {
      id: v.id,
      title: v.snippet?.title || "",
      description: v.snippet?.description || "",
      publishedAt: v.snippet?.publishedAt || "",
      durationSec,
      durationLabel: formatDuration(durationSec),
      thumbnails: v.snippet?.thumbnails?.medium || v.snippet?.thumbnails?.high || v.snippet?.thumbnails?.default,
      views: v.statistics?.viewCount ? Number(v.statistics.viewCount) : null,
      tags: v.snippet?.tags || [],
    } as YTVideo;
  });

  return { items, nextPageToken: list.nextPageToken };
}
