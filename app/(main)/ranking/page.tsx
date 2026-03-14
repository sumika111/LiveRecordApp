import Link from "next/link";
import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { getRankings, getVenueVisitCountRanking, getUsersByVenueAndPeriod, getVenueDisplayLabel } from "@/lib/ranking";
import { VenueRankingSearch } from "@/components/VenueRankingSearch";
import { CollapsibleSection } from "@/components/CollapsibleSection";

type RankingPageParams = { searchParams: Promise<{ venue?: string }> };

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
        <p className="mt-4 text-gray-500">まだデータがありません。</p>
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

export default async function RankingPage({ searchParams }: RankingPageParams) {
  const user = await getOptionalUser();
  if (!user) redirect("/login");

  const { venue: venueId } = await searchParams;
  const supabase = await createClient();
  const { byEvents, byVenues, byPrefectures } = await getRankings(supabase);
  const venueVisitRanking = await getVenueVisitCountRanking(supabase);

  const selectedVenueLabel = venueId ? await getVenueDisplayLabel(supabase, venueId) : null;
  const usersByVenue = venueId ? await getUsersByVenueAndPeriod(supabase, venueId) : [];

  return (
    <>
      <h1 className="text-xl font-bold tracking-tight text-live-900">ランキング</h1>
      <p className="mt-1 text-sm text-gray-600">
        公演数・会場数・都道府県数（ユーザー別）のランキングです。表示名はニックネーム（未設定なら「匿名」）です。
      </p>
      <p className="mt-0.5 text-xs text-gray-500">
        <Link href="/profile" className="font-bold text-live-600 hover:underline">
          ニックネーム設定
        </Link>
        でランキングに表示する名前を変更できます。
      </p>
      <p className="mt-2">
        <Link
          href="/ranking/period?type=all"
          className="btn-secondary inline-block"
        >
          全体・月別・年別ランキングを見る
        </Link>
      </p>

      <div className="mt-8 grid gap-8 sm:grid-cols-2 lg:grid-cols-2">
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

      <CollapsibleSection title="会場別（みんなが何回行ったか）" className="mt-8">
        <p className="mt-0.5 text-sm text-gray-500">
          延べ公演数の多い会場（全体・最大20件）。会場名で検索するか一覧から選ぶと、その会場に何回行ったかのユーザーランキングが表示されます。
        </p>
        <div className="mt-3">
          <VenueRankingSearch
            initialVenues={venueVisitRanking}
            currentVenueId={venueId ?? null}
            basePath="/ranking"
            queryString=""
            periodLabel="全体"
          />
        </div>

        {venueId && selectedVenueLabel && (
          <div className="mt-6 rounded-card border-2 border-live-200 bg-live-50/30 p-4">
            <h3 className="text-base font-bold text-live-900">
              「{selectedVenueLabel}」に何回行ったか ユーザーランキング（全体）
            </h3>
            <Link
              href="/ranking"
              className="mt-1 inline-block text-sm font-bold text-live-600 hover:underline"
            >
              ← 別の会場を選ぶ
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

      <Link
        href="/"
        className="mt-8 inline-block text-sm font-bold text-live-600 hover:underline"
      >
        ← トップへ戻る
      </Link>
    </>
  );
}
