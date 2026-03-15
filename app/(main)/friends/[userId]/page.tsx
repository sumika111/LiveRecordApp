import Link from "next/link";
import { redirect, notFound } from "next/navigation";
import { getOptionalUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { UserDisplay } from "@/components/UserDisplay";
import { ReportUserButtonWithPersistence } from "@/components/ReportUserButtonWithPersistence";
import { ArtistTagLink } from "@/components/ArtistTagLink";
import { getUserStats, getArtistRanking } from "@/lib/getUserStats";

type Props = { params: Promise<{ userId: string }>; searchParams: Promise<{ from?: string }> };

export default async function FriendDetailPage({ params, searchParams }: Props) {
  const { from } = await searchParams;
  const currentUser = await getOptionalUser();
  if (!currentUser) redirect("/login");

  const { userId } = await params;
  const supabase = await createClient();

  const isSelf = currentUser.id === userId;
  if (!isSelf) {
    const { data: follow } = await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUser.id)
      .eq("following_id", userId)
      .maybeSingle();
    if (!follow) notFound();
  }

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name, avatar_url, bio, favorite_artists")
    .eq("id", userId)
    .single();

  if (!profile) notFound();

  const [stats, artistRanking] = await Promise.all([
    getUserStats(supabase, userId),
    getArtistRanking(supabase, userId),
  ]);

  // 保存形式: "||" 区切り（スペース含むアーティスト名対応）。旧形式 " #a #b" も互換
  const raw = profile.favorite_artists ?? "";
  const favoriteTags: string[] = raw.includes("||")
    ? raw.split("||").map((s: string) => s.trim().replace(/^#+/, "")).filter((s: string) => s.length > 0)
    : raw.split(/\s+#/).map((s: string) => s.trim().replace(/^#+/, "")).filter((s: string) => s.length > 0);

  const backHref = from === "timeline" ? "/timeline" : "/friends";
  const backLabel = from === "timeline" ? "TLに戻る" : "友達一覧";

  return (
    <div className="space-y-6">
      <div className="flex items-center gap-2">
        <Link
          href={backHref}
          className="text-sm font-bold text-live-600 hover:text-live-700 hover:underline"
        >
          ← {backLabel}
        </Link>
      </div>

      <section className="rounded-card border border-live-200 bg-surface-card p-4">
        <div className="flex items-start justify-between gap-2">
          <UserDisplay
            displayName={profile.display_name ?? ""}
            avatarUrl={profile.avatar_url ?? null}
            bio={profile.bio ?? null}
            size="md"
          />
          {!isSelf && (
            <ReportUserButtonWithPersistence
              reportedUserId={userId}
              reportedDisplayName={profile.display_name ?? "このユーザー"}
            />
          )}
        </div>
      </section>

      {favoriteTags.length > 0 && (
        <section>
          <h2 className="text-sm font-bold text-gray-700">好きなアーティスト</h2>
          <div className="mt-2 flex flex-wrap gap-2">
            {favoriteTags.map((tag: string) => (
              <ArtistTagLink key={tag} artistName={tag} />
            ))}
          </div>
        </section>
      )}

      <section className="rounded-card border border-live-200 bg-surface-card p-4">
        <h2 className="text-sm font-bold text-gray-700">ランキング</h2>
        <div className="mt-3 grid grid-cols-2 gap-3 sm:grid-cols-4">
          <div className="rounded-lg bg-live-50 p-3 text-center">
            <p className="text-2xl font-bold text-live-700">{stats.totalEvents}</p>
            <p className="text-xs text-gray-600">公演数</p>
          </div>
          <div className="rounded-lg bg-live-50 p-3 text-center">
            <p className="text-2xl font-bold text-live-700">{stats.totalVenues}</p>
            <p className="text-xs text-gray-600">会場数</p>
          </div>
          <div className="rounded-lg bg-live-50 p-3 text-center">
            <p className="text-2xl font-bold text-live-700">{stats.totalPrefectures}</p>
            <p className="text-xs text-gray-600">都道府県数</p>
          </div>
          <div className="rounded-lg bg-live-50 p-3 text-center">
            <p className="text-2xl font-bold text-live-700">{stats.totalArtists}</p>
            <p className="text-xs text-gray-600">アーティスト数</p>
          </div>
        </div>

        {artistRanking.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-bold text-gray-700">行った回数が多いアーティスト（上位10）</h3>
            <ul className="mt-2 space-y-1">
              {artistRanking.slice(0, 10).map((entry, i) => (
                <li key={entry.name} className="flex items-center justify-between text-sm">
                  <span className="text-gray-700">
                    {i + 1}. {entry.name}
                  </span>
                  <span className="font-bold text-live-700">{entry.count}回</span>
                </li>
              ))}
            </ul>
          </>
        )}
      </section>

      {!isSelf && (
        <p className="text-sm text-gray-500">
          <Link href={`/timeline`} className="text-live-600 hover:underline">
            タイムライン
          </Link>
          でこの方の記録を確認できます。
        </p>
      )}
      {isSelf && (
        <Link href="/profile" className="btn-primary inline-block">
          設定でプロフィールを編集
        </Link>
      )}
    </div>
  );
}
