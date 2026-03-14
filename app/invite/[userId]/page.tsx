import Link from "next/link";
import { notFound } from "next/navigation";
import { getOptionalUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { toPublicDisplayName } from "@/lib/displayName";
import { AddFriendButton } from "@/components/AddFriendButton";
import { UserDisplay } from "@/components/UserDisplay";

type Params = { params: Promise<{ userId: string }> };

export default async function InvitePage({ params }: Params) {
  const { userId } = await params;
  const currentUser = await getOptionalUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name, avatar_url, bio")
    .eq("id", userId)
    .single();

  if (!profile) notFound();

  const displayName = toPublicDisplayName(profile.display_name);

  const alreadyFollowing =
    currentUser &&
    (await supabase
      .from("follows")
      .select("id")
      .eq("follower_id", currentUser.id)
      .eq("following_id", userId)
      .maybeSingle()).data;

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface px-4">
      <div className="w-full max-w-sm space-y-6 text-center">
        <h1 className="text-xl font-bold text-live-900">友達に追加</h1>
        <div className="flex justify-center">
          <UserDisplay
            displayName={profile.display_name ?? ""}
            avatarUrl={profile.avatar_url ?? null}
            bio={profile.bio ?? null}
            size="md"
          />
        </div>
        <p className="text-gray-600">さんを友達に追加しますか？</p>
        <p className="text-sm text-gray-500">
          追加すると、タイムラインでこの方の記録が見られます。
        </p>
        {!currentUser ? (
          <Link href="/login" className="btn-primary inline-block">
            ログインして友達に追加
          </Link>
        ) : currentUser.id === userId ? (
          <p className="text-sm text-gray-500">これはあなた自身のリンクです。</p>
        ) : alreadyFollowing ? (
          <p className="text-sm text-live-700 font-bold">すでに友達です</p>
        ) : (
          <AddFriendButton followingId={userId} displayName={toPublicDisplayName(profile.display_name)} />
        )}
        <p className="text-sm">
          <Link href="/" className="text-live-600 hover:underline">
            トップへ戻る
          </Link>
        </p>
      </div>
    </main>
  );
}
