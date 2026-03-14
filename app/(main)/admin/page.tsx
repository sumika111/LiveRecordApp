import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { AdminTabs } from "@/components/AdminTabs";

export default async function AdminPage() {
  const user = await getOptionalUser();
  if (!user) redirect("/login");
  if (!(await isAdmin(user))) redirect("/");

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-xl font-bold tracking-tight text-live-900">管理者画面</h1>
        <p className="mt-1 text-sm text-gray-600">
          通報の確認・ユーザー削除と、ユーザーからの要望を確認できます。下のタブで切り替えてください。
        </p>
      </div>
      <AdminTabs />
    </div>
  );
}
