import type { SupabaseClient } from "@supabase/supabase-js";

export type UserStats = {
  totalEvents: number;
  totalVenues: number;
  totalPrefectures: number;
  totalArtists: number;
};

/**
 * ユーザーの記録サマリ（公演数・会場数・都道府県数・アーティスト数）を取得
 */
export async function getUserStats(
  supabase: SupabaseClient,
  userId: string
): Promise<UserStats> {
  const { data: rows } = await supabase
    .from("attendances")
    .select("id, events(venue_id, artist_name, venues(prefecture), event_artists(artist_name))")
    .eq("user_id", userId);

  type Row = {
    id: string;
    events: {
      venue_id: string;
      artist_name: string | null;
      venues: { prefecture: string } | null;
      event_artists: Array<{ artist_name: string }> | null;
    } | null;
  };

  const list = (rows ?? []) as unknown as Row[];
  const venueIdSet = new Set<string>();
  const prefectureSet = new Set<string>();
  const artistSet = new Set<string>();

  list.forEach((row) => {
    const ev = row.events;
    if (!ev) return;
    venueIdSet.add(ev.venue_id);
    if (ev.venues?.prefecture) prefectureSet.add(ev.venues.prefecture);
    if (ev.event_artists && ev.event_artists.length > 0) {
      ev.event_artists.forEach((a) => {
        if (a.artist_name?.trim()) artistSet.add(a.artist_name.trim());
      });
    } else if (ev.artist_name?.trim()) {
      artistSet.add(ev.artist_name.trim());
    }
  });

  return {
    totalEvents: list.length,
    totalVenues: venueIdSet.size,
    totalPrefectures: prefectureSet.size,
    totalArtists: artistSet.size,
  };
}

/** バッジ一覧: 獲得条件でフィルタ */
export const BADGE_DEFINITIONS: Array<{
  id: string;
  label: string;
  check: (s: UserStats) => boolean;
}> = [
  { id: "first", label: "初回記録", check: (s) => s.totalEvents >= 1 },
  { id: "5live", label: "ライブ5回", check: (s) => s.totalEvents >= 5 },
  { id: "10live", label: "ライブ10回", check: (s) => s.totalEvents >= 10 },
  { id: "30live", label: "ライブ30回", check: (s) => s.totalEvents >= 30 },
  { id: "100live", label: "ライブ100回", check: (s) => s.totalEvents >= 100 },
  { id: "venue3", label: "会場3箇所", check: (s) => s.totalVenues >= 3 },
  { id: "venue10", label: "会場10箇所", check: (s) => s.totalVenues >= 10 },
  { id: "pref3", label: "3都道府県制覇", check: (s) => s.totalPrefectures >= 3 },
  { id: "pref10", label: "10都道府県制覇", check: (s) => s.totalPrefectures >= 10 },
  { id: "artist5", label: "アーティスト5組", check: (s) => s.totalArtists >= 5 },
  { id: "artist20", label: "アーティスト20組", check: (s) => s.totalArtists >= 20 },
];

export function getEarnedBadges(stats: UserStats): string[] {
  return BADGE_DEFINITIONS.filter((b) => b.check(stats)).map((b) => b.label);
}

/** 指定年の公演数・会場数のみ（シェアカード用） */
export type UserStatsPeriod = { totalEvents: number; totalVenues: number };

export async function getUserStatsByYear(
  supabase: SupabaseClient,
  userId: string,
  year: number
): Promise<UserStatsPeriod> {
  const { data: rows } = await supabase
    .from("attendances")
    .select("id, events(venue_id, event_date)")
    .eq("user_id", userId);

  type Row = {
    id: string;
    events: { venue_id: string; event_date: string } | null;
  };
  const list = (rows ?? []) as unknown as Row[];
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const venueIdSet = new Set<string>();
  let count = 0;
  list.forEach((row) => {
    const ev = row.events;
    if (!ev?.event_date) return;
    if (ev.event_date >= start && ev.event_date <= end) {
      count++;
      if (ev.venue_id) venueIdSet.add(ev.venue_id);
    }
  });
  return { totalEvents: count, totalVenues: venueIdSet.size };
}

/** ユーザーが記録を持つ年を取得（降順） */
export async function getUserRecordYears(
  supabase: SupabaseClient,
  userId: string
): Promise<number[]> {
  const { data: rows } = await supabase
    .from("attendances")
    .select("events(event_date)")
    .eq("user_id", userId);

  type Row = { events: { event_date: string } | null } | null;
  const list = (rows ?? []) as unknown as Row[];
  const years = new Set<number>();
  list.forEach((row) => {
    const d = row?.events?.event_date;
    if (d && d.length >= 4) years.add(parseInt(d.slice(0, 4), 10));
  });
  return Array.from(years).sort((a, b) => b - a);
}

/** アーティスト別の回数ランキング（マイ記録ランキング・シェアカード用）。year 指定でその年に絞る */
export type ArtistRankEntry = { name: string; count: number };

export async function getArtistRanking(
  supabase: SupabaseClient,
  userId: string,
  year?: number
): Promise<ArtistRankEntry[]> {
  const { data: rows } = await supabase
    .from("attendances")
    .select("id, events(artist_name, title, event_date, event_artists(artist_name))")
    .eq("user_id", userId);

  type Row = {
    id: string;
    events: {
      artist_name: string | null;
      title: string | null;
      event_date: string | null;
      event_artists: Array<{ artist_name: string }> | null;
    } | null;
  };
  const list = (rows ?? []) as unknown as Row[];
  const start = year != null ? `${year}-01-01` : null;
  const end = year != null ? `${year}-12-31` : null;

  const countMap = new Map<string, number>();
  list.forEach((row) => {
    const ev = row.events;
    if (!ev) return;
    if (start != null && end != null && ev.event_date != null) {
      if (ev.event_date < start || ev.event_date > end) return;
    }
    const names: string[] =
      ev.event_artists && ev.event_artists.length > 0
        ? ev.event_artists.map((a) => a.artist_name?.trim()).filter((s): s is string => Boolean(s))
        : ev.artist_name?.trim()
          ? [ev.artist_name.trim()]
          : [];
    names.forEach((label) => {
      countMap.set(label, (countMap.get(label) ?? 0) + 1);
    });
  });

  return Array.from(countMap.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);
}
