"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";

export type MyListItem = {
  id: string;
  title: string;
  artistDisplay: string | null;
  eventDate: string;
  venueLabel: string;
  memo: string | null;
  photoUrl: string | null;
};

const container = {
  hidden: { opacity: 0 },
  show: {
    opacity: 1,
    transition: { staggerChildren: 0.04, delayChildren: 0.05 },
  },
};

const item = {
  hidden: { opacity: 0, y: 10 },
  show: { opacity: 1, y: 0 },
};

export function MyListItems({ items }: { items: MyListItem[] }) {
  return (
    <motion.ul
      variants={container}
      initial="hidden"
      animate="show"
      className="mt-4 space-y-3"
    >
      {items.map((row) => (
        <motion.li key={row.id} variants={item} className="relative">
          <motion.div
            className="card relative"
            whileHover={{ x: 2, transition: { duration: 0.2 } }}
            whileTap={{ scale: 0.995 }}
          >
            <div className="relative z-10 flex items-start gap-3">
              {row.photoUrl ? (
                <div className="relative h-14 w-14 shrink-0 overflow-hidden rounded-lg bg-surface-muted">
                  <Image
                    src={row.photoUrl}
                    alt=""
                    fill
                    className="object-cover"
                    sizes="56px"
                    unoptimized
                  />
                </div>
              ) : (
                <div className="h-14 w-14 shrink-0 rounded-lg bg-surface-muted" aria-hidden />
              )}
              <div className="min-w-0 flex-1">
                <p className="font-bold text-gray-900">{row.title}</p>
                {row.artistDisplay && (
                  <p className="mt-0.5 text-sm text-live-700">{row.artistDisplay}</p>
                )}
                <p className="mt-0.5 text-sm text-gray-600">
                  {row.eventDate} ／ {row.venueLabel}
                </p>
                {row.memo && (
                  <p className="mt-1 text-sm text-gray-500 line-clamp-1">{row.memo}</p>
                )}
              </div>
              <Link
                href={`/my/edit?id=${row.id}`}
                className="btn-secondary relative z-30 shrink-0 py-1.5 text-sm"
              >
                編集
              </Link>
            </div>
            <Link
              href={`/my/record/${row.id}`}
              className="absolute inset-0 z-20"
              aria-label="詳細を見る"
            />
          </motion.div>
        </motion.li>
      ))}
    </motion.ul>
  );
}
