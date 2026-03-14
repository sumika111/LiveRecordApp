import { createClient } from "@supabase/supabase-js";

/**
 * 管理者API用（ユーザー削除・banned_emails 追加・reports 一覧など）。
 * サーバー側の API Route でのみ使用し、SUPABASE_SERVICE_ROLE_KEY を必ず設定すること。
 */
export function createAdminClient() {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!url || !serviceRoleKey) {
    throw new Error("SUPABASE_SERVICE_ROLE_KEY is required for admin operations");
  }
  return createClient(url, serviceRoleKey, { auth: { persistSession: false } });
}
