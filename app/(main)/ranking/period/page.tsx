import Link from "next/link";
import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { getRankings, getRankingsByPeriod, getVenueVisitCountRanking, getUsersByVenueAndPeriod, getVenueDisplayLabel, getArtistRankingByYear, getUsersByArtistAndYear, getArtistRankingAllTime, getUsersByArtistAllTime } from "@/lib/ranking";
import { ArtistSearchYear } from "@/components/ArtistSearchYear";
import { ArtistSearchAll } from "@/components/ArtistSearchAll";
import { VenueRankingSearch } from "@/components/VenueRankingSearch";
import { CollapsibleSection } from "@/components/CollapsibleSection";
import { ScrollToHash } from "@/components/ScrollToHash";

function RankingTable({
  title,
  unit,
  entries,
  hideTitle,
}: {
  title: string;
  unit: string;
  entries: { rank: number; displayName: string; count: number }[];
  hideTitle?: boolean;
}) {
  return (
    <section className={hideTitle ? "" : "card rounded-card border-live-100 p-6"}>
      {!hideTitle && <h2 className="text-lg font-bold text-live-900">{title}</h2>}
      <p className="mt-0.5 text-sm text-gray-500">{unit}の多い順（最大20件）</p>
      {entries.length === 0 ? (
        <p className="mt-4 text-gray-500">この期間のデータはありません。</p>
      ) : (
        <ol className="mt-4 space-y-2">
          {entries.map((e) => (
            <li
              key={`${e.rank}-${e.displayName}`}
              className="flex items-center justify-between rounded-button border border-live-100 bg-surface-muted/50 px-4 py-2 transition-colors hover:bg-live-50/50"
            >
              <span className="flex items-center gap-3">
                <span
                  className={
                    e.rank <= 3
                      ? "flex h-7 w-7 items-center justify-center rounded-full bg-live-100 text-sm font-bold text-live-800"
                      : "text-sm font-medium text-gray-500"
                  }
                >
                  {e.rank}
                </span>
                <span className="font-bold text-gray-900">{e.displayName}</span>
              </span>
              <span className="text-sm font-bold text-live-600">
                {e.count}
                <span className="ml-0.5 text-gray-500">{unit}</span>
              </span>
            </li>
          ))}
        </ol>
      )}
    </section>
  );
}

function getMonthOptions() {
  const now = new Date();
  const options: { year: number; month: number }[] = [];
  for (let i = 0; i < 12; i++) {
    const d = new Date(now.getFullYear(), now.getMonth() - i, 1);
    options.push({ year: d.getFullYear(), month: d.getMonth() + 1 });
  }
  return options;
}

function getYearOptions() {
  const y = new Date().getFullYear();
  return [y, y - 1, y - 2];
}

type Params = { searchParams: Promise<{ type?: string; year?: string; month?: string; artist?: string; venue?: string }> };

