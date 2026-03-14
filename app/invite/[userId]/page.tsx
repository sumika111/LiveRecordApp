import Link from "next/link";
import { notFound } from "next/navigation";
import { getOptionalUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { AddFriendButton } from "@/components/AddFriendButton";

type Params = { params: Promise<{ userId: string }> };

export default async function InvitePage({ params }: Params) {
  const { userId } = await params;
  const currentUser = await getOptionalUser();
  const supabase = await createClient();

  const { data: profile } = await supabase
    .from("profiles")
    .select("id, display_name")
    .eq("id", userId)
    .single();

  if (!profile) notFound();

  const displayName =
    profile.display_name?.trim() && !profile.display_name.includes("@")
      ? profile.display_name.trim()
      : "匿名";

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
        <p className="text-gray-600">
          <span className="font-bold text-live-800">{displayName}</span>
          さんを友達に追加しますか？
        </p>
        <p className="text-sm text-gray-500">
          追加すると、タイムラインで {displayName} さんの記録が見られます。
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
          <AddFriendButton followingId={userId} displayName={displayName} />
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
