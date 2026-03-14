import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/supabase/server";
import { isAdmin } from "@/lib/admin";
import { AdminReports } from "@/components/AdminReports";

export default async function AdminPage() {
  const user = await getOptionalUser();
  if (!user) redirect("/login");
  if (!(await isAdmin(user))) redirect("/");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold tracking-tight text-live-900">管理者画面</h1>
      <p className="text-sm text-gray-600">
        通報一覧を確認し、該当ユーザーを削除できます。削除したメールアドレスは再登録できません。
      </p>
      <AdminReports />
    </div>
  );
}
