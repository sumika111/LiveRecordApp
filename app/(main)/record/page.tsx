import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/supabase/server";
import { RecordForm } from "@/components/RecordForm";

export default async function RecordPage() {
  const user = await getOptionalUser();
  if (!user) redirect("/login");

  return (
    <>
      <h1 className="text-xl font-bold tracking-tight text-live-900">記録する</h1>
      <p className="mt-1 text-sm text-gray-600">
        会場を選んで、公演日と公演名を入力してください。
      </p>
      <div className="mt-6">
        <RecordForm userId={user.id} />
      </div>
    </>
  );
}
