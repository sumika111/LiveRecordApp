"use client";

import Link from "next/link";
import { motion } from "framer-motion";

export function HomeHero() {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.4 }}
      className="space-y-6"
    >
      <div className="relative overflow-hidden rounded-card bg-gradient-to-br from-live-100 via-live-50 to-surface-card p-6 shadow-card">
        <div className="relative z-10">
          <motion.p
            initial={{ opacity: 0, x: -8 }}
            animate={{ opacity: 1, x: 0 }}
            transition={{ delay: 0.1 }}
            className="text-sm font-bold uppercase tracking-wider text-live-600"
          >
            行ったライブ、全部残そう
          </motion.p>
          <motion.h1
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ delay: 0.15 }}
            className="mt-2 text-2xl font-bold tracking-tight text-live-900 sm:text-3xl"
          >
            ライブ記録
          </motion.h1>
          <motion.p
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ delay: 0.25 }}
            className="mt-2 text-gray-600"
          >
            公演ごとに記録して、ランキングで自慢。会場マップで思い出を振り返ろう。
          </motion.p>
        </div>
      </div>

      <motion.p
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.35 }}
        className="text-gray-600"
      >
        ログインすると、行ったライブを公演単位で記録できます。
      </motion.p>

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.4 }}
      >
        <Link href="/login" className="inline-block">
          <motion.span
            className="btn-primary inline-flex items-center gap-2 text-base"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            ログイン / 新規登録
          </motion.span>
        </Link>
      </motion.div>
    </motion.div>
  );
}
