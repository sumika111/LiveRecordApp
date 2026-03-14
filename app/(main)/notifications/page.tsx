import { redirect } from "next/navigation";
import { getOptionalUser } from "@/lib/supabase/server";
import { NotificationsContent } from "@/components/NotificationsContent";

export default async function NotificationsPage() {
  const user = await getOptionalUser();
  if (!user) redirect("/login");

  return (
    <div className="space-y-6">
      <h1 className="text-xl font-bold tracking-tight text-live-900">通知</h1>
      <NotificationsContent />
    </div>
  );
}
