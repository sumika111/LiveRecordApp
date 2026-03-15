"use client";

import { useState, useEffect, useRef } from "react";
import Link from "next/link";
import Image from "next/image";

type UserItem = { id: string; display_name: string; avatar_url: string | null };
type LikeCard = { attendance_id: string; title: string; count: number; lastAt: string; users: UserItem[] };
type CommentCard = { attendance_id: string; title: string; user_id: string; display_name: string; avatar_url: string | null; lastAt: string };

function Avatar({ src, name, size = "md" }: { src: string | null; name: string; size?: "sm" | "md" }) {
  const sizeClass = size === "md" ? "h-8 w-8" : "h-6 w-6";
  return (
    <div className={`relative shrink-0 overflow-hidden rounded-full bg-live-100 ${sizeClass}`}>
      {src?.trim() ? (
        <Image src={src.trim()} alt="" fill className="object-cover" sizes={size === "md" ? "32px" : "24px"} unoptimized />
      ) : (
        <span className="flex h-full w-full items-center justify-center text-xs font-bold text-live-700">
          {(name || "?").slice(0, 1)}
        </span>
      )}
    </div>
  );
}

const HIGHLIGHT_DURATION_MS = 4000;

export function NotificationsContent() {
  const [likes, setLikes] = useState<LikeCard[]>([]);
  const [comments, setComments] = useState<CommentCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<"likes" | "comments">("likes");
  const [expandedLikeId, setExpandedLikeId] = useState<string | null>(null);
  const [newLikeIds, setNewLikeIds] = useState<Set<string>>(new Set());
  const [newCommentKeys, setNewCommentKeys] = useState<Set<string>>(new Set());
  /** コメントタブを押したときにだけ表示する新着ハイライト用 */
  const [commentHighlightKeys, setCommentHighlightKeys] = useState<Set<string>>(new Set());
  const [unreadLikeCount, setUnreadLikeCount] = useState(0);
  const [unreadCommentCount, setUnreadCommentCount] = useState(0);
  const highlightCleared = useRef(false);
  const commentHighlightTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    let cancelled = false;
    fetch("/api/notifications/list")
      .then((r) => r.json())
      .then((data) => {
        if (cancelled) return;
        const likeList = data.likes ?? [];
        const commentList = data.comments ?? [];
        const readAt = data.read_at ?? null;
        setLikes(likeList);
        setComments(commentList);
        setUnreadLikeCount(data.likeCount ?? 0);
        setUnreadCommentCount(data.commentCount ?? 0);
        if (readAt) {
          const likeNew = new Set<string>();
          likeList.forEach((c: LikeCard) => {
            if (c.lastAt > readAt) likeNew.add(c.attendance_id);
          });
          setNewLikeIds(likeNew);
          const commentNew = new Set<string>();
          commentList.forEach((c: CommentCard) => {
            if (c.lastAt > readAt) commentNew.add(`${c.attendance_id}:${c.user_id}`);
          });
          setNewCommentKeys(commentNew);
        }
        return fetch("/api/notifications/read", { method: "PATCH" });
      })
      .catch(() => {})
      .finally(() => {
        if (!cancelled) setLoading(false);
      });
    return () => { cancelled = true; };
  }, []);

  useEffect(() => {
    if (loading || highlightCleared.current) return;
    const t = setTimeout(() => {
      setNewLikeIds(new Set());
      highlightCleared.current = true;
    }, HIGHLIGHT_DURATION_MS);
    return () => clearTimeout(t);
  }, [loading]);

  const handleCommentTabClick = () => {
    setActiveTab("comments");
    setUnreadLikeCount(0);
    setUnreadCommentCount(0);
    setCommentHighlightKeys(new Set(newCommentKeys));
    if (commentHighlightTimerRef.current) clearTimeout(commentHighlightTimerRef.current);
    commentHighlightTimerRef.current = setTimeout(() => {
      setCommentHighlightKeys(new Set());
      commentHighlightTimerRef.current = null;
    }, HIGHLIGHT_DURATION_MS);
  };

  useEffect(() => () => {
    if (commentHighlightTimerRef.current) clearTimeout(commentHighlightTimerRef.current);
  }, []);

  if (loading) return <p className="text-sm text-gray-500">読み込み中...</p>;

  const summaryText = (users: UserItem[], count: number, suffix: string) => {
    if (users.length === 0) return count > 0 ? `${count}人${suffix}` : "";
    const first = users[0].display_name;
    if (users.length === 1) return `${first}さん${suffix}`;
    return `${first}さん他${users.length - 1}人${suffix}`;
  };

  return (
    <div className="space-y-4">
      <div className="flex gap-1 border-b border-live-200">
        <button
          type="button"
          onClick={() => {
            setActiveTab("likes");
            setUnreadLikeCount(0);
            setUnreadCommentCount(0);
          }}
          className={`flex items-center gap-1.5 rounded-t-button px-4 py-2.5 text-sm font-bold transition-colors ${
            activeTab === "likes"
              ? "border border-b-0 border-live-200 bg-white text-live-800 -mb-px"
              : "text-gray-600 hover:bg-live-50 hover:text-live-700"
          }`}
        >
          いいね {likes.length > 0 && `(${likes.length})`}
          {unreadLikeCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
              {unreadLikeCount > 99 ? "99+" : unreadLikeCount}
            </span>
          )}
        </button>
        <button
          type="button"
          onClick={handleCommentTabClick}
          className={`flex items-center gap-1.5 rounded-t-button px-4 py-2.5 text-sm font-bold transition-colors ${
            activeTab === "comments"
              ? "border border-b-0 border-live-200 bg-white text-live-800 -mb-px"
              : "text-gray-600 hover:bg-live-50 hover:text-live-700"
          }`}
        >
          コメント {comments.length > 0 && `(${comments.length})`}
          {unreadCommentCount > 0 && (
            <span className="flex h-5 min-w-5 items-center justify-center rounded-full bg-red-500 px-1.5 text-xs font-bold text-white">
              {unreadCommentCount > 99 ? "99+" : unreadCommentCount}
            </span>
          )}
        </button>
      </div>

      {activeTab === "likes" && (
        <section>
          {likes.length === 0 ? (
            <p className="text-sm text-gray-500">いいねの通知はありません。</p>
          ) : (
            <ul className="space-y-2">
              {likes.map((card) => {
                const isExpanded = expandedLikeId === card.attendance_id;
                const text = summaryText(card.users, card.count, "がいいねしました");
                const isNew = newLikeIds.has(card.attendance_id);
                const firstUser = card.users[0];
                return (
                  <li
                    key={card.attendance_id}
                    className={`rounded-card border overflow-hidden transition-colors duration-300 ${
                      isNew ? "border-live-400 bg-live-100/80" : "border-live-200 bg-surface-card"
                    }`}
                  >
                    <Link
                      href={`/my/record/${card.attendance_id}?from=notifications`}
                      className="block p-3 hover:bg-live-50/50 transition-colors"
                    >
                      <p className="font-bold text-gray-900">{card.title}</p>
                      {text && (
                        <div className="mt-1.5 flex items-center gap-2 text-sm text-gray-600">
                          {firstUser && <Avatar src={firstUser.avatar_url} name={firstUser.display_name} size="md" />}
                          <span>{text}</span>
                        </div>
                      )}
                    </Link>
                    {card.users.length > 0 && (
                      <>
                        <button
                          type="button"
                          onClick={(e) => {
                            e.preventDefault();
                            setExpandedLikeId(isExpanded ? null : card.attendance_id);
                          }}
                          className="w-full px-3 py-2 text-left text-sm font-bold text-live-600 hover:bg-live-50 border-t border-live-100"
                        >
                          {isExpanded ? "△ 閉じる" : "▽ いいねした人を表示"}
                        </button>
                        {isExpanded && (
                          <div className="max-h-40 overflow-y-auto border-t border-live-100 bg-white px-3 py-2">
                            <ul className="space-y-2 text-sm text-gray-700">
                              {card.users.map((u) => (
                                <li key={u.id} className="flex items-center gap-2">
                                  <Avatar src={u.avatar_url} name={u.display_name} size={6} />
                                  <span>{u.display_name}</span>
                                </li>
                              ))}
                            </ul>
                          </div>
                        )}
                      </>
                    )}
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}

      {activeTab === "comments" && (
        <section>
          {comments.length === 0 ? (
            <p className="text-sm text-gray-500">コメントの通知はありません。</p>
          ) : (
            <ul className="space-y-2">
              {comments.map((card) => {
                const isNew = commentHighlightKeys.has(`${card.attendance_id}:${card.user_id}`);
                return (
                  <li
                    key={`${card.attendance_id}-${card.user_id}`}
                    className={`rounded-card border overflow-hidden transition-colors duration-300 ${
                      isNew ? "border-live-400 bg-live-100/80" : "border-live-200 bg-surface-card"
                    }`}
                  >
                    <Link
                      href={`/my/record/${card.attendance_id}?from=notifications`}
                      className="block p-3 hover:bg-live-50/50 transition-colors"
                    >
                      <p className="font-bold text-gray-900">{card.title}</p>
                      <div className="mt-1.5 flex items-center gap-2 text-sm text-gray-600">
                        <Avatar src={card.avatar_url} name={card.display_name} size="md" />
                        <span>{card.display_name}さんがコメントしました</span>
                      </div>
                    </Link>
                  </li>
                );
              })}
            </ul>
          )}
        </section>
      )}
    </div>
  );
}
