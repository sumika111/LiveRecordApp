import type { SupabaseClient } from "@supabase/supabase-js";
import { toPublicDisplayName } from "@/lib/displayName";

type AttendanceRow = {
  user_id: string;
  event_id: string;
  events: {
    venue_id: string;
    event_date: string;
    venues: { prefecture: string } | null;
  } | null;
};

type ProfileRow = { id: string; display_name: string | null };

export type RankingEntry = {
  rank: number;
  userId: string;
  displayName: string;
  count: number;
};

/** 公演数・会場数・都道府県数（ユーザー別）のランキングを取得（各トップ20） */
export async function getRankings(supabase: SupabaseClient) {
  const { data: attendanceRows } = await supabase
    .from("attendances")
    .select("user_id, event_id, events(venue_id, event_date, venues(prefecture))");

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, display_name");

  const attendances = (attendanceRows ?? []) as unknown as AttendanceRow[];
  const profiles = (profileRows ?? []) as unknown as ProfileRow[];

  const { toPublicDisplayName } = await import("@/lib/displayName");
  const profileMap = new Map(profiles.map((p) => [p.id, toPublicDisplayName(p.display_name)]));

  type Agg = {
    events: number;
    venueIds: Set<string>;
    prefectures: Set<string>;
  };
  const byUser = new Map<string, Agg>();

  for (const row of attendances) {
    const agg = byUser.get(row.user_id) ?? {
      events: 0,
      venueIds: new Set<string>(),
      prefectures: new Set<string>(),
    };
    agg.events += 1;
    const ev = row.events;
    if (ev?.venue_id) agg.venueIds.add(ev.venue_id);
    const pref = ev?.venues?.prefecture;
    if (pref) agg.prefectures.add(pref);
    byUser.set(row.user_id, agg);
  }

  const topN = 20;

  const byEvents = Array.from(byUser.entries())
    .map(([userId, agg]) => ({
      userId,
      displayName: profileMap.get(userId) ?? "匿名",
      count: agg.events,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  const byVenues = Array.from(byUser.entries())
    .map(([userId, agg]) => ({
      userId,
      displayName: profileMap.get(userId) ?? "匿名",
      count: agg.venueIds.size,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  const byPrefectures = Array.from(byUser.entries())
    .map(([userId, agg]) => ({
      userId,
      displayName: profileMap.get(userId) ?? "匿名",
      count: agg.prefectures.size,
    }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  return {
    byEvents: byEvents as RankingEntry[],
    byVenues: byVenues as RankingEntry[],
    byPrefectures: byPrefectures as RankingEntry[],
  };
}

/** 期間を指定してランキングを取得（月別 or 年別）。event_date でフィルタ */
export async function getRankingsByPeriod(
  supabase: SupabaseClient,
  period: { year: number; month?: number }
) {
  const { data: attendanceRows } = await supabase
    .from("attendances")
    .select("user_id, event_id, events(venue_id, event_date, venues(prefecture))");

  const attendances = (attendanceRows ?? []) as unknown as AttendanceRow[];

  const start = period.month != null
    ? `${period.year}-${String(period.month).padStart(2, "0")}-01`
    : `${period.year}-01-01`;
  const end =
    period.month != null
      ? (() => {
          const nextMonth = period.month === 12 ? 1 : period.month + 1;
          const nextYear = period.month === 12 ? period.year + 1 : period.year;
          return `${nextYear}-${String(nextMonth).padStart(2, "0")}-01`;
        })()
      : `${period.year}-12-31`;

  const inRange = attendances.filter((row) => {
    const d = row.events?.event_date;
    if (!d) return false;
    if (period.month != null) return d >= start && d < end;
    return d >= start && d <= end;
  });

  const { data: profileRows } = await supabase
    .from("profiles")
    .select("id, display_name");
  const profiles = (profileRows ?? []) as unknown as ProfileRow[];
  const profileMap = new Map(profiles.map((p) => [p.id, toPublicDisplayName(p.display_name)]));

  type Agg = { events: number; venueIds: Set<string>; prefectures: Set<string> };
  const byUser = new Map<string, Agg>();
  for (const row of inRange) {
    const agg = byUser.get(row.user_id) ?? {
      events: 0,
      venueIds: new Set<string>(),
      prefectures: new Set<string>(),
    };
    agg.events += 1;
    const ev = row.events;
    if (ev?.venue_id) agg.venueIds.add(ev.venue_id);
    const pref = ev?.venues?.prefecture;
    if (pref) agg.prefectures.add(pref);
    byUser.set(row.user_id, agg);
  }

  const topN = 20;
  const byEvents = Array.from(byUser.entries())
    .map(([userId, agg]) => ({ userId, displayName: profileMap.get(userId) ?? "匿名", count: agg.events }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map((e, i) => ({ ...e, rank: i + 1 }));
  const byVenues = Array.from(byUser.entries())
    .map(([userId, agg]) => ({ userId, displayName: profileMap.get(userId) ?? "匿名", count: agg.venueIds.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map((e, i) => ({ ...e, rank: i + 1 }));
  const byPrefectures = Array.from(byUser.entries())
    .map(([userId, agg]) => ({ userId, displayName: profileMap.get(userId) ?? "匿名", count: agg.prefectures.size }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map((e, i) => ({ ...e, rank: i + 1 }));

  return {
    byEvents: byEvents as RankingEntry[],
    byVenues: byVenues as RankingEntry[],
    byPrefectures: byPrefectures as RankingEntry[],
  };
}

export type VenueVisitRankingEntry = {
  rank: number;
  venueId: string;
  venueLabel: string;
  count: number;
};

/** 会場別「みんなが何回行ったか」ランキング（延べ回数）。year 指定時はその年に限定。 */
export async function getVenueVisitCountRanking(
  supabase: SupabaseClient,
  year?: number
): Promise<VenueVisitRankingEntry[]> {
  const { data: rows } = await supabase
    .from("attendances")
    .select("event_id, events(venue_id, event_date, venues(name, prefecture, city))");

  type Row = {
    event_id: string;
    events: {
      venue_id: string;
      event_date: string;
      venues: { name: string; prefecture: string; city: string | null } | null;
    } | null;
  };
  const list = (rows ?? []) as unknown as Row[];

  const start = year != null ? `${year}-01-01` : null;
  const end = year != null ? `${year}-12-31` : null;

  const byVenue = new Map<string, { label: string; count: number }>();
  for (const row of list) {
    const e = row.events;
    if (!e?.venue_id) continue;
    const d = e.event_date ?? "";
    if (start != null && end != null && (d < start || d > end)) continue;
    const v = e.venues;
    const label = v
      ? `${v.name}（${v.prefecture}${v.city ? ` ${v.city}` : ""}）`
      : e.venue_id;
    const cur = byVenue.get(e.venue_id);
    if (cur) {
      cur.count += 1;
    } else {
      byVenue.set(e.venue_id, { label, count: 1 });
    }
  }

  const topN = 20;
  return Array.from(byVenue.entries())
    .map(([venueId, { label, count }]) => ({ venueId, venueLabel: label, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

/** 指定会場に「何回行ったか」ユーザー別ランキング（トップ20）。year 指定時はその年に限定。 */
export async function getUsersByVenueAndPeriod(
  supabase: SupabaseClient,
  venueId: string,
  year?: number
): Promise<RankingEntry[]> {
  const { data: rows } = await supabase
    .from("attendances")
    .select("user_id, event_id, events(venue_id, event_date)");

  type Row = {
    user_id: string;
    event_id: string;
    events: { venue_id: string; event_date: string } | null;
  };
  const list = (rows ?? []) as unknown as Row[];

  const start = year != null ? `${year}-01-01` : null;
  const end = year != null ? `${year}-12-31` : null;

  const byUser = new Map<string, number>();
  for (const row of list) {
    const e = row.events;
    if (!e || e.venue_id !== venueId) continue;
    const d = e.event_date ?? "";
    if (start != null && end != null && (d < start || d > end)) continue;
    byUser.set(row.user_id, (byUser.get(row.user_id) ?? 0) + 1);
  }

  const { data: profileRows } = await supabase.from("profiles").select("id, display_name");
  const profiles = (profileRows ?? []) as unknown as ProfileRow[];
  const profileMap = new Map(profiles.map((p) => [p.id, toPublicDisplayName(p.display_name)]));

  const topN = 20;
  return Array.from(byUser.entries())
    .map(([userId, count]) => ({ userId, displayName: profileMap.get(userId) ?? "匿名", count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map((e, i) => ({ ...e, rank: i + 1 })) as RankingEntry[];
}

/** 会場の表示用ラベルを取得（会場名（都道府県 市区町村）） */
export async function getVenueDisplayLabel(
  supabase: SupabaseClient,
  venueId: string
): Promise<string> {
  const { data: v } = await supabase
    .from("venues")
    .select("name, prefecture, city")
    .eq("id", venueId)
    .single();
  if (!v) return venueId;
  const name = (v as { name: string }).name ?? "";
  const prefecture = (v as { prefecture: string }).prefecture ?? "";
  const city = (v as { city: string | null }).city;
  return city ? `${name}（${prefecture} ${city}）` : `${name}（${prefecture}）`;
}

/** 会場名で検索し、延べ回数順の会場一覧を返す（最大20件）。year 指定時はその年に限定。 */
export async function getVenueVisitCountRankingSearch(
  supabase: SupabaseClient,
  query: string,
  year?: number
): Promise<VenueVisitRankingEntry[]> {
  const q = query.trim();
  if (q.length === 0) return [];

  const pattern = `%${q}%`;
  const { data: venueRows } = await supabase
    .from("venues")
    .select("id, name, prefecture, city")
    .ilike("name", pattern)
    .limit(100);

  type VRow = { id: string; name: string; prefecture: string; city: string | null };
  const venues = (venueRows ?? []) as VRow[];
  if (venues.length === 0) return [];

  const venueIds = new Set(venues.map((v) => v.id));
  const labelMap = new Map(venues.map((v) => [v.id, `${v.name}（${v.prefecture}${v.city ? ` ${v.city}` : ""}）`]));

  const { data: attRows } = await supabase
    .from("attendances")
    .select("event_id, events(venue_id, event_date)");

  type AttRow = {
    event_id: string;
    events: { venue_id: string; event_date: string } | null;
  };
  const list = (attRows ?? []) as unknown as AttRow[];
  const start = year != null ? `${year}-01-01` : null;
  const end = year != null ? `${year}-12-31` : null;

  const byVenue = new Map<string, number>();
  for (const row of list) {
    const e = row.events;
    if (!e?.venue_id || !venueIds.has(e.venue_id)) continue;
    const d = e.event_date ?? "";
    if (start != null && end != null && (d < start || d > end)) continue;
    byVenue.set(e.venue_id, (byVenue.get(e.venue_id) ?? 0) + 1);
  }

  const topN = 20;
  return Array.from(byVenue.entries())
    .map(([venueId, count]) => ({ venueId, venueLabel: labelMap.get(venueId) ?? venueId, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

export type ArtistRankingEntry = {
  rank: number;
  artistName: string;
  count: number;
};

/** 全体で「みんながそのアーティストのライブに何回行ったか」トップ20 */
export async function getArtistRankingAllTime(
  supabase: SupabaseClient
): Promise<ArtistRankingEntry[]> {
  const { data: rows } = await supabase
    .from("attendances")
    .select("event_id, events(artist_name, event_artists(artist_name))");

  type Row = {
    event_id: string;
    events: {
      artist_name: string | null;
      event_artists: Array<{ artist_name: string }> | null;
    } | null;
  };
  const list = (rows ?? []) as unknown as Row[];
  const byArtist = new Map<string, number>();
  for (const row of list) {
    const e = row.events;
    if (!e) continue;
    const names: string[] =
      e.event_artists && e.event_artists.length > 0
        ? e.event_artists.map((a) => a.artist_name?.trim()).filter((s): s is string => Boolean(s))
        : e.artist_name?.trim()
          ? [e.artist_name.trim()]
          : [];
    names.forEach((label) => {
      byArtist.set(label, (byArtist.get(label) ?? 0) + 1);
    });
  }

  const topN = 20;
  return Array.from(byArtist.entries())
    .map(([artistName, count]) => ({ artistName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

/** 年別で「みんながそのアーティストのライブに何回行ったか」トップ20（負荷対策で20件のみ） */
export async function getArtistRankingByYear(
  supabase: SupabaseClient,
  year: number
): Promise<ArtistRankingEntry[]> {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const { data: rows } = await supabase
    .from("attendances")
    .select("event_id, events(event_date, artist_name, title, event_artists(artist_name))");

  type Row = {
    event_id: string;
    events: {
      event_date: string;
      artist_name: string | null;
      title: string;
      event_artists: Array<{ artist_name: string }> | null;
    } | null;
  };
  const list = (rows ?? []) as unknown as Row[];
  const inYear = list.filter((row) => {
    const d = row.events?.event_date ?? "";
    return d >= start && d <= end;
  });

  const byArtist = new Map<string, number>();
  for (const row of inYear) {
    const e = row.events;
    if (!e) continue;
    const names: string[] =
      e.event_artists && e.event_artists.length > 0
        ? e.event_artists.map((a) => a.artist_name?.trim()).filter((s): s is string => Boolean(s))
        : e.artist_name?.trim()
          ? [e.artist_name.trim()]
          : [];
    names.forEach((label) => {
      byArtist.set(label, (byArtist.get(label) ?? 0) + 1);
    });
  }

  const topN = 20;
  return Array.from(byArtist.entries())
    .map(([artistName, count]) => ({ artistName, count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map((e, i) => ({ ...e, rank: i + 1 }));
}

/** 指定アーティストについて「そのアーティストに何回行ったか」ユーザー別ランキング・全体（トップ20） */
export async function getUsersByArtistAllTime(
  supabase: SupabaseClient,
  artistName: string
): Promise<RankingEntry[]> {
  const { data: rows } = await supabase
    .from("attendances")
    .select("user_id, event_id, events(artist_name, event_artists(artist_name))");

  type Row = {
    user_id: string;
    event_id: string;
    events: {
      artist_name: string | null;
      event_artists: Array<{ artist_name: string }> | null;
    } | null;
  };
  const list = (rows ?? []) as unknown as Row[];
  const byUser = new Map<string, number>();
  for (const row of list) {
    const e = row.events;
    if (!e) continue;
    const names: string[] =
      e.event_artists && e.event_artists.length > 0
        ? e.event_artists.map((a) => a.artist_name?.trim()).filter((s): s is string => Boolean(s))
        : e.artist_name?.trim()
          ? [e.artist_name.trim()]
          : [];
    if (!names.includes(artistName)) continue;
    byUser.set(row.user_id, (byUser.get(row.user_id) ?? 0) + 1);
  }

  const { data: profileRows } = await supabase.from("profiles").select("id, display_name");
  const profiles = (profileRows ?? []) as unknown as ProfileRow[];
  const profileMap = new Map(profiles.map((p) => [p.id, toPublicDisplayName(p.display_name)]));

  const topN = 20;
  return Array.from(byUser.entries())
    .map(([userId, count]) => ({ userId, displayName: profileMap.get(userId) ?? "匿名", count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map((e, i) => ({ ...e, rank: i + 1 })) as RankingEntry[];
}

/** 指定年の指定アーティストについて「そのアーティストに何回行ったか」ユーザー別ランキング（トップ20） */
export async function getUsersByArtistAndYear(
  supabase: SupabaseClient,
  artistName: string,
  year: number
): Promise<RankingEntry[]> {
  const start = `${year}-01-01`;
  const end = `${year}-12-31`;
  const { data: rows } = await supabase
    .from("attendances")
    .select("user_id, event_id, events(event_date, artist_name, title, event_artists(artist_name))");

  type Row = {
    user_id: string;
    event_id: string;
    events: {
      event_date: string;
      artist_name: string | null;
      title: string;
      event_artists: Array<{ artist_name: string }> | null;
    } | null;
  };
  const list = (rows ?? []) as unknown as Row[];
  const byUser = new Map<string, number>();
  for (const row of list) {
    const e = row.events;
    if (!e) continue;
    const d = e.event_date ?? "";
    if (d < start || d > end) continue;
    const names: string[] =
      e.event_artists && e.event_artists.length > 0
        ? e.event_artists.map((a) => a.artist_name?.trim()).filter((s): s is string => Boolean(s))
        : e.artist_name?.trim()
          ? [e.artist_name.trim()]
          : [];
    if (!names.includes(artistName)) continue;
    byUser.set(row.user_id, (byUser.get(row.user_id) ?? 0) + 1);
  }

  const { data: profileRows } = await supabase.from("profiles").select("id, display_name");
  const profiles = (profileRows ?? []) as unknown as ProfileRow[];
  const profileMap = new Map(profiles.map((p) => [p.id, toPublicDisplayName(p.display_name)]));

  const topN = 20;
  return Array.from(byUser.entries())
    .map(([userId, count]) => ({ userId, displayName: profileMap.get(userId) ?? "匿名", count }))
    .sort((a, b) => b.count - a.count)
    .slice(0, topN)
    .map((e, i) => ({ ...e, rank: i + 1 })) as RankingEntry[];
}
