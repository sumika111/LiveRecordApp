import Link from "next/link";
import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { MyCalendar } from "@/components/MyCalendar";
import { formatEventArtists } from "@/lib/eventArtists";
import type { DayEvent } from "@/components/MyCalendar";

type Row = {
  id: string;
  events: {
    id: string;
    event_date: string;
    title: string;
    artist_name: string | null;
    memo: string | null;
    venues: { name: string; prefecture: string; city: string | null } | null;
    event_artists: Array<{ artist_name: string }> | null;
  } | null;
};

type Params = { searchParams: Promise<{ year?: string; month?: string }> };

export default async function MyCalendarPage({ searchParams }: Params) {
  const user = await getOptionalUser();
  if (!user) redirect("/login");

  const { year: yearStr, month: monthStr } = await searchParams;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;
  const year = yearStr ? parseInt(yearStr, 10) : currentYear;
  const month = monthStr ? parseInt(monthStr, 10) : currentMonth;

  const supabase = await createClient();
  const { data: rows } = await supabase
    .from("attendances")
    .select("id, events(id, event_date, title, artist_name, memo, venues(name, prefecture, city), event_artists(artist_name))")
    .eq("user_id", user.id);

  const list = (rows ?? []) as unknown as Row[];

  const eventsByDate: Record<string, DayEvent[]> = {};
  list.forEach((row) => {
    const e = row.events;
    if (!e?.event_date) return;
    const v = e.venues;
    const venueLabel = v
      ? `${v.name}（${v.prefecture}${v.city ? ` ${v.city}` : ""}）`
      : "—";
    const dayEvent: DayEvent = {
      attendanceId: row.id,
      title: e.title,
      artistName: formatEventArtists(e),
      venueLabel,
      memo: e.memo,
    };
    if (!eventsByDate[e.event_date]) eventsByDate[e.event_date] = [];
    eventsByDate[e.event_date].push(dayEvent);
  });

  const prevMonth = month === 1 ? { year: year - 1, month: 12 } : { year, month: month - 1 };
  const nextMonth = month === 12 ? { year: year + 1, month: 1 } : { year, month: month + 1 };
  const prevHref = `/my/calendar?year=${prevMonth.year}&month=${prevMonth.month}`;
  const nextHref = `/my/calendar?year=${nextMonth.year}&month=${nextMonth.month}`;

  /** 表示中の月の公演だけ（日付順） */
  const eventsThisMonth = list
    .filter((row) => {
      const d = row.events?.event_date ?? "";
      const [y, m] = d.split("-").map(Number);
      return y === year && m === month;
    })
    .sort((a, b) => (a.events?.event_date ?? "").localeCompare(b.events?.event_date ?? ""));

  return (
    <>
      <h1 className="text-xl font-bold tracking-tight text-live-900">カレンダー</h1>
      <p className="mt-1 text-sm text-gray-600">
        日付をクリックすると、その日の公演一覧と詳細ボタンが表示されます。
      </p>

      {list.length === 0 ? (
        <p className="mt-6 text-gray-500">
          まだ記録がありません。「記録する」から追加するとカレンダーに表示されます。
        </p>
      ) : (
        <>
          <div className="mt-6">
            <MyCalendar
              year={year}
              month={month}
              eventsByDate={eventsByDate}
              prevHref={prevHref}
              nextHref={nextHref}
            />
          </div>

          <section className="mt-8">
            <h2 className="text-lg font-bold text-live-900">
              {year}年{month}月のライブ
            </h2>
            <p className="mt-0.5 text-sm text-gray-600">
              この月に行った公演一覧です。
            </p>
            {eventsThisMonth.length === 0 ? (
              <p className="mt-3 text-sm text-gray-500">
                {year}年{month}月の記録はありません。
              </p>
            ) : (
              <ul className="mt-3 space-y-2">
                {eventsThisMonth.map((row) => {
                  const e = row.events;
                  if (!e) return null;
                  const v = e.venues;
                  const venueLabel = v
                    ? `${v.name}（${v.prefecture}${v.city ? ` ${v.city}` : ""}）`
                    : "—";
                  return (
                    <li key={row.id} className="card flex items-start justify-between gap-2">
                      <div className="min-w-0 flex-1">
                        <p className="font-bold text-gray-900">{e.title}</p>
                        {e.artist_name || (e.event_artists && e.event_artists.length > 0) ? (
                          <p className="mt-0.5 text-sm text-live-700">{formatEventArtists(e)}</p>
                        ) : null}
                        <p className="mt-0.5 text-sm text-gray-600">
                          {e.event_date} ／ {venueLabel}
                        </p>
                      </div>
                      <Link
                        href={`/my/edit?id=${row.id}`}
                        className="btn-secondary shrink-0 py-1.5 text-sm"
                      >
                        編集
                      </Link>
                    </li>
                  );
                })}
              </ul>
            )}
          </section>
        </>
      )}

      <div className="mt-6 flex gap-3">
        <Link href="/my" className="btn-secondary">
          一覧に戻る
        </Link>
        <Link href="/record" className="btn-primary">
          記録する
        </Link>
      </div>
    </>
  );
}
