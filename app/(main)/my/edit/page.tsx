import Link from "next/link";
import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { EditEventForm } from "@/components/EditEventForm";

type Params = { searchParams: Promise<{ id?: string }> };

export default async function MyEditPage({ searchParams }: Params) {
  const user = await getOptionalUser();
  if (!user) redirect("/login");

  const { id: attendanceId } = await searchParams;
  if (!attendanceId) redirect("/my");

  const supabase = await createClient();
  const { data: row } = await supabase
    .from("attendances")
    .select("id, memo, photo_url, event_id, events(id, event_date, title, artist_name, venues(name, prefecture, city), event_artists(artist_name))")
    .eq("id", attendanceId)
    .eq("user_id", user.id)
    .single();

  if (!row || !row.events) redirect("/my");

  const e = row.events as unknown as {
    id: string;
    event_date: string;
    title: string;
    artist_name: string | null;
    venues: { name: string; prefecture: string; city: string | null } | null;
    event_artists: Array<{ artist_name: string }> | null;
  };
  const v = e.venues;
  const venueName = v ? `${v.name}（${v.prefecture}${v.city ? ` ${v.city}` : ""}）` : "—";
  const artistList: string[] =
    e.event_artists && e.event_artists.length > 0
      ? e.event_artists.map((a) => a.artist_name).filter(Boolean)
      : e.artist_name?.trim()
        ? [e.artist_name.trim()]
        : [""];

  return (
    <>
      <h1 className="text-xl font-bold tracking-tight text-live-900">公演を編集</h1>
      <p className="mt-1 text-sm text-gray-600">
        公演名・アーティスト名・楽しかったこと・写真を修正できます。
      </p>
      <EditEventForm
        userId={user.id}
        attendanceId={row.id}
        eventId={e.id}
        venueName={venueName}
        initial={{
          event_date: e.event_date,
          title: e.title,
          artist_list: artistList,
          memo: (row.memo as string | null) ?? "",
          photo_url: (row.photo_url as string | null) ?? null,
        }}
      />
      <div className="mt-6 flex gap-3">
        <Link href={`/my/record/${row.id}?from=edit`} className="text-sm font-bold text-live-600 hover:underline">
          詳細を見る
        </Link>
        <Link href="/my" className="text-sm font-bold text-live-600 hover:underline">
          ← マイ記録へ戻る
        </Link>
      </div>
    </>
  );
}
