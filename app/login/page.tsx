"use client";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "ok"; text: string } | null>(null);
  const router = useRouter();

  if (!isSupabaseConfigured()) {
    return (
      <main className="flex min-h-screen flex-col items-center justify-center p-8">
        <div className="w-full max-w-sm space-y-4 text-center">
          <h1 className="text-xl font-bold">ログイン</h1>
          <p className="text-sm text-gray-600">
            Supabase の環境変数（<code className="bg-gray-100 px-1">.env.local</code>）が設定されていません。<br />
            README の手順に従って設定してください。
          </p>
          <Link href="/" className="inline-block text-sm text-blue-600 hover:underline">トップへ戻る</Link>
        </div>
      </main>
    );
  }

  const supabase = createClient();

  async function handleSignUp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signUp({ email, password });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    setMessage({ type: "ok", text: "確認メールを送りました。リンクからログインしてください。" });
  }

  async function handleSignIn(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);
    const { error } = await supabase.auth.signInWithPassword({ email, password });
    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
      return;
    }
    router.push("/");
    router.refresh();
  }

  return (
    <main className="flex min-h-screen flex-col items-center justify-center bg-surface p-8">
      <div className="w-full max-w-sm space-y-6">
        <h1 className="text-xl font-bold text-center tracking-tight text-live-900">ログイン</h1>
        <form className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              メール
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              required
            />
          </div>
          <div>
            <label htmlFor="password" className="block text-sm font-medium text-gray-700">
              パスワード
            </label>
            <input
              id="password"
              type="password"
              value={password}
              onChange={(e) => setPassword(e.target.value)}
              className="mt-1 block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              required
            />
          </div>
          {message && (
            <p className={message.type === "error" ? "text-red-600 text-sm" : "text-green-600 text-sm"}>
              {message.text}
            </p>
          )}
          <div className="flex gap-2">
            <button
              type="submit"
              onClick={handleSignIn}
              disabled={loading}
              className="btn-primary flex-1 disabled:opacity-50"
            >
              ログイン
            </button>
            <button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="btn-secondary flex-1 disabled:opacity-50"
            >
              新規登録
            </button>
          </div>
        </form>
        <p className="text-center text-sm text-gray-500">
          <a href="/" className="font-bold text-live-600 underline hover:no-underline">トップへ戻る</a>
        </p>
      </div>
    </main>
  );
}
