"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { formatEventArtists } from "@/lib/eventArtists";

type RecentRow = {
  id: string;
  events: {
    id: string;
    event_date: string;
    title: string;
    artist_name: string | null;
    venues: { name: string; prefecture: string; city: string | null } | null;
    event_artists: Array<{ artist_name: string }> | null;
  } | null;
};

const HOME_RECENT_LIMIT = 5;

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.06, delayChildren: 0.1 },
  },
};

const item = {
  hidden: { opacity: 0, y: 12 },
  show: { opacity: 1, y: 0 },
};

type Props = {
  totalEvents: number;
  totalVenues: number;
  totalPrefectures: number;
  recentList: RecentRow[];
  totalCount: number;
};

export function HomeAuthenticated({
  totalEvents,
  totalVenues,
  totalPrefectures,
  recentList,
  totalCount,
}: Props) {
  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      transition={{ duration: 0.3 }}
      className="space-y-6"
    >
      <div>
        <motion.h1
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-2xl font-bold tracking-tight text-live-900"
        >
          ライブ記録
        </motion.h1>
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.08 }}
          className="mt-2 text-gray-600"
        >
          行ったライブを記録して、ランキングで自慢しよう。
        </motion.p>
      </div>

      {/* サマリカード */}
      <motion.div
        variants={container}
        initial="hidden"
        animate="show"
        className="grid grid-cols-3 gap-3"
      >
        {[
          { value: totalEvents, label: "公演" },
          { value: totalVenues, label: "会場" },
          { value: totalPrefectures, label: "都道府県" },
        ].map((stat, i) => (
          <motion.div
            key={stat.label}
            variants={item}
            className="card rounded-card text-center"
            whileHover={{ y: -2, transition: { duration: 0.2 } }}
          >
            <p className="text-2xl font-bold text-live-600">{stat.value}</p>
            <p className="mt-0.5 text-xs font-bold text-gray-600">{stat.label}</p>
          </motion.div>
        ))}
      </motion.div>

      {/* 直近の記録 */}
      <motion.h2
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        transition={{ delay: 0.25 }}
        className="text-lg font-bold text-live-900"
      >
        直近の記録
      </motion.h2>
      {recentList.length === 0 ? (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.3 }}
          className="mt-2 text-sm text-gray-500"
        >
          まだ記録がありません。「記録する」から追加しましょう。
        </motion.p>
      ) : (
        <motion.ul
          variants={container}
          initial="hidden"
          animate="show"
          className="mt-2 space-y-2"
        >
          {recentList.map((row) => {
            const e = row.events;
            if (!e) return null;
            const v = e.venues;
            const venueLabel = v
              ? `${v.name}（${v.prefecture}${v.city ? ` ${v.city}` : ""}）`
              : "—";
            return (
              <motion.li key={row.id} variants={item}>
                <Link href={`/my/record/${row.id}`} className="block">
                  <motion.div
                    className="card py-3"
                    whileHover={{ x: 4, transition: { duration: 0.2 } }}
                    whileTap={{ scale: 0.99 }}
                  >
                    <p className="font-bold text-gray-900">{e.title}</p>
                    {(e.artist_name || (e.event_artists && e.event_artists.length > 0)) && (
                      <p className="mt-0.5 text-sm text-live-700">
                        {formatEventArtists(e)}
                      </p>
                    )}
                    <p className="mt-0.5 text-sm text-gray-600">
                      {e.event_date} ／ {venueLabel}
                    </p>
                  </motion.div>
                </Link>
              </motion.li>
            );
          })}
        </motion.ul>
      )}
      {totalCount > HOME_RECENT_LIMIT && (
        <motion.p
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="mt-3"
        >
          <Link
            href="/my"
            className="text-sm font-bold text-live-600 hover:underline"
          >
            マイ記録で全件を見る →
          </Link>
        </motion.p>
      )}

      <motion.div
        initial={{ opacity: 0, y: 8 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ delay: 0.35 }}
        className="flex flex-wrap gap-3"
      >
        <Link href="/record" className="inline-block">
          <motion.span
            className="btn-primary inline-block"
            whileHover={{ scale: 1.03 }}
            whileTap={{ scale: 0.98 }}
          >
            記録する
          </motion.span>
        </Link>
        <Link href="/my" className="inline-block">
          <motion.span
            className="btn-secondary inline-block"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            マイ記録
          </motion.span>
        </Link>
        <Link href="/ranking" className="inline-block">
          <motion.span
            className="btn-secondary inline-block"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ランキング
          </motion.span>
        </Link>
        <Link href="/profile" className="inline-block">
          <motion.span
            className="btn-secondary inline-block"
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
          >
            ニックネーム設定
          </motion.span>
        </Link>
      </motion.div>
    </motion.div>
  );
}
