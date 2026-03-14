import { NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { createAdminClient } from "@/lib/supabase/admin";
import { isAdmin } from "@/lib/admin";

/** 管理者用: 未読の通報・要望の件数（最後に管理者画面を開いた時刻より後） */
export async function GET() {
  const user = await createClient().then((c) => c.auth.getUser()).then((r) => r.data.user);
  if (!user) return NextResponse.json({ count: 0 });
  if (!(await isAdmin(user))) return NextResponse.json({ count: 0 });

  const admin = createAdminClient();
  const { data: profile } = await admin.from("profiles").select("admin_notification_read_at").eq("id", user.id).single();
  const readAt = profile?.admin_notification_read_at ?? "1970-01-01T00:00:00Z";

  const [reportsRes, requestsRes] = await Promise.all([
    admin.from("reports").select("id", { count: "exact", head: true }).gt("created_at", readAt),
    admin.from("admin_requests").select("id", { count: "exact", head: true }).gt("created_at", readAt),
  ]);

  const reportCount = reportsRes.count ?? 0;
  const requestCount = requestsRes.count ?? 0;
  const count = reportCount + requestCount;

  return NextResponse.json({
    count,
    reportCount,
    requestCount,
    read_at: profile?.admin_notification_read_at ?? null,
  });
}
