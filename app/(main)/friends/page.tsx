import Link from "next/link";
import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/supabase/server";
import { createClient } from "@/lib/supabase/server";
import { FriendsList } from "@/components/FriendsList";
import { InviteLinkBlock } from "@/components/InviteLinkBlock";

export default async function FriendsPage() {
  const user = await getOptionalUser();
  if (!user) redirect("/login");

  const supabase = await createClient();
  const { data: followRows } = await supabase
    .from("follows")
    .select("following_id")
    .eq("follower_id", user.id);
  const followingIds = (followRows ?? []).map((r: { following_id: string }) => r.following_id);

  let list: Array<{ id: string; display_name: string }> = [];
  if (followingIds.length > 0) {
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name")
      .in("id", followingIds);
    list = (profiles ?? []).map((p: { id: string; display_name: string | null }) => ({
      id: p.id,
      display_name:
        p.display_name?.trim() && !p.display_name.includes("@") ? p.display_name.trim() : "匿名",
    }));
  }

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold tracking-tight text-live-900">友達</h1>
      <p className="text-sm text-gray-600">
        友達を追加すると、タイムラインでその人の記録が見られます。
      </p>

      <InviteLinkBlock myUserId={user.id} />

      <section>
        <h2 className="text-lg font-bold text-live-900">友達を検索して追加</h2>
        <FriendsList initialList={list} />
      </section>

      <div className="flex flex-wrap gap-3 pt-4">
        <Link href="/timeline" className="btn-primary">
          タイムラインを見る
        </Link>
        <Link href="/my" className="btn-secondary">
          マイ記録
        </Link>
      </div>
    </div>
  );
}