export default async function RankingPeriodPage({ searchParams }: Params) {
  const user = await getOptionalUser();
  if (!user) redirect("/login");

  const { type = "all", year: yearStr, month: monthStr, artist: artistParam, venue: venueId } = await searchParams;
  const now = new Date();
  const currentYear = now.getFullYear();
  const currentMonth = now.getMonth() + 1;

  const isAll = type === "all";
  const isMonth = type === "month";
  const isYear = type === "year";
  const year = yearStr ? parseInt(yearStr, 10) : currentYear;
  const month = monthStr ? parseInt(monthStr, 10) : currentMonth;
  const selectedArtist = artistParam ? decodeURIComponent(artistParam) : null;

  const supabase = await createClient();

  const { byEvents, byVenues, byPrefectures } = isAll
    ? await getRankings(supabase)
    : await getRankingsByPeriod(supabase, isMonth ? { year, month } : { year });

  const venueVisitRanking = isAll
    ? await getVenueVisitCountRanking(supabase)
    : isYear
      ? await getVenueVisitCountRanking(supabase, year)
      : [];

  const selectedVenueLabel = venueId ? await getVenueDisplayLabel(supabase, venueId) : null;
  const usersByVenue = venueId
    ? await getUsersByVenueAndPeriod(supabase, venueId, isYear ? year : undefined)
    : [];

  /** 全体のとき「行った回数が多いアーティスト」トップ20 */
  const artistRankingAll = isAll ? await getArtistRankingAllTime(supabase) : [];
  /** 年別のとき「行った回数が多いアーティスト」トップ20 */
  const artistRanking = isYear ? await getArtistRankingByYear(supabase, year) : [];
  /** アーティストを選んだとき「そのアーティストに何回行ったか」ユーザー別ランキング（全体 or 年別） */
  const usersByArtistAll = isAll && selectedArtist ? await getUsersByArtistAllTime(supabase, selectedArtist) : [];
  const usersByArtist =
    isYear && selectedArtist ? await getUsersByArtistAndYear(supabase, selectedArtist, year) : [];

  const monthOptions = getMonthOptions();
  const yearOptions = getYearOptions();

  const periodLabel = isAll ? "全体" : isMonth ? `${year}年${month}月` : `${year}年`;

  return (
    <>
      <ScrollToHash />
      <h1 className="text-xl font-bold tracking-tight text-live-900">
        ランキング（全体・月別・年別）
      </h1>
      <p className="mt-1 text-sm text-gray-600">
        期間を選ぶと、その期間中の公演数・会場数・都道府県数のランキングを表示します。
      </p>

      <div className="mt-6 flex gap-1 rounded-button border border-live-200 bg-surface-muted p-1">
        <Link
          href="/ranking/period?type=all"
          className={`rounded-button px-4 py-2 text-sm font-bold transition-colors ${isAll ? "bg-surface-card text-live-900 shadow-card" : "text-gray-600 hover:text-live-800"}`}
        >
          全体
        </Link>
        <Link
          href={`/ranking/period?type=month&year=${currentYear}&month=${currentMonth}`}
          className={`rounded-button px-4 py-2 text-sm font-bold transition-colors ${isMonth ? "bg-surface-card text-live-900 shadow-card" : "text-gray-600 hover:text-live-800"}`}
        >
          月別
        </Link>
        <Link
          href={`/ranking/period?type=year&year=${currentYear}`}
          className={`rounded-button px-4 py-2 text-sm font-bold transition-colors ${isYear ? "bg-surface-card text-live-900 shadow-card" : "text-gray-600 hover:text-live-800"}`}
        >
          年別
        </Link>
      </div>

      {!isAll && (
      <div className="mt-4">
        <p className="text-sm font-bold text-gray-700">
          {isMonth ? "月を選択" : "年を選択"}
        </p>
        <div className="mt-2 flex flex-wrap gap-2">
          {isMonth
            ? monthOptions.map(({ year: y, month: m }) => {
                const active = y === year && m === month;
                return (
                  <Link
                    key={`${y}-${m}`}
                    href={`/ranking/period?type=month&year=${y}&month=${m}`}
                    className={`rounded-button border px-3 py-1.5 text-sm font-bold transition-colors ${active ? "border-live-500 bg-live-50 text-live-800" : "border-gray-200 bg-white text-gray-700 hover:bg-live-50"}`}
                  >
                    {y}年{m}月
                  </Link>
                );
              })
            : yearOptions.map((y) => {
                const active = y === year;
                return (
                  <Link
                    key={y}
                    href={`/ranking/period?type=year&year=${y}`}
                    className={`rounded-button border px-3 py-1.5 text-sm font-bold transition-colors ${active ? "border-live-500 bg-live-50 text-live-800" : "border-gray-200 bg-white text-gray-700 hover:bg-live-50"}`}
                  >
                    {y}年
                  </Link>
                );
              })}
        </div>
      </div>
      )}

      <p className="mt-4 text-sm font-bold text-live-900">表示中: {periodLabel}</p>

      <div className="mt-6 grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
        <CollapsibleSection title="公演数">
          <RankingTable
            hideTitle
            title="公演数"
            unit="公演"
            entries={byEvents.map((e) => ({
              rank: e.rank,
              displayName: e.displayName,
              count: e.count,
            }))}
          />
        </CollapsibleSection>
        <CollapsibleSection title="会場数">
          <RankingTable
            hideTitle
            title="会場数"
            unit="会場"
            entries={byVenues.map((e) => ({
              rank: e.rank,
              displayName: e.displayName,
              count: e.count,
            }))}
          />
        </CollapsibleSection>
        <CollapsibleSection title="都道府県数">
          <RankingTable
            hideTitle
            title="都道府県数"
            unit="都道府県"
            entries={byPrefectures.map((e) => ({
              rank: e.rank,
              displayName: e.displayName,
              count: e.count,
            }))}
          />
        </CollapsibleSection>
      </div>

      {isAll && (
        <CollapsibleSection id="artist-ranking" title="「アーティスト」でユーザーランキングを見る（全体）" className="mt-8">
          <p className="mt-0.5 text-sm text-gray-600">
            アーティスト名で検索するか、下の一覧から選ぶと、そのアーティストに何回行ったかのユーザー別ランキングが表示されます。
          </p>
          <div id="artist-search" className="mt-4 scroll-mt-4">
            <ArtistSearchAll selectedArtist={selectedArtist} basePath="/ranking/period" queryString="type=all" />
          </div>
          {artistRankingAll.length > 0 && (
            <>
              <p className="mt-6 text-sm text-gray-600">または 行った回数が多い順の一覧から選択:</p>
              <ol className="mt-2 space-y-2">
                {artistRankingAll.map((e) => {
                  const href = `/ranking/period?type=all&artist=${encodeURIComponent(e.artistName)}#artist-detail`;
                  const isSelected = selectedArtist === e.artistName;
                  return (
                    <li key={`${e.rank}-${e.artistName}`}>
                      <Link
                        href={href}
                        className={`flex items-center justify-between gap-3 rounded-button border px-4 py-2 transition-colors ${
                          isSelected
                            ? "border-live-500 bg-live-100 text-live-900"
                            : "border-live-100 bg-surface-muted/50 hover:bg-live-50/50"
                        }`}
                      >
                        <span className="flex min-w-0 flex-1 items-center gap-3">
                          <span
                            className={
                              e.rank <= 3
                                ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-live-100 text-sm font-bold text-live-800"
                                : "text-sm font-medium text-gray-500 shrink-0"
                            }
                          >
                            {e.rank}
                          </span>
                          <span className="truncate font-bold text-gray-900">{e.artistName}</span>
                        </span>
                        <span className="shrink-0 text-sm font-bold text-live-600 whitespace-nowrap">
                          {e.count}
                          <span className="ml-0.5 text-gray-500">回（合計）</span>
                        </span>
                      </Link>
                    </li>
                  );
                })}
              </ol>
            </>
          )}
          {selectedArtist && (
            <div id="artist-detail" className="mt-6 rounded-card border-2 border-live-200 bg-live-50/30 p-4 scroll-mt-4">
              <h3 className="text-base font-bold text-live-900">
                「{selectedArtist}」に何回行ったか ユーザーランキング（全体）
              </h3>
              <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <Link href="/ranking/period?type=all#artist-search" className="font-bold text-live-600 hover:underline">
                  別のアーティストを選ぶ
                </Link>
                <Link
                  href={`/ranking/period?type=year&year=${currentYear}&artist=${encodeURIComponent(selectedArtist)}#artist-detail`}
                  className="font-bold text-live-600 hover:underline"
                >
                  {selectedArtist}の年別ランキングを見る
                </Link>
              </p>
              {usersByArtistAll.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">データはありません。</p>
              ) : (
                <ol className="mt-4 space-y-2">
                  {usersByArtistAll.map((e) => (
                    <li
                      key={`${e.rank}-${e.displayName}`}
                      className="flex items-center justify-between rounded-button border border-live-100 bg-white px-4 py-2"
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={
                            e.rank <= 3
                              ? "flex h-7 w-7 items-center justify-center rounded-full bg-live-100 text-sm font-bold text-live-800"
                              : "text-sm font-medium text-gray-500"
                          }
                        >
                          {e.rank}
                        </span>
                        <span className="font-bold text-gray-900">{e.displayName}</span>
                      </span>
                      <span className="text-sm font-bold text-live-600">
                        {e.count}
                        <span className="ml-0.5 text-gray-500">回</span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </CollapsibleSection>
      )}

      {isYear && (
        <CollapsibleSection id="artist-ranking" title={`${year}年「アーティスト」でユーザーランキングを見る`} className="mt-8">
          <p className="mt-0.5 text-sm text-gray-600">
            アーティスト名で検索するか、下の一覧から選ぶと、そのアーティストに何回行ったかのユーザー別ランキングが表示されます。
          </p>
          <p className="mt-1 text-xs text-live-600">
            <Link href="/ranking/period?type=all#artist-ranking" className="font-bold hover:underline">
              全体のアーティストランキングを見る
            </Link>
          </p>
          <div id="artist-search" className="mt-4 scroll-mt-4">
            <p className="mb-2 text-sm font-bold text-gray-700">アーティスト名で検索</p>
            <ArtistSearchYear year={year} selectedArtist={selectedArtist} />
          </div>
          {artistRanking.length > 0 && (
            <>
              <p className="mt-6 text-sm text-gray-600">または 行った回数が多い順の一覧から選択:</p>
              <ol className="mt-2 space-y-2">
            {artistRanking.map((e) => {
              const href = `/ranking/period?type=year&year=${year}&artist=${encodeURIComponent(e.artistName)}#artist-detail`;
              const isSelected = selectedArtist === e.artistName;
              return (
                <li key={`${e.rank}-${e.artistName}`}>
                  <Link
                    href={href}
                    className={`flex items-center justify-between gap-3 rounded-button border px-4 py-2 transition-colors ${
                      isSelected
                        ? "border-live-500 bg-live-100 text-live-900"
                        : "border-live-100 bg-surface-muted/50 hover:bg-live-50/50"
                    }`}
                  >
                    <span className="flex min-w-0 flex-1 items-center gap-3">
                      <span
                        className={
                          e.rank <= 3
                            ? "flex h-7 w-7 shrink-0 items-center justify-center rounded-full bg-live-100 text-sm font-bold text-live-800"
                            : "text-sm font-medium text-gray-500 shrink-0"
                        }
                      >
                        {e.rank}
                      </span>
                      <span className="truncate font-bold text-gray-900">{e.artistName}</span>
                    </span>
                    <span className="shrink-0 text-sm font-bold text-live-600 whitespace-nowrap">
                      {e.count}
                      <span className="ml-0.5 text-gray-500">回（合計）</span>
                    </span>
                  </Link>
                </li>
              );
            })}
          </ol>
            </>
          )}

          {selectedArtist && (
            <div id="artist-detail" className="mt-6 rounded-card border-2 border-live-200 bg-live-50/30 p-4 scroll-mt-4">
              <h3 className="text-base font-bold text-live-900">
                「{selectedArtist}」に何回行ったか ユーザーランキング（{year}年）
              </h3>
              <p className="mt-1 flex flex-wrap gap-x-4 gap-y-1 text-sm">
                <Link href={`/ranking/period?type=year&year=${year}#artist-search`} className="font-bold text-live-600 hover:underline">
                  別のアーティストを選ぶ
                </Link>
                <Link
                  href={`/ranking/period?type=all&artist=${encodeURIComponent(selectedArtist)}#artist-detail`}
                  className="font-bold text-live-600 hover:underline"
                >
                  {selectedArtist}の全体ランキングを見る
                </Link>
              </p>
              {usersByArtist.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">この年のデータはありません。</p>
              ) : (
                <ol className="mt-4 space-y-2">
                  {usersByArtist.map((e) => (
                    <li
                      key={`${e.rank}-${e.displayName}`}
                      className="flex items-center justify-between rounded-button border border-live-100 bg-white px-4 py-2"
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={
                            e.rank <= 3
                              ? "flex h-7 w-7 items-center justify-center rounded-full bg-live-100 text-sm font-bold text-live-800"
                              : "text-sm font-medium text-gray-500"
                          }
                        >
                          {e.rank}
                        </span>
                        <span className="font-bold text-gray-900">{e.displayName}</span>
                      </span>
                      <span className="text-sm font-bold text-live-600">
                        {e.count}
                        <span className="ml-0.5 text-gray-500">回</span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </CollapsibleSection>
      )}

      {(isAll || isYear) && (
        <CollapsibleSection id="venue-ranking" title="会場別（みんなが何回行ったか）" className="mt-8">
          <p className="mt-0.5 text-sm text-gray-500">
            {isAll ? "延べ公演数の多い会場（全体・最大20件）。" : `${year}年の延べ公演数の多い会場（最大20件）。`}
            会場名で検索するか一覧から選ぶと、その会場に何回行ったかのユーザーランキングが表示されます。
          </p>
          <div id="venue-search" className="mt-3 scroll-mt-4">
            <VenueRankingSearch
              initialVenues={venueVisitRanking}
              currentVenueId={venueId ?? null}
              basePath="/ranking/period"
              queryString={isAll ? "type=all" : `type=year&year=${year}`}
              periodLabel={periodLabel}
            />
          </div>
          {venueId && selectedVenueLabel && (
            <div id="venue-detail" className="mt-6 rounded-card border-2 border-live-200 bg-live-50/30 p-4 scroll-mt-4">
              <h3 className="text-base font-bold text-live-900">
                「{selectedVenueLabel}」に何回行ったか ユーザーランキング（{periodLabel}）
              </h3>
              <Link
                href={isAll ? "/ranking/period?type=all#venue-search" : `/ranking/period?type=year&year=${year}#venue-search`}
                className="mt-1 inline-block text-sm font-bold text-live-600 hover:underline"
              >
                別の会場を選ぶ
              </Link>
              {usersByVenue.length === 0 ? (
                <p className="mt-3 text-sm text-gray-500">この会場のデータはありません。</p>
              ) : (
                <ol className="mt-4 space-y-2">
                  {usersByVenue.map((e) => (
                    <li
                      key={`${e.rank}-${e.displayName}`}
                      className="flex items-center justify-between rounded-button border border-live-100 bg-white px-4 py-2"
                    >
                      <span className="flex items-center gap-3">
                        <span
                          className={
                            e.rank <= 3
                              ? "flex h-7 w-7 items-center justify-center rounded-full bg-live-100 text-sm font-bold text-live-800"
                              : "text-sm font-medium text-gray-500"
                          }
                        >
                          {e.rank}
                        </span>
                        <span className="font-bold text-gray-900">{e.displayName}</span>
                      </span>
                      <span className="text-sm font-bold text-live-600">
                        {e.count}
                        <span className="ml-0.5 text-gray-500">回</span>
                      </span>
                    </li>
                  ))}
                </ol>
              )}
            </div>
          )}
        </CollapsibleSection>
      )}

      <Link
        href="/ranking"
        className="mt-8 inline-block text-sm font-bold text-live-600 hover:underline"
      >
        ← ランキング（全体）へ戻る
      </Link>
    </>
  );
}
