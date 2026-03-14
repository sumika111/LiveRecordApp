import Link from "next/link";
import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { ProfileForm } from "@/components/ProfileForm";
import { getUserStats, getEarnedBadges } from "@/lib/getUserStats";

export default async function ProfilePage() {
  const user = await getOptionalUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const [profileRes, stats] = await Promise.all([
    supabase.from("profiles").select("display_name, avatar_url, bio, favorite_artists").eq("id", user.id).single(),
    getUserStats(supabase, user.id),
  ]);

  const profile = profileRes.data;
  const badges = getEarnedBadges(stats);

  return (
    <>
      <h1 className="text-xl font-bold tracking-tight text-live-900">
        設定
      </h1>

      {/* 実績 */}
      <section className="mt-6 rounded-card border border-live-200 bg-surface-card p-4">
        <h2 className="text-sm font-bold text-gray-700">あなたの実績</h2>
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
        {badges.length > 0 && (
          <>
            <h3 className="mt-4 text-sm font-bold text-gray-700">獲得バッジ</h3>
            <div className="mt-2 flex flex-wrap gap-2">
              {badges.map((label) => (
                <span
                  key={label}
                  className="inline-flex items-center rounded-full bg-live-200 px-3 py-1 text-xs font-bold text-live-800"
                >
                  {label}
                </span>
              ))}
            </div>
          </>
        )}
      </section>

      {/* シェア用カード */}
      <div className="mt-4">
        <Link
          href="/profile/share"
          className="inline-flex items-center rounded-card border border-live-200 bg-surface-muted px-4 py-3 text-sm font-bold text-live-700 transition-colors hover:bg-live-50"
        >
          シェア用カードを作成 →
        </Link>
      </div>

      {/* プロフィール（ニックネーム・アイコン・一言） */}
      <section className="mt-8">
        <h2 className="text-sm font-bold text-gray-700">プロフィール</h2>
        <p className="mt-1 text-sm text-gray-600">
          ニックネーム・アイコン・一言はランキングやタイムラインで表示されます。
        </p>
        <ProfileForm
          userId={user.id}
          initial={{
            display_name: profile?.display_name ?? null,
            avatar_url: profile?.avatar_url ?? null,
            bio: profile?.bio ?? null,
            favorite_artists: profile?.favorite_artists ?? null,
          }}
        />
      </section>

      <Link
        href="/"
        className="mt-6 inline-block text-sm font-bold text-live-600 hover:text-live-700 hover:underline"
      >
        ← トップへ戻る
      </Link>
    </>
  );
}
