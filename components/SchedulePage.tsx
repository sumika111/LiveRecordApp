"use client";

import { useState, useEffect, useCallback, useRef } from "react";

export type ScheduleItem = {
  id: string;
  event_date: string;
  title: string;
  location: string | null;
  done: boolean;
  created_at: string;
  updated_at: string;
};

function formatDateLabel(dateStr: string): string {
  const [, m, d] = dateStr.split("-").map(Number);
  if (!m || !d) return dateStr;
  return `${m}/${d}`;
}

export function SchedulePage() {
  const [items, setItems] = useState<ScheduleItem[]>([]);
  const [loading, setLoading] = useState(true);
  const [selectedYear, setSelectedYear] = useState<string>("");
  const [modalOpen, setModalOpen] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formDate, setFormDate] = useState("");
  const [formTitle, setFormTitle] = useState("");
  const [formLocation, setFormLocation] = useState("");
  const [submitLoading, setSubmitLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [scheduleSuggestions, setScheduleSuggestions] = useState<{ titles: string[]; locations: string[] }>({ titles: [], locations: [] });
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [locationSuggestionsOpen, setLocationSuggestionsOpen] = useState(false);
  const [titleSuggestionsOpen, setTitleSuggestionsOpen] = useState(false);
  const titleSuggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  const fetchItems = useCallback(async () => {
    const res = await fetch("/api/schedules");
    const data = await res.json();
    if (!res.ok) {
      setItems([]);
      return;
    }
    setItems(data.items ?? []);
  }, []);

  useEffect(() => {
    setLoading(true);
    fetchItems().finally(() => setLoading(false));
  }, [fetchItems]);

  const years = [...new Set(items.map((i) => i.event_date.slice(0, 4)))].sort((a, b) => b.localeCompare(a));
  const effectiveYear = years.length > 0 && (selectedYear === "" || !years.includes(selectedYear)) ? years[0] : selectedYear;
  const filteredItems = effectiveYear ? items.filter((i) => i.event_date.startsWith(effectiveYear)) : items;
  const doneCountThisYear = filteredItems.filter((i) => i.done).length;

  const openAdd = () => {
    setEditingId(null);
    setFormDate("");
    setFormTitle("");
    setFormLocation("");
    setError(null);
    setTitleSuggestions([]);
    setTitleSuggestionsOpen(false);
    setLocationSuggestionsOpen(false);
    setModalOpen(true);
    fetch("/api/schedules/suggestions")
      .then((r) => r.json())
      .then((d) => setScheduleSuggestions({ titles: d.titles ?? [], locations: d.locations ?? [] }))
      .catch(() => {});
  };

  const openEdit = (item: ScheduleItem) => {
    setEditingId(item.id);
    setFormDate(item.event_date);
    setFormTitle(item.title);
    setFormLocation(item.location ?? "");
    setError(null);
    setTitleSuggestions([]);
    setTitleSuggestionsOpen(false);
    setLocationSuggestionsOpen(false);
    setModalOpen(true);
    fetch("/api/schedules/suggestions")
      .then((r) => r.json())
      .then((d) => setScheduleSuggestions({ titles: d.titles ?? [], locations: d.locations ?? [] }))
      .catch(() => {});
  };

  const closeModal = () => {
    setModalOpen(false);
    setEditingId(null);
    setError(null);
    setTitleSuggestionsOpen(false);
    setLocationSuggestionsOpen(false);
    if (titleSuggestTimerRef.current) clearTimeout(titleSuggestTimerRef.current);
  };

  const fetchTitleSuggestions = useCallback((query: string) => {
    const q = query.trim();
    if (!q) {
      setTitleSuggestions([]);
      setTitleSuggestionsOpen(false);
      return;
    }
    const fromSchedule = scheduleSuggestions.titles.filter((t) => t.toLowerCase().includes(q.toLowerCase())).slice(0, 10);
    fetch(`/api/artists/suggest?q=${encodeURIComponent(q)}`)
      .then((r) => r.json())
      .then((d: { suggestions?: string[] }) => {
        const fromArtists = d.suggestions ?? [];
        const merged = [...new Set([...fromArtists, ...fromSchedule])].slice(0, 15);
        setTitleSuggestions(merged);
        setTitleSuggestionsOpen(merged.length > 0);
      })
      .catch(() => {
        setTitleSuggestions(fromSchedule);
        setTitleSuggestionsOpen(fromSchedule.length > 0);
      });
  }, [scheduleSuggestions.titles]);

  const onTitleChange = (value: string) => {
    setFormTitle(value);
    if (titleSuggestTimerRef.current) clearTimeout(titleSuggestTimerRef.current);
    if (!value.trim()) {
      setTitleSuggestions([]);
      setTitleSuggestionsOpen(false);
      return;
    }
    titleSuggestTimerRef.current = setTimeout(() => fetchTitleSuggestions(value), 250);
  };

  const filteredLocationSuggestions = formLocation.trim()
    ? scheduleSuggestions.locations.filter((loc) =>
        loc.toLowerCase().includes(formLocation.trim().toLowerCase())
      ).slice(0, 10)
    : scheduleSuggestions.locations.slice(0, 10);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    const title = formTitle.trim();
    if (!title || submitLoading) return;
    if (!formDate) {
      setError("日付を入力してください");
      return;
    }
    setSubmitLoading(true);
    setError(null);
    try {
      if (editingId) {
        const res = await fetch(`/api/schedules/${editingId}`, {
          method: "PATCH",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_date: formDate,
            title,
            location: formLocation.trim() || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "更新に失敗しました");
        setItems((prev) =>
          prev
            .map((i) => (i.id === editingId ? { ...i, ...data } : i))
            .sort((a, b) => a.event_date.localeCompare(b.event_date) || a.created_at.localeCompare(b.created_at))
        );
      } else {
        const res = await fetch("/api/schedules", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            event_date: formDate,
            title,
            location: formLocation.trim() || null,
          }),
        });
        const data = await res.json();
        if (!res.ok) throw new Error(data.error ?? "追加に失敗しました");
        setItems((prev) => [...prev, data].sort((a, b) => a.event_date.localeCompare(b.event_date) || a.created_at.localeCompare(b.created_at)));
      }
      closeModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "エラーが発生しました");
    } finally {
      setSubmitLoading(false);
    }
  };

  const toggleDone = async (item: ScheduleItem) => {
    try {
      const res = await fetch(`/api/schedules/${item.id}`, {
        method: "PATCH",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ done: !item.done }),
      });
      const data = await res.json();
      if (!res.ok) throw new Error(data.error);
      setItems((prev) => prev.map((i) => (i.id === item.id ? { ...i, done: data.done } : i)));
    } catch {
      // ignore
    }
  };

  const handleDelete = async () => {
    if (!editingId || submitLoading) return;
    setSubmitLoading(true);
    setError(null);
    try {
      const res = await fetch(`/api/schedules/${editingId}`, { method: "DELETE" });
      if (!res.ok) {
        const data = await res.json();
        throw new Error(data.error ?? "削除に失敗しました");
      }
      setItems((prev) => prev.filter((i) => i.id !== editingId));
      closeModal();
    } catch (e) {
      setError(e instanceof Error ? e.message : "削除に失敗しました");
    } finally {
      setSubmitLoading(false);
    }
  };

  if (loading) {
    return (
      <div className="mt-6 flex justify-center py-8 text-gray-500">
        読み込み中…
      </div>
    );
  }

  return (
    <div className="mt-6">
      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          onClick={openAdd}
          className="rounded-button bg-live-600 px-4 py-2 text-sm font-bold text-white hover:bg-live-700"
        >
          予定を追加
        </button>
        {years.length > 0 && (
          <div className="flex items-center gap-2">
            <label htmlFor="schedule-year" className="text-sm font-bold text-gray-700">
              年度
            </label>
            <select
              id="schedule-year"
              value={effectiveYear}
              onChange={(e) => setSelectedYear(e.target.value)}
              className="rounded-button border border-gray-300 bg-white px-3 py-2 text-sm"
            >
              {years.map((y) => (
                <option key={y} value={y}>
                  {y}年
                </option>
              ))}
            </select>
            {effectiveYear && (
              <span className="text-sm text-gray-600">
                {effectiveYear}年は<strong className="text-live-700">{doneCountThisYear}</strong>回いった
              </span>
            )}
          </div>
        )}
      </div>

      {items.length === 0 ? (
        <p className="mt-6 text-gray-500">
          まだ予定がありません。「予定を追加」から追加してください。
        </p>
      ) : filteredItems.length === 0 ? (
        <p className="mt-6 text-gray-500">
          {effectiveYear}年の予定はありません。
        </p>
      ) : (
        <ul className="mt-6 space-y-2">
          {filteredItems.map((item) => (
            <li
              key={item.id}
              className="flex cursor-pointer items-center gap-3 rounded-card border border-live-100 bg-white p-3 hover:bg-live-50/50"
              onClick={() => openEdit(item)}
            >
              <button
                type="button"
                onClick={(e) => {
                  e.stopPropagation();
                  toggleDone(item);
                }}
                className="flex h-7 w-7 shrink-0 items-center justify-center rounded-full border-2 transition-colors"
                aria-label={item.done ? "未完了に戻す" : "行ったにする"}
                style={{
                  borderColor: item.done ? "#eab308" : "#d1d5db",
                  backgroundColor: item.done ? "#eab308" : "transparent",
                }}
              >
                {item.done && (
                  <svg className="h-4 w-4 text-white" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                    <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                  </svg>
                )}
              </button>
              <div className="min-w-0 flex-1">
                <span className={item.done ? "text-gray-500" : "font-medium text-live-900"}>
                  {formatDateLabel(item.event_date)} {item.title}
                  {item.location ? ` (${item.location})` : ""}
                </span>
              </div>
            </li>
          ))}
        </ul>
      )}

      {/* モーダル */}
      {modalOpen && (
        <>
          <div
            className="fixed inset-0 z-40 bg-black/40"
            onClick={closeModal}
            aria-hidden
          />
          <div className="fixed left-1/2 top-1/2 z-50 w-full max-w-md -translate-x-1/2 -translate-y-1/2 rounded-card border border-live-200 bg-white p-6 shadow-xl">
            <h2 className="text-lg font-bold text-live-900">
              {editingId ? "予定を編集" : "予定を追加"}
            </h2>
            <form onSubmit={handleSubmit} className="mt-4 space-y-4">
              <div>
                <label htmlFor="schedule-date" className="block text-sm font-bold text-gray-700">
                  日付
                </label>
                <input
                  id="schedule-date"
                  type="date"
                  value={formDate}
                  onChange={(e) => setFormDate(e.target.value)}
                  className="mt-1 w-full rounded-button border border-gray-300 px-3 py-2 text-sm"
                  required
                />
              </div>
              <div className="relative">
                <label htmlFor="schedule-title" className="block text-sm font-bold text-gray-700">
                  イベント名
                </label>
                <input
                  id="schedule-title"
                  type="text"
                  value={formTitle}
                  onChange={(e) => onTitleChange(e.target.value)}
                  onFocus={() => formTitle.trim() && fetchTitleSuggestions(formTitle)}
                  onBlur={() => setTimeout(() => setTitleSuggestionsOpen(false), 150)}
                  placeholder="例: Official 髭男 dism"
                  maxLength={200}
                  className="mt-1 w-full rounded-button border border-gray-300 px-3 py-2 text-sm"
                  required
                  autoComplete="off"
                />
                {titleSuggestionsOpen && titleSuggestions.length > 0 && (
                  <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-button border border-gray-200 bg-white py-1 shadow-lg">
                    {titleSuggestions.map((s) => (
                      <li key={s}>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-live-50"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFormTitle(s);
                            setTitleSuggestions([]);
                            setTitleSuggestionsOpen(false);
                          }}
                        >
                          {s}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="relative">
                <label htmlFor="schedule-location" className="block text-sm font-bold text-gray-700">
                  場所（任意）
                </label>
                <input
                  id="schedule-location"
                  type="text"
                  value={formLocation}
                  onChange={(e) => {
                    setFormLocation(e.target.value);
                    setLocationSuggestionsOpen(true);
                  }}
                  onFocus={() => setLocationSuggestionsOpen(true)}
                  onBlur={() => setTimeout(() => setLocationSuggestionsOpen(false), 150)}
                  placeholder="例: 東京"
                  maxLength={100}
                  className="mt-1 w-full rounded-button border border-gray-300 px-3 py-2 text-sm"
                  autoComplete="off"
                />
                {locationSuggestionsOpen && filteredLocationSuggestions.length > 0 && (
                  <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-auto rounded-button border border-gray-200 bg-white py-1 shadow-lg">
                    {filteredLocationSuggestions.map((loc) => (
                      <li key={loc}>
                        <button
                          type="button"
                          className="w-full px-3 py-2 text-left text-sm hover:bg-live-50"
                          onMouseDown={(e) => {
                            e.preventDefault();
                            setFormLocation(loc);
                            setLocationSuggestionsOpen(false);
                          }}
                        >
                          {loc}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              {error && (
                <p className="text-sm text-red-600">{error}</p>
              )}
              <div className="flex flex-wrap gap-2">
                <button
                  type="submit"
                  disabled={submitLoading}
                  className="rounded-button bg-live-600 px-4 py-2 text-sm font-bold text-white hover:bg-live-700 disabled:opacity-50"
                >
                  {submitLoading ? "保存中…" : "保存"}
                </button>
                <button
                  type="button"
                  onClick={closeModal}
                  className="rounded-button border border-gray-300 px-4 py-2 text-sm font-bold text-gray-700 hover:bg-gray-50"
                >
                  キャンセル
                </button>
                {editingId && (
                  <button
                    type="button"
                    onClick={handleDelete}
                    disabled={submitLoading}
                    className="rounded-button border border-red-200 px-4 py-2 text-sm font-bold text-red-600 hover:bg-red-50 disabled:opacity-50"
                  >
                    削除
                  </button>
                )}
              </div>
            </form>
          </div>
        </>
      )}
    </div>
  );
}
