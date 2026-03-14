"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";

export function LogoutButton() {
  const router = useRouter();

  async function handleLogout() {
    const supabase = createClient();
    await supabase.auth.signOut();
    router.push("/");
    router.refresh();
  }

  return (
    <button
      type="button"
      onClick={handleLogout}
      className="rounded-button border-2 border-live-200 bg-white px-3 py-1.5 text-sm font-bold text-live-800 transition-all duration-200 hover:border-live-300 hover:bg-live-50 active:scale-[0.98]"
    >
      ログアウト
    </button>
  );
}
