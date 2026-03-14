import Link from "next/link";
import { redirect } from "next/navigation";
import { Suspense } from "react";
import { getOptionalUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { formatEventArtists } from "@/lib/eventArtists";
import { MyListFilters } from "@/components/MyListFilters";
import { MyListItems } from "@/components/MyListItems";

type Row = {
  id: string;
  memo: string | null;
  photo_url: string | null;
  events: {
    id: string;
    event_date: string;
    title: string;
    artist_name: string | null;
    memo: string | null;
    venue_id: string;
    venues: { id: string; name: string; prefecture: string; city: string | null } | null;
    event_artists: Array<{ artist_name: string }> | null;
  } | null;
};

type Params = { searchParams: Promise<{ order?: string; year?: string; artist?: string; venue?: string }> };

export default async function MyListPage({ searchParams }: Params) {
  const user = await getOptionalUser();
  if (!user) redirect("/login");

  const { order, year: yearParam, artist: artistParam, venue: venueIdParam } = await searchParams;
  const isAsc = order === "asc";
  const filterYear = yearParam ? parseInt(yearParam, 10) : null;
  const filterArtist = artistParam?.trim() || null;
  const filterVenueId = venueIdParam?.trim() || null;

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("attendances")
    .select("id, memo, photo_url, events(id, event_date, title, artist_name, memo, venue_id, venues(id, name, prefecture, city), event_artists(artist_name))")
    .eq("user_id", user.id)
    .order("created_at", { ascending: false });

  const allList = (rows ?? []) as unknown as Row[];

  const listForFilters = allList.filter((r) => r.events != null);
  const years = Array.from(
    new Set(listForFilters.map((r) => r.events!.event_date?.slice(0, 4)).filter(Boolean))
  ).sort((a, b) => (b as string).localeCompare(a as string)) as string[];

  const artistToCount = new Map<string, number>();
  listForFilters.forEach((row) => {
    const e = row.events!;
    const names: string[] =
      e.event_artists?.length
        ? e.event_artists.map((a) => a.artist_name?.trim()).filter(Boolean) as string[]
        : e.artist_name?.trim()
          ? [e.artist_name.trim()]
          : [];
    names.forEach((name) => artistToCount.set(name, (artistToCount.get(name) ?? 0) + 1));
  });
  const artists = Array.from(artistToCount.entries())
    .map(([name, count]) => ({ name, count }))
    .sort((a, b) => b.count - a.count);

  const venueToLabel = new Map<string, string>();
  const venueToCount = new Map<string, number>();
  listForFilters.forEach((row) => {
    const v = row.events?.venues;
    if (!v?.id) return;
    const key = v.id;
    const label = `${v.name}（${v.prefecture}${v.city ? ` ${v.city}` : ""}）`;
    venueToLabel.set(key, label);
    venueToCount.set(key, (venueToCount.get(key) ?? 0) + 1);
  });
  const venues = Array.from(venueToLabel.entries())
    .map(([id]) => ({ id, label: venueToLabel.get(id)!, count: venueToCount.get(id) ?? 0 }))
    .sort((a, b) => b.count - a.count);

  let list = [...allList].filter((row) => {
    const e = row.events;
    if (!e) return false;
    if (filterYear != null && !Number.isNaN(filterYear)) {
      const y = e.event_date?.slice(0, 4);
      if (y !== String(filterYear)) return false;
    }
    if (filterArtist) {
      const names: string[] =
        e.event_artists?.length
          ? e.event_artists.map((a) => a.artist_name?.trim()).filter(Boolean) as string[]
          : e.artist_name?.trim()
            ? [e.artist_name.trim()]
            : [];
      if (!names.includes(filterArtist)) return false;
    }
    if (filterVenueId && e.venue_id !== filterVenueId) return false;
    return true;
  });

  list = list.sort((a, b) => {
    const dateA = a.events?.event_date ?? "";
    const dateB = b.events?.event_date ?? "";
    if (!dateA || !dateB) return 0;
    return isAsc ? dateA.localeCompare(dateB) : dateB.localeCompare(dateA);
  });

  const orderParam = isAsc ? "asc" : "desc";

  const filterLabels: string[] = [];
  if (filterYear != null && !Number.isNaN(filterYear)) filterLabels.push(`${filterYear}年`);
  if (filterArtist) filterLabels.push(`アーティスト: ${filterArtist}`);
  if (filterVenueId) filterLabels.push(`会場: ${venueToLabel.get(filterVenueId) ?? "—"}`);

  return (
    <>
      <h1 className="text-xl font-bold tracking-tight text-live-900">
        行った公演 全件一覧
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        {filterLabels.length > 0 ? `条件: ${filterLabels.join(" / ")} — ` : ""}
        全{list.length}件を表示しています。
      </p>

      <div className="mt-4">
        <Suspense fallback={<div className="rounded-card border border-live-100 bg-live-50/30 p-3 text-sm text-gray-500">絞り込みを読み込み中...</div>}>
          <MyListFilters
          order={orderParam}
          filterYear={filterYear != null && !Number.isNaN(filterYear) ? String(filterYear) : ""}
          filterArtist={filterArtist ?? ""}
          filterVenueId={filterVenueId ?? ""}
          years={years}
          artists={artists.map(({ name }) => ({ name }))}
          venues={venues.map(({ id, label }) => ({ id, label }))}
        />
        </Suspense>
      </div>

      {list.length === 0 ? (
        <p className="mt-6 text-gray-500">まだ記録がありません。</p>
      ) : (
        <MyListItems
          items={list.map((row) => {
            const e = row.events!;
            const v = e.venues;
            const venueLabel = v ? `${v.name}（${v.prefecture}${v.city ? ` ${v.city}` : ""}）` : "—";
            const artistDisplay =
              e.artist_name || (e.event_artists && e.event_artists.length > 0)
                ? formatEventArtists(e)
                : null;
            return {
              id: row.id,
              title: e.title,
              artistDisplay,
              eventDate: e.event_date,
              venueLabel,
              memo: row.memo ?? null,
              photoUrl: row.photo_url ?? null,
            };
          })}
        />
      )}

      <Link
        href="/my"
        className="mt-8 inline-block text-sm font-bold text-live-600 hover:underline"
      >
        ← マイ記録へ戻る
      </Link>
    </>
  );
}
