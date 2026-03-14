"use client";

import { useState, useCallback, useEffect, useRef } from "react";

export type CommentWithAuthor = {
  id: string;
  attendance_id: string;
  user_id: string;
  parent_id: string | null;
  body: string;
  created_at: string;
  updated_at: string;
  display_name: string;
};

type Props = {
  attendanceId: string;
  currentUserId: string;
  /** 開く前に表示するコメント件数（タイムラインなどでサーバーから渡す） */
  initialCommentCount?: number;
  /** 詳細ページなどで初回からコメント欄を開いた状態にする */
  defaultOpen?: boolean;
};

export type CommentNode = {
  comment: CommentWithAuthor;
  children: CommentNode[];
};

function buildTree(comments: CommentWithAuthor[]): CommentNode[] {
  const byParent = new Map<string | null, CommentWithAuthor[]>();
  comments.forEach((c) => {
    const key = c.parent_id ?? "root";
    if (!byParent.has(key)) byParent.set(key, []);
    byParent.get(key)!.push(c);
  });
  function buildChildren(parentId: string): CommentNode[] {
    const list = (byParent.get(parentId) ?? []).sort(
      (a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime()
    );
    return list.map((comment) => ({
      comment,
      children: buildChildren(comment.id),
    }));
  }
  const roots = byParent.get("root") ?? [];
  return roots
    .sort((a, b) => new Date(a.created_at).getTime() - new Date(b.created_at).getTime())
    .map((comment) => ({ comment, children: buildChildren(comment.id) }));
}

function hasReplies(node: CommentNode): boolean {
  return node.children.length > 0 || node.children.some(hasReplies);
}

export function AttendanceComments({ attendanceId, currentUserId, initialCommentCount = 0, defaultOpen = false }: Props) {
  const [open, setOpen] = useState(defaultOpen);
  const [comments, setComments] = useState<CommentWithAuthor[] | null>(null);
  const [myReportIdsByComment, setMyReportIdsByComment] = useState<Map<string, string>>(new Map());
  const [loading, setLoading] = useState(false);
  const [posting, setPosting] = useState(false);
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [editId, setEditId] = useState<string | null>(null);
  const [editBody, setEditBody] = useState("");
  const [commentLikes, setCommentLikes] = useState<{ counts: Record<string, number>; likedIds: string[] }>({ counts: {}, likedIds: [] });
  const [likingCommentId, setLikingCommentId] = useState<string | null>(null);
  const hasScrolledToHash = useRef(false);

  const fetchMyReports = useCallback(async () => {
    try {
      const res = await fetch("/api/reports/mine");
      const data = await res.json();
      if (!res.ok || !data.reports) return;
      const map = new Map<string, string>();
      (data.reports as { id: string; comment_id: string | null }[]).forEach((r) => {
        if (r.comment_id) map.set(r.comment_id, r.id);
      });
      setMyReportIdsByComment(map);
    } catch {
      setMyReportIdsByComment(new Map());
    }
  }, []);

  const fetchComments = useCallback(async () => {
    setLoading(true);
    try {
      const [commentsRes, reportsRes, likesRes] = await Promise.all([
        fetch(`/api/attendances/${attendanceId}/comments`),
        fetch("/api/reports/mine"),
        fetch(`/api/attendances/${attendanceId}/comment-likes`),
      ]);
      const commentsData = await commentsRes.json();
      if (commentsRes.ok) setComments(Array.isArray(commentsData) ? commentsData : []);
      else setComments([]);

      const reportsData = await reportsRes.json();
      if (reportsRes.ok && reportsData.reports) {
        const map = new Map<string, string>();
        (reportsData.reports as { id: string; comment_id: string | null }[]).forEach((r) => {
          if (r.comment_id) map.set(r.comment_id, r.id);
        });
        setMyReportIdsByComment(map);
      }

      const likesData = await likesRes.json();
      if (likesRes.ok && likesData.counts && Array.isArray(likesData.likedIds)) {
        setCommentLikes({ counts: likesData.counts, likedIds: likesData.likedIds });
      } else {
        setCommentLikes({ counts: {}, likedIds: [] });
      }
    } catch {
      setComments([]);
    } finally {
      setLoading(false);
    }
  }, [attendanceId]);

  const onCommentLikeToggle = useCallback(async (commentId: string) => {
    setLikingCommentId(commentId);
    try {
      const res = await fetch("/api/comment-likes/toggle", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: commentId }),
      });
      const data = await res.json();
      if (res.ok) {
        setCommentLikes((prev) => {
          const liked = !!data.liked;
          const newLikedIds = liked
            ? [...prev.likedIds, commentId]
            : prev.likedIds.filter((id) => id !== commentId);
          return {
            counts: { ...prev.counts, [commentId]: data.count ?? 0 },
            likedIds: newLikedIds,
          };
        });
      }
    } finally {
      setLikingCommentId(null);
    }
  }, []);

  useEffect(() => {
    if (defaultOpen && open && comments === null) fetchComments();
  }, [defaultOpen, open, comments, fetchComments]);

  useEffect(() => {
    if (typeof window === "undefined" || !comments?.length || loading || hasScrolledToHash.current) return;
    const hash = window.location.hash?.replace(/^#/, "");
    if (!hash.startsWith("comment-")) return;
    const el = document.getElementById(hash);
    if (el) {
      hasScrolledToHash.current = true;
      el.scrollIntoView({ behavior: "smooth", block: "center" });
    }
  }, [comments, loading]);

  const onToggle = () => {
    if (!open && comments === null) fetchComments();
    setOpen((o) => !o);
  };

  const submitNew = async (body: string, parentId: string | null) => {
    if (!body.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/attendances/${attendanceId}/comments`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: body.trim(), parent_id: parentId }),
      });
      const data = await res.json();
      if (res.ok && data.id) {
        setComments((prev) => (prev ? [...prev, data] : [data]));
        setReplyTo(null);
      }
    } finally {
      setPosting(false);
    }
  };

  const saveEdit = async (commentId: string) => {
    if (!editBody.trim() || posting) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/attendances/${attendanceId}/comments/${commentId}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ body: editBody.trim() }),
      });
      if (res.ok) {
        const data = await res.json();
        setComments((prev) =>
          prev ? prev.map((c) => (c.id === commentId ? { ...c, body: data.body, updated_at: data.updated_at } : c)) : []
        );
        setEditId(null);
        setEditBody("");
      }
    } finally {
      setPosting(false);
    }
  };

  const deleteComment = async (commentId: string, hasReplies: boolean) => {
    const msg = hasReplies
      ? "このコメントを削除すると、下に付いている返信も一緒に削除されます。よろしいですか？"
      : "このコメントを削除しますか？";
    if (!confirm(msg)) return;
    setPosting(true);
    try {
      const res = await fetch(`/api/attendances/${attendanceId}/comments/${commentId}`, { method: "DELETE" });
      if (res.ok) {
        const removeIds = new Set<string>([commentId]);
        const collect = (list: CommentWithAuthor[], parentId: string) => {
          list.filter((c) => c.parent_id === parentId).forEach((c) => {
            removeIds.add(c.id);
            collect(list, c.id);
          });
        };
        setComments((prev) => {
          if (!prev) return [];
          collect(prev, commentId);
          return prev.filter((c) => !removeIds.has(c.id));
        });
        setEditId(null);
        setReplyTo(null);
      }
    } finally {
      setPosting(false);
    }
  };

  const list = comments ?? [];
  const tree = buildTree(list);
  const count = comments !== null ? list.length : initialCommentCount;

  return (
    <div className="mt-3 border-t border-live-100 pt-3">
      <button
        type="button"
        onClick={onToggle}
        className="text-sm font-bold text-live-600 hover:underline"
      >
        {open ? "コメントを閉じる" : `コメント${count > 0 ? ` (${count}件)` : ""}`}
      </button>

      {open && (
        <div className="mt-3 space-y-3">
          {loading ? (
            <p className="text-sm text-gray-500">読み込み中...</p>
          ) : (
            <>
              {/* 新規コメント入力 */}
              <CommentForm
                placeholder="コメントを書く..."
                onSubmit={(body) => submitNew(body, null)}
                posting={posting}
                onCancel={undefined}
              />

              {tree.length === 0 ? (
                <p className="text-sm text-gray-500">まだコメントはありません。</p>
              ) : (
                <ul className="space-y-3">
                  {tree.map((node) => (
                    <CommentNodeItem
                      key={node.comment.id}
                      node={node}
                      depth={0}
                      currentUserId={currentUserId}
                      posting={posting}
                      replyTo={replyTo}
                      setReplyTo={setReplyTo}
                      editId={editId}
                      setEditId={setEditId}
                      editBody={editBody}
                      setEditBody={setEditBody}
                      submitNew={submitNew}
                      saveEdit={saveEdit}
                      deleteComment={deleteComment}
                      getReportId={(commentId) => myReportIdsByComment.get(commentId)}
                      onReportsChange={fetchMyReports}
                      getLikeCount={(commentId) => commentLikes.counts[commentId] ?? 0}
                      isLiked={(commentId) => commentLikes.likedIds.includes(commentId)}
                      onCommentLikeToggle={onCommentLikeToggle}
                      likingCommentId={likingCommentId}
                    />
                  ))}
                </ul>
              )}
            </>
          )}
        </div>
      )}
    </div>
  );
}

function CommentNodeItem({
  node,
  depth,
  currentUserId,
  posting,
  replyTo,
  setReplyTo,
  editId,
  setEditId,
  editBody,
  setEditBody,
  submitNew,
  saveEdit,
  deleteComment,
  getReportId,
  onReportsChange,
  getLikeCount,
  isLiked,
  onCommentLikeToggle,
  likingCommentId,
}: {
  node: CommentNode;
  depth: number;
  currentUserId: string;
  posting: boolean;
  replyTo: string | null;
  setReplyTo: (id: string | null) => void;
  editId: string | null;
  setEditId: (id: string | null) => void;
  editBody: string;
  setEditBody: (s: string) => void;
  submitNew: (body: string, parentId: string | null) => void;
  saveEdit: (commentId: string) => void;
  deleteComment: (commentId: string, hasReplies: boolean) => void;
  getReportId: (commentId: string) => string | undefined;
  onReportsChange: () => void;
  getLikeCount: (commentId: string) => number;
  isLiked: (commentId: string) => boolean;
  onCommentLikeToggle: (commentId: string) => void;
  likingCommentId: string | null;
}) {
  const { comment, children } = node;
  const isReply = depth > 0;
  return (
    <li
      id={`comment-${comment.id}`}
      className={depth === 0 ? "rounded-button border border-live-100 bg-surface-muted/50 p-3" : undefined}
    >
      <CommentItem
        comment={comment}
        isOwn={comment.user_id === currentUserId}
        posting={posting}
        replyTo={replyTo}
        setReplyTo={setReplyTo}
        editId={editId}
        setEditId={setEditId}
        editBody={editBody}
        setEditBody={setEditBody}
        onReply={(body) => submitNew(body, comment.id)}
        onSaveEdit={() => saveEdit(comment.id)}
        onDelete={() => deleteComment(comment.id, hasReplies(node))}
        isReply={isReply}
        reportIdFromServer={getReportId(comment.id)}
        onReportsChange={onReportsChange}
        likeCount={getLikeCount(comment.id)}
        liked={isLiked(comment.id)}
        onCommentLikeToggle={onCommentLikeToggle}
        likingCommentId={likingCommentId}
      />
      {children.length > 0 && (
        <ul className="mt-2 ml-4 space-y-2 border-l-2 border-live-200 pl-3">
          {children.map((childNode) => (
            <CommentNodeItem
              key={childNode.comment.id}
              node={childNode}
              depth={depth + 1}
              currentUserId={currentUserId}
              posting={posting}
              replyTo={replyTo}
              setReplyTo={setReplyTo}
              editId={editId}
              setEditId={setEditId}
              editBody={editBody}
              setEditBody={setEditBody}
              submitNew={submitNew}
              saveEdit={saveEdit}
              deleteComment={deleteComment}
              getReportId={getReportId}
              onReportsChange={onReportsChange}
              getLikeCount={getLikeCount}
              isLiked={isLiked}
              onCommentLikeToggle={onCommentLikeToggle}
              likingCommentId={likingCommentId}
            />
          ))}
        </ul>
      )}
    </li>
  );
}

function CommentForm({
  placeholder,
  onSubmit,
  posting,
  onCancel,
}: {
  placeholder: string;
  onSubmit: (body: string) => void;
  posting: boolean;
  onCancel?: () => void;
}) {
  const [body, setBody] = useState("");
  const handleSubmit = (e: React.FormEvent) => {
    e.preventDefault();
    if (!body.trim()) return;
    onSubmit(body);
    setBody("");
  };
  return (
    <form onSubmit={handleSubmit} className="flex flex-col gap-2">
      <textarea
        value={body}
        onChange={(e) => setBody(e.target.value)}
        placeholder={placeholder}
        rows={2}
        className="w-full resize-y rounded-button border border-live-200 bg-white px-3 py-2 text-sm text-gray-900 placeholder:text-gray-500 focus:border-live-400 focus:outline-none"
        disabled={posting}
      />
      <div className="flex gap-2">
        <button type="submit" disabled={posting || !body.trim()} className="btn-primary text-sm">
          {posting ? "送信中..." : "送信"}
        </button>
        {onCancel && (
          <button type="button" onClick={onCancel} className="btn-secondary text-sm">
            キャンセル
          </button>
        )}
      </div>
    </form>
  );
}

function CommentItem({
  comment,
  isOwn,
  posting,
  replyTo,
  setReplyTo,
  editId,
  setEditId,
  editBody,
  setEditBody,
  onReply,
  onSaveEdit,
  onDelete,
  isReply = false,
  reportIdFromServer,
  onReportsChange,
  likeCount,
  liked,
  onCommentLikeToggle,
  likingCommentId,
}: {
  comment: CommentWithAuthor;
  isOwn: boolean;
  posting: boolean;
  replyTo: string | null;
  setReplyTo: (id: string | null) => void;
  editId: string | null;
  setEditId: (id: string | null) => void;
  editBody: string;
  setEditBody: (s: string) => void;
  onReply: (body: string) => void;
  onSaveEdit: () => void;
  onDelete: () => void;
  isReply?: boolean;
  reportIdFromServer?: string;
  onReportsChange?: () => void;
  likeCount: number;
  liked: boolean;
  onCommentLikeToggle: (commentId: string) => void;
  likingCommentId: string | null;
}) {
  const isEditing = editId === comment.id;
  const isReplying = replyTo === comment.id;

  const startEdit = () => {
    setEditId(comment.id);
    setEditBody(comment.body);
    setReplyTo(null);
  };
  const cancelEdit = () => {
    setEditId(null);
    setEditBody("");
  };

  return (
    <div className={isReply ? "text-sm" : ""}>
      <p className="font-bold text-gray-900">{comment.display_name}</p>
      <p className="mt-0.5 text-xs text-gray-500">
        {new Date(comment.created_at).toLocaleString("ja-JP", {
          year: "numeric",
          month: "short",
          day: "numeric",
          hour: "2-digit",
          minute: "2-digit",
        })}
        {comment.updated_at !== comment.created_at && "（編集済み）"}
      </p>
      {isEditing ? (
        <div className="mt-2">
          <textarea
            value={editBody}
            onChange={(e) => setEditBody(e.target.value)}
            rows={3}
            className="w-full resize-y rounded-button border border-live-200 bg-white px-3 py-2 text-sm text-gray-900 focus:border-live-400 focus:outline-none"
            disabled={posting}
          />
          <div className="mt-1 flex gap-2">
            <button
              type="button"
              onClick={() => onSaveEdit()}
              disabled={posting || !editBody.trim()}
              className="btn-primary text-sm"
            >
              保存
            </button>
            <button type="button" onClick={cancelEdit} className="btn-secondary text-sm">
              キャンセル
            </button>
          </div>
        </div>
      ) : (
        <p className="mt-0.5 whitespace-pre-wrap text-gray-800">{comment.body}</p>
      )}

      {!isEditing && (
        <div className="mt-1 flex flex-wrap items-center gap-2 text-xs">
          <button
            type="button"
            onClick={() => onCommentLikeToggle(comment.id)}
            disabled={likingCommentId === comment.id}
            className="inline-flex items-center gap-0.5 rounded-button px-1.5 py-0.5 font-bold text-gray-600 hover:bg-live-50 hover:text-live-700 disabled:opacity-50"
            aria-pressed={liked}
          >
            <span className={liked ? "text-red-500" : ""}>{liked ? "❤️" : "🤍"}</span>
            {likeCount > 0 && <span>{likeCount}</span>}
          </button>
          <button
            type="button"
            onClick={() => setReplyTo(isReplying ? null : comment.id)}
            className="font-bold text-live-600 hover:underline"
          >
            {isReplying ? "返信をやめる" : "返信"}
          </button>
          {isOwn && (
            <>
              <button type="button" onClick={startEdit} className="font-bold text-live-600 hover:underline">
                編集
              </button>
              <button type="button" onClick={onDelete} className="font-bold text-red-600 hover:underline">
                削除
              </button>
            </>
          )}
          {!isOwn && (
            <ReportCommentButton
              commentId={comment.id}
              reportIdFromServer={reportIdFromServer}
              onReportsChange={onReportsChange}
            />
          )}
        </div>
      )}

      {isReplying && (
        <div className="mt-2 ml-2">
          <CommentForm
            placeholder="返信を書く..."
            onSubmit={(body) => onReply(body)}
            posting={posting}
            onCancel={() => setReplyTo(null)}
          />
        </div>
      )}
    </div>
  );
}

function ReportCommentButton({
  commentId,
  reportIdFromServer,
  onReportsChange,
}: {
  commentId: string;
  reportIdFromServer?: string;
  onReportsChange?: () => void;
}) {
  const [modalOpen, setModalOpen] = useState(false);
  const [loading, setLoading] = useState(false);
  const [done, setDone] = useState(false);
  const [reportId, setReportId] = useState<string | null>(null);

  const effectiveReportId = reportId ?? reportIdFromServer ?? null;
  const effectiveDone = done || !!reportIdFromServer;

  async function submitReport() {
    setLoading(true);
    try {
      const res = await fetch("/api/reports", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ comment_id: commentId }),
      });
      const data = await res.json();
      if (res.ok && data.report_id) {
        setReportId(data.report_id);
        setDone(true);
        setModalOpen(false);
        onReportsChange?.();
      }
    } finally {
      setLoading(false);
    }
  }

  async function withdrawReport() {
    if (!effectiveReportId) return;
    setLoading(true);
    try {
      const res = await fetch(`/api/reports/${effectiveReportId}`, { method: "DELETE" });
      if (res.ok) {
        setDone(false);
        setReportId(null);
        onReportsChange?.();
      }
    } finally {
      setLoading(false);
    }
  }

  if (effectiveDone && effectiveReportId) {
    return (
      <span className="text-xs text-gray-500">
        通報しました
        <button
          type="button"
          onClick={withdrawReport}
          disabled={loading}
          className="ml-1 font-bold text-live-600 hover:underline disabled:opacity-50"
        >
          {loading ? "取り消し中..." : "取り消す"}
        </button>
      </span>
    );
  }
  return (
    <>
      <button
        type="button"
        onClick={() => setModalOpen(true)}
        disabled={loading}
        className="font-bold text-gray-500 hover:text-red-600 hover:underline disabled:opacity-50"
      >
        通報
      </button>
      {modalOpen && (
        <ReportConfirmModal
          onConfirm={submitReport}
          onCancel={() => setModalOpen(false)}
          loading={loading}
        />
      )}
    </>
  );
}

function ReportConfirmModal({
  onConfirm,
  onCancel,
  loading,
}: {
  onConfirm: () => void;
  onCancel: () => void;
  loading: boolean;
}) {
  return (
    <div
      className="fixed inset-0 z-[100] flex items-center justify-center bg-black/50 p-4"
      onClick={onCancel}
      aria-modal
      role="dialog"
      aria-labelledby="report-modal-title"
    >
      <div
        className="w-full max-w-md rounded-card border border-live-200 bg-surface-card p-5 shadow-xl"
        onClick={(e) => e.stopPropagation()}
      >
        <h2 id="report-modal-title" className="text-lg font-bold text-gray-900">
          このコメントを通報しますか？
        </h2>
        <p className="mt-3 text-sm text-gray-700">
          通報すると、<strong>管理者画面にこのコメントの内容と通報者情報が送られます</strong>。管理者が確認し、必要に応じて対応します。
        </p>
        <div className="mt-5 flex justify-end gap-2">
          <button
            type="button"
            onClick={onCancel}
            disabled={loading}
            className="btn-secondary disabled:opacity-50"
          >
            キャンセル
          </button>
          <button
            type="button"
            onClick={onConfirm}
            disabled={loading}
            className="btn-primary bg-red-600 hover:bg-red-700 disabled:opacity-50"
          >
            {loading ? "送信中..." : "通報する"}
          </button>
        </div>
      </div>
    </div>
  );
}
