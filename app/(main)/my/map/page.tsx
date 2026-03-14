import Link from "next/link";
import { redirect } from "next/navigation";
import dynamic from "next/dynamic";
import { getOptionalUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import type { MapVenueItem } from "@/components/VenueMap";

const VenueMap = dynamic(() => import("@/components/VenueMap").then((m) => m.VenueMap), {
  ssr: false,
  loading: () => (
    <div className="flex h-[320px] w-full items-center justify-center rounded-card border border-live-200 bg-gray-100 text-gray-500">
      地図を読み込み中...
    </div>
  ),
});

type Row = {
  id: string;
  events: {
    id: string;
    event_date: string;
    title: string;
    artist_name: string | null;
    venues: {
      id: string;
      name: string;
      lat: number | null;
      lng: number | null;
      position_approximate?: boolean;
      prefecture: string;
      city: string | null;
      address_detail: string | null;
    } | null;
    event_artists: Array<{ artist_name: string }> | null;
  } | null;
};

export default async function MyMapPage() {
  const user = await getOptionalUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("attendances")
    .select(
      "id, events(id, event_date, title, artist_name, venues(id, name, lat, lng, position_approximate, prefecture, city, address_detail), event_artists(artist_name))"
    )
    .eq("user_id", user.id);

  const list = (rows ?? []) as unknown as Row[];

  const byVenue = new Map<
    string,
    { venueId: string; name: string; lat: number; lng: number; approximate?: boolean; events: MapVenueItem["events"] }
  >();
  const venueIdsToGeocode = new Set<string>();
  const venueInfoToGeocode = new Map<
    string,
    { id: string; name: string; addressLabel: string }
  >();

  list.forEach((row) => {
    const e = row.events;
    const v = e?.venues;
    if (!e || !v?.id) return;
    const hasCoords = v.lat != null && v.lng != null;
    const hasAddress = v.prefecture?.trim() && (v.city?.trim() || v.address_detail?.trim());
    if (hasCoords) {
      const key = v.id;
      const cur = byVenue.get(key);
      const ev = {
        event_date: e.event_date,
        title: e.title,
        artist_name: e.artist_name,
        event_artists: e.event_artists ?? null,
      };
      if (cur) {
        cur.events.push(ev);
      } else {
        byVenue.set(key, {
          venueId: v.id,
          name: v.name,
          lat: v.lat as number,
          lng: v.lng as number,
          approximate: v.position_approximate === true,
          events: [ev],
        });
      }
    } else if (hasAddress) {
      venueIdsToGeocode.add(v.id);
      if (!venueInfoToGeocode.has(v.id)) {
        venueInfoToGeocode.set(v.id, {
          id: v.id,
          name: v.name,
          addressLabel: [v.prefecture, v.city, v.address_detail].filter(Boolean).join(" "),
        });
      }
    }
  });

  const venues: MapVenueItem[] = Array.from(byVenue.values());
  const geocodeIds = Array.from(venueIdsToGeocode);
  const venuesToGeocodeList = Array.from(venueInfoToGeocode.values());

  return (
    <>
      <h1 className="text-xl font-bold tracking-tight text-live-900">マップ</h1>
      <p className="mt-1 text-sm text-gray-600">
        行った会場を地図に表示します。ピンをタップすると、その会場で見たライブ一覧が下に表示されます。
      </p>
      <p className="mt-0.5 text-xs text-gray-500">
        会場の住所を登録・編集すると、位置が自動で取得されマップに表示されます。
      </p>

      {(venues.length > 0 || geocodeIds.length > 0) && (
        <p className="mt-3 rounded-button border border-live-100 bg-live-50/50 px-3 py-2 text-sm text-live-900">
          <span className="font-bold">マップにピン表示: {venues.length}件</span>
          {geocodeIds.length > 0 && (
            <>
              {" "}
              — 住所が入力されている会場が<strong>{geocodeIds.length}件</strong>あります。ボタンで位置の取得を試せます（住所によっては表示できない場合があります）。
            </>
          )}
        </p>
      )}

      <div className="mt-6">
        <VenueMap
          venues={venues}
          venueIdsToGeocode={geocodeIds}
          venuesToGeocodeList={venuesToGeocodeList}
        />
      </div>

      <div className="mt-6 flex gap-3">
        <Link href="/my" className="btn-secondary">
          マイ記録に戻る
        </Link>
      </div>
    </>
  );
}
