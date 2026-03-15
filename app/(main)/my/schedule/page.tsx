import Link from "next/link";
import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/supabase/server";
import { SchedulePage } from "@/components/SchedulePage";

export default async function MySchedulePage() {
  const user = await getOptionalUser();
  if (!user) redirect("/login");

  return (
    <>
      <p className="mb-2">
        <Link href="/my" className="text-sm font-bold text-live-600 hover:underline">
          ← マイ記録に戻る
        </Link>
      </p>
      <h1 className="text-xl font-bold tracking-tight text-live-900">今後の予定</h1>
      <p className="mt-1 text-sm text-gray-600">
        行きたいライブ・フェスをメモ。行ったらチェックを入れよう。
      </p>
      <SchedulePage />
    </>
  );
}
