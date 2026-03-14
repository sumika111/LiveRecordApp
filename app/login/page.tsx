"use client";

import { createClient, isSupabaseConfigured } from "@/lib/supabase/client";
import { useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { motion } from "framer-motion";

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
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
        className="w-full max-w-sm space-y-6"
      >
        <div className="overflow-hidden rounded-card bg-gradient-to-br from-live-100 via-live-50 to-surface-card p-6 text-center shadow-card">
          <motion.p
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm font-bold uppercase tracking-wider text-live-600"
          >
            はじめる
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 6 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-1 text-2xl font-bold tracking-tight text-live-900"
          >
            ログイン
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.2 }}
            className="mt-1 text-sm text-gray-600"
          >
            記録を始めよう
          </motion.p>
        </div>

        <motion.form
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.25 }}
          className="space-y-4"
        >
          <div>
            <label htmlFor="email" className="block text-sm font-medium text-gray-700">
              メール
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 block w-full rounded-button border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition-colors focus:border-live-400 focus:outline-none focus:ring-1 focus:ring-live-400"
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
              className="mt-1 block w-full rounded-button border border-gray-300 bg-white px-3 py-2.5 text-sm text-gray-900 transition-colors focus:border-live-400 focus:outline-none focus:ring-1 focus:ring-live-400"
              required
            />
          </div>
          {message && (
            <motion.p
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className={message.type === "error" ? "text-sm text-red-600" : "text-sm text-green-600"}
            >
              {message.text}
            </motion.p>
          )}
          <div className="flex gap-2 pt-1">
            <motion.button
              type="submit"
              onClick={handleSignIn}
              disabled={loading}
              className="btn-primary flex-1 disabled:opacity-50 flex items-center justify-center gap-2"
              whileHover={!loading ? { scale: 1.02 } : undefined}
              whileTap={!loading ? { scale: 0.98 } : undefined}
            >
              {loading && (
                <motion.span
                  animate={{ rotate: 360 }}
                  transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                  className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent"
                />
              )}
              ログイン
            </motion.button>
            <motion.button
              type="button"
              onClick={handleSignUp}
              disabled={loading}
              className="btn-secondary flex-1 disabled:opacity-50"
              whileHover={!loading ? { scale: 1.02 } : undefined}
              whileTap={!loading ? { scale: 0.98 } : undefined}
            >
              新規登録
            </motion.button>
          </div>
        </motion.form>

        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.35 }}
          className="text-center text-sm text-gray-500"
        >
          <Link href="/" className="font-bold text-live-600 underline hover:no-underline">
            トップへ戻る
          </Link>
        </motion.p>
      </motion.div>
    </main>
  );
}
