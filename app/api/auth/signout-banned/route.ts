import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/** BAN済みユーザーがアクセスしたときにセッションを消してログインへ */
export async function GET(request: Request) {
  const supabase = await createClient();
  await supabase.auth.signOut();
  const origin = new URL(request.url).origin;
  return NextResponse.redirect(`${origin}/login?banned=1`);
}
