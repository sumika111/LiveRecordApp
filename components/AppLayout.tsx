"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { motion } from "framer-motion";
import { LogoutButton } from "@/components/LogoutButton";

const NAV_ITEMS = [
  { href: "/timeline", label: "タイムライン", short: "TL" },
  { href: "/record", label: "記録する", short: "記録" },
  { href: "/my", label: "マイ記録", short: "マイ" },
  { href: "/ranking", label: "ランキング", short: "ランキング" },
  { href: "/friends", label: "友達", short: "友達" },
] as const;

export function AppLayout({
  user,
  children,
}: {
  user: { id: string } | null;
  children: React.ReactNode;
}) {
  const pathname = usePathname();

  const isActive = (href: string) => {
    if (href === "/") return pathname === "/";
    return pathname === href || pathname.startsWith(href + "/");
  };

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
          <div className="flex items-center gap-3">
            {user ? (
              <>
                <nav className="hidden items-center gap-1 sm:flex">
                  {NAV_ITEMS.map(({ href, label }) => (
                    <Link
                      key={href}
                      href={href}
                      className={`rounded-button px-3 py-2 text-sm font-bold transition-colors ${
                        isActive(href)
                          ? "bg-live-100 text-live-800"
                          : "text-gray-600 hover:bg-live-50 hover:text-live-700"
                      }`}
                    >
                      <motion.span whileHover={{ scale: 1.05 }} whileTap={{ scale: 0.95 }}>
                        {label}
                      </motion.span>
                    </Link>
                  ))}
                </nav>
                <Link
                  href="/profile"
                  className={`hidden rounded-button px-3 py-2 text-sm font-bold sm:block ${
                    pathname === "/profile"
                      ? "bg-live-100 text-live-800"
                      : "text-gray-600 hover:bg-live-50 hover:text-live-700"
                  }`}
                >
                  設定
                </Link>
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

      {/* メイン：余白と最大幅で読みやすく */}
      <main className="mx-auto w-full max-w-4xl flex-1 px-4 pb-24 pt-6 sm:pb-8">
        {children}
      </main>

      {/* スマホ用ボトムナビ：親指で押しやすく・ずっと使いたくなる導線 */}
      {user && (
        <nav
          className="fixed bottom-0 left-0 right-0 z-40 border-t border-live-100 bg-surface/95 backdrop-blur-md sm:hidden"
          aria-label="メインメニュー"
        >
          <div className="mx-auto flex max-w-4xl items-center justify-around">
            {NAV_ITEMS.map(({ href, short }) => (
              <Link
                key={href}
                href={href}
                className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-bold transition-colors ${
                  isActive(href)
                    ? "text-live-600"
                    : "text-gray-500 hover:text-live-600"
                }`}
              >
                <span>{short}</span>
              </Link>
            ))}
            <Link
              href="/profile"
              className={`flex min-h-14 flex-1 flex-col items-center justify-center gap-0.5 py-2 text-xs font-bold transition-colors ${
                pathname === "/profile"
                  ? "text-live-600"
                  : "text-gray-500 hover:text-live-600"
              }`}
            >
              設定
            </Link>
          </div>
        </nav>
      )}
    </div>
  );
}
