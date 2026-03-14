"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { LogoutButton } from "@/components/LogoutButton";

const NAV_ITEMS = [
  { href: "/timeline", label: "タイムライン" },
  { href: "/record", label: "記録する" },
  { href: "/my", label: "マイ記録" },
  { href: "/ranking/period?type=all", label: "ランキング" },
  { href: "/friends", label: "友達" },
] as const;

export function AppLayout({
  user,
  isAdmin = false,
  children,
}: {
  user: { id: string } | null;
  isAdmin?: boolean;
  children: React.ReactNode;
}) {
  const pathname = usePathname();
  const [menuOpen, setMenuOpen] = useState(false);

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    const path = href.split("?")[0];
    return pathname === path || pathname.startsWith(path + "/");
  };

  const closeMenu = () => setMenuOpen(false);

  return (
    <div className="flex min-h-screen flex-col">
      {/* ヘッダー：常に上に固定・背景ぼかしで若者向けのすっきり感 */}
      <header className="sticky top-0 z-50 border-b border-live-100 bg-surface/90 backdrop-blur-md">
        <div className="mx-auto flex h-14 max-w-4xl items-center justify-between px-4">
          <Link href="/" className="text-lg font-bold tracking-tight text-live-900 transition-opacity hover:opacity-80">
            <motion.span whileHover={{ scale: 1.02 }} whileTap={{ scale: 0.98 }}>
              ライブ記録
            </motion.span>
          </Link>
          <div className="flex items-center gap-2">
            {user ? (
              <>
                <button
                  type="button"
                  onClick={() => setMenuOpen(true)}
                  className="flex h-10 w-10 items-center justify-center rounded-button text-gray-600 hover:bg-live-50 hover:text-live-700"
                  aria-label="メニューを開く"
                >
                  <span className="flex flex-col gap-1.5">
                    <span className="block h-0.5 w-5 rounded-full bg-current" />
                    <span className="block h-0.5 w-5 rounded-full bg-current" />
                    <span className="block h-0.5 w-5 rounded-full bg-current" />
                  </span>
                </button>
                <LogoutButton />
              </>
            ) : (
              <Link href="/login" className="btn-primary">
                <motion.span
                  className="inline-block"
                  whileHover={{ scale: 1.05 }}
                  whileTap={{ scale: 0.95 }}
                >
                  ログイン
                </motion.span>
              </Link>
            )}
          </div>
        </div>
      </header>

      {/* メニューオーバーレイ：右からスライド */}
      <AnimatePresence>
        {menuOpen && user && (
          <>
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              transition={{ duration: 0.15 }}
              className="fixed inset-0 z-50 bg-black/40 sm:bg-black/30"
              onClick={closeMenu}
              aria-hidden
            />
            <motion.nav
              initial={{ x: "100%" }}
              animate={{ x: 0 }}
              exit={{ x: "100%" }}
              transition={{ type: "tween", duration: 0.2 }}
              className="fixed right-0 top-0 z-50 flex h-full w-72 max-w-[85vw] flex-col border-l border-live-100 bg-surface shadow-xl"
              aria-label="メインメニュー"
            >
              <div className="flex h-14 items-center justify-between border-b border-live-100 px-4">
                <span className="text-sm font-bold text-live-900">メニュー</span>
                <button
                  type="button"
                  onClick={closeMenu}
                  className="flex h-10 w-10 items-center justify-center rounded-button text-gray-500 hover:bg-live-50 hover:text-live-700"
                  aria-label="メニューを閉じる"
                >
                  <span className="text-xl leading-none">×</span>
                </button>
              </div>
              <div className="flex flex-1 flex-col gap-0.5 overflow-y-auto p-2">
                {NAV_ITEMS.map(({ href, label }) => (
                  <Link
                    key={href}
                    href={href}
                    onClick={closeMenu}
                    className={`rounded-button px-4 py-3 text-left text-sm font-bold transition-colors ${
                      isActive(href)
                        ? "bg-live-100 text-live-800"
                        : "text-gray-700 hover:bg-live-50 hover:text-live-700"
                    }`}
                  >
                    {label}
                  </Link>
                ))}
                <div className="my-2 border-t border-live-100" />
                <Link
                  href="/profile"
                  onClick={closeMenu}
                  className={`rounded-button px-4 py-3 text-left text-sm font-bold transition-colors ${
                    pathname === "/profile"
                      ? "bg-live-100 text-live-800"
                      : "text-gray-700 hover:bg-live-50 hover:text-live-700"
                  }`}
                >
                  設定
                </Link>
                {isAdmin && (
                  <Link
                    href="/admin"
                    onClick={closeMenu}
                    className={`rounded-button px-4 py-3 text-left text-sm font-bold transition-colors ${
                      pathname === "/admin"
                        ? "bg-live-100 text-live-800"
                        : "text-gray-700 hover:bg-live-50 hover:text-live-700"
                    }`}
                  >
                    管理者画面
                  </Link>
                )}
              </div>
            </motion.nav>
          </>
        )}
      </AnimatePresence>

      {/* メイン */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-8 pt-6">
        {children}
      </main>
    </div>
  );
}
