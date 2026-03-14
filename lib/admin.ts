import type { User } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

/** 現在のユーザーが管理者か（admins テーブルにメールが含まれるか） */
export async function isAdmin(user: User | null): Promise<boolean> {
  if (!user?.email) return false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("admins").select("email").eq("email", user.email.trim().toLowerCase()).maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}

/** このメールがBAN（削除済み）で再登録不可か */
export async function isEmailBanned(email: string | undefined | null): Promise<boolean> {
  if (!email?.trim()) return false;
  try {
    const supabase = await createClient();
    const { data } = await supabase.from("banned_emails").select("email").eq("email", email.trim().toLowerCase()).maybeSingle();
    return !!data;
  } catch {
    return false;
  }
}
