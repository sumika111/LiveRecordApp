"use client";

import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import { useEffect, useState, useRef } from "react";
import Link from "next/link";
import { DatePickerPopover } from "@/components/DatePickerPopover";
import { useToast } from "@/components/Toast";
import { motion } from "framer-motion";

const PREFECTURES = [
  "北海道", "青森県", "岩手県", "宮城県", "秋田県", "山形県", "福島県",
  "茨城県", "栃木県", "群馬県", "埼玉県", "千葉県", "東京都", "神奈川県",
  "新潟県", "富山県", "石川県", "福井県", "山梨県", "長野県", "岐阜県",
  "静岡県", "愛知県", "三重県", "滋賀県", "京都府", "大阪府", "兵庫県",
  "奈良県", "和歌山県", "鳥取県", "島根県", "岡山県", "広島県", "山口県",
  "徳島県", "香川県", "愛媛県", "高知県", "福岡県", "佐賀県", "長崎県",
  "熊本県", "大分県", "宮崎県", "鹿児島県", "沖縄県",
];

type Venue = {
  id: string;
  name: string;
  prefecture: string;
  city: string | null;
  postal_code: string | null;
  address_detail: string | null;
};

export function RecordForm({ userId }: { userId: string }) {
  const router = useRouter();
  const toast = useToast();
  const [venues, setVenues] = useState<Venue[]>([]);
  const [loadingVenues, setLoadingVenues] = useState(true);
  const [search, setSearch] = useState("");
  const [selectedVenueId, setSelectedVenueId] = useState<string | null>(null);
  const [eventDate, setEventDate] = useState("");
  const [title, setTitle] = useState("");
  const [titleSuggestions, setTitleSuggestions] = useState<string[]>([]);
  const [titleSuggestionsOpen, setTitleSuggestionsOpen] = useState(false);
  const [loadingTitleSuggestions, setLoadingTitleSuggestions] = useState(false);
  const titleSuggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [eventType, setEventType] = useState<"one" | "festival" | "taiban">("one");
  const [artistName, setArtistName] = useState("");
  const [artistList, setArtistList] = useState<string[]>([""]);
  const [artistSuggestions, setArtistSuggestions] = useState<string[]>([]);
  const [artistSuggestionsOpen, setArtistSuggestionsOpen] = useState(false);
  const [focusedArtistIndex, setFocusedArtistIndex] = useState<number | null>(null);
  const [loadingArtistSuggestions, setLoadingArtistSuggestions] = useState(false);
  const artistSuggestTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);
  const [memo, setMemo] = useState("");
  const [showNewVenue, setShowNewVenue] = useState(false);
  const [newVenueName, setNewVenueName] = useState("");
  const [newVenuePrefecture, setNewVenuePrefecture] = useState("東京都");
  const [newVenueCity, setNewVenueCity] = useState("");
  const [newVenuePostalCode, setNewVenuePostalCode] = useState("");
  const [newVenueAddressDetail, setNewVenueAddressDetail] = useState("");
  const [postalCodeLoading, setPostalCodeLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "ok"; text: string } | null>(null);
  const [photoFile, setPhotoFile] = useState<File | null>(null);
  const [showEditVenueAddress, setShowEditVenueAddress] = useState(false);
  const [editVenueName, setEditVenueName] = useState("");
  const [editVenuePostalCode, setEditVenuePostalCode] = useState("");
  const [editVenuePrefecture, setEditVenuePrefecture] = useState("東京都");
  const [editVenueCity, setEditVenueCity] = useState("");
  const [editVenueAddressDetail, setEditVenueAddressDetail] = useState("");

  const supabase = createClient();

  async function loadVenues() {
    const { data, error } = await supabase
      .from("venues")
      .select("id, name, prefecture, city, postal_code, address_detail")
      .order("prefecture")
      .order("name");
    if (!error) setVenues(data ?? []);
  }

  useEffect(() => {
    let cancelled = false;
    async function load() {
      setLoadingVenues(true);
      await loadVenues();
      setLoadingVenues(false);
    }
    load();
    return () => { cancelled = true; };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  // 公演日が未入力なら今日で初期化（年・月のクイック選択とカレンダー用）
  useEffect(() => {
    if (eventDate) return;
    const t = new Date();
    setEventDate(
      `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, "0")}-${String(t.getDate()).padStart(2, "0")}`
    );
  }, [eventDate]);

  const filteredVenues = venues.filter(
    (v) =>
      v.name.toLowerCase().includes(search.toLowerCase()) ||
      v.prefecture.includes(search) ||
      (v.city?.includes(search) ?? false) ||
      (v.address_detail?.includes(search) ?? false)
  );
  const selectedVenue = venues.find((v) => v.id === selectedVenueId);

  function venueLabel(v: Venue) {
    const parts = [v.prefecture, v.city, v.address_detail].filter(Boolean);
    return parts.length ? `${v.name}（${parts.join(" ")})` : v.name;
  }

  async function handlePostalCodeSearch() {
    const zip = newVenuePostalCode.replace(/-/g, "").trim();
    if (zip.length !== 7) {
      setMessage({ type: "error", text: "郵便番号は7桁で入力してください。" });
      return;
    }
    setPostalCodeLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/postal-code?zip=${zip}`);
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "住所の取得に失敗しました。" });
        return;
      }
      setNewVenuePrefecture(data.prefecture ?? newVenuePrefecture);
      setNewVenueCity(data.city ?? "");
      setNewVenueAddressDetail(data.addressDetail ?? "");
    } catch {
      setMessage({ type: "error", text: "住所の取得に失敗しました。" });
    } finally {
      setPostalCodeLoading(false);
    }
  }

  function fetchArtistSuggestions(query: string) {
    if (!query.trim()) {
      setArtistSuggestions([]);
      return;
    }
    setLoadingArtistSuggestions(true);
    fetch(`/api/artists/suggest?q=${encodeURIComponent(query.trim())}`)
      .then((res) => res.json())
      .then((data: { suggestions?: string[] }) => {
        setArtistSuggestions(data.suggestions ?? []);
        setArtistSuggestionsOpen(true);
      })
      .catch(() => setArtistSuggestions([]))
      .finally(() => setLoadingArtistSuggestions(false));
  }

  function onArtistNameChange(value: string) {
    setArtistName(value);
    if (artistSuggestTimerRef.current) clearTimeout(artistSuggestTimerRef.current);
    if (value.trim().length < 1) {
      setArtistSuggestions([]);
      setArtistSuggestionsOpen(false);
      return;
    }
    artistSuggestTimerRef.current = setTimeout(() => fetchArtistSuggestions(value), 250);
  }

  function pickArtistSuggestion(s: string) {
    if (eventType === "one") {
      setArtistName(s);
    } else if (focusedArtistIndex !== null) {
      setArtistList((prev) => {
        const next = [...prev];
        next[focusedArtistIndex] = s;
        return next;
      });
    }
    setArtistSuggestions([]);
    setArtistSuggestionsOpen(false);
  }

  function fetchTitleSuggestions(query: string) {
    if (!query.trim()) {
      setTitleSuggestions([]);
      return;
    }
    setLoadingTitleSuggestions(true);
    fetch(`/api/titles/suggest?q=${encodeURIComponent(query.trim())}`)
      .then((res) => res.json())
      .then((data: { suggestions?: string[] }) => {
        setTitleSuggestions(data.suggestions ?? []);
        setTitleSuggestionsOpen(true);
      })
      .catch(() => setTitleSuggestions([]))
      .finally(() => setLoadingTitleSuggestions(false));
  }

  function onTitleChange(value: string) {
    setTitle(value);
    if (titleSuggestTimerRef.current) clearTimeout(titleSuggestTimerRef.current);
    if (value.trim().length < 1) {
      setTitleSuggestions([]);
      setTitleSuggestionsOpen(false);
      return;
    }
    titleSuggestTimerRef.current = setTimeout(() => fetchTitleSuggestions(value), 250);
  }

  function pickTitleSuggestion(s: string) {
    setTitle(s);
    setTitleSuggestions([]);
    setTitleSuggestionsOpen(false);
  }

  function addArtistRow() {
    setArtistList((prev) => [...prev, ""]);
  }

  function openEditVenueAddress() {
    if (!selectedVenue) return;
    setEditVenueName(selectedVenue.name);
    setEditVenuePostalCode(selectedVenue.postal_code ?? "");
    setEditVenuePrefecture(selectedVenue.prefecture);
    setEditVenueCity(selectedVenue.city ?? "");
    setEditVenueAddressDetail(selectedVenue.address_detail ?? "");
    setShowEditVenueAddress(true);
    setMessage(null);
  }

  async function handleEditVenueAddress(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVenueId) return;
    if (!editVenueName.trim()) {
      setMessage({ type: "error", text: "会場名を入力してください。" });
      return;
    }
    setSubmitting(true);
    setMessage(null);
    const payload = {
      name: editVenueName.trim(),
      postal_code: editVenuePostalCode.replace(/-/g, "").trim() || null,
      prefecture: editVenuePrefecture,
      city: editVenueCity.trim() || null,
      address_detail: editVenueAddressDetail.trim() || null,
    };
    const { data: updated, error } = await supabase
      .from("venues")
      .update(payload)
      .eq("id", selectedVenueId)
      .select("id, name, prefecture, city, postal_code, address_detail")
      .single();
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") {
        setMessage({ type: "error", text: "同じ会場名・都道府県の会場が既にあります。" });
      } else {
        setMessage({ type: "error", text: error.message });
      }
      return;
    }
    if (updated) {
      setVenues((prev) =>
        prev.map((v) => (v.id === selectedVenueId ? { ...v, ...updated } : v))
      );
    }
    await loadVenues();
    setShowEditVenueAddress(false);
    setMessage({ type: "ok", text: "会場を更新しました。" });
    fetch("/api/venues/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venueId: selectedVenueId }),
    }).catch(() => {});
  }

  async function searchPostalCodeForEdit() {
    const zip = editVenuePostalCode.replace(/-/g, "").trim();
    if (zip.length !== 7) {
      setMessage({ type: "error", text: "郵便番号は7桁で入力してください。" });
      return;
    }
    setPostalCodeLoading(true);
    setMessage(null);
    try {
      const res = await fetch(`/api/postal-code?zip=${zip}`);
      const data = await res.json();
      if (!res.ok) {
        setMessage({ type: "error", text: data.error ?? "住所の取得に失敗しました。" });
        return;
      }
      setEditVenuePrefecture(data.prefecture ?? editVenuePrefecture);
      setEditVenueCity(data.city ?? "");
      setEditVenueAddressDetail(data.addressDetail ?? "");
    } catch {
      setMessage({ type: "error", text: "住所の取得に失敗しました。" });
    } finally {
      setPostalCodeLoading(false);
    }
  }

  function onMultiArtistChange(index: number, value: string) {
    setArtistList((prev) => {
      const next = [...prev];
      next[index] = value;
      return next;
    });
    setFocusedArtistIndex(index);
    if (artistSuggestTimerRef.current) clearTimeout(artistSuggestTimerRef.current);
    if (value.trim().length < 1) {
      setArtistSuggestions([]);
      setArtistSuggestionsOpen(false);
      return;
    }
    artistSuggestTimerRef.current = setTimeout(() => fetchArtistSuggestions(value), 250);
  }

  async function handleAddVenue(e: React.FormEvent) {
    e.preventDefault();
    if (!newVenueName.trim()) return;
    setSubmitting(true);
    setMessage(null);
    const { data, error } = await supabase
      .from("venues")
      .insert({
        name: newVenueName.trim(),
        prefecture: newVenuePrefecture,
        city: newVenueCity.trim() || null,
        postal_code: newVenuePostalCode.replace(/-/g, "").trim() || null,
        address_detail: newVenueAddressDetail.trim() || null,
        created_by: userId,
      })
      .select("id, name, prefecture, city, postal_code, address_detail")
      .single();
    setSubmitting(false);
    if (error) {
      if (error.code === "23505") {
        setMessage({ type: "error", text: "同じ名前・都道府県の会場が既にあります。" });
      } else {
        setMessage({ type: "error", text: error.message });
      }
      return;
    }
    setVenues((prev) => [...prev, data]);
    setSelectedVenueId(data.id);
    setShowNewVenue(false);
    setNewVenueName("");
    setNewVenueCity("");
    setNewVenuePostalCode("");
    setNewVenueAddressDetail("");
    setMessage({ type: "ok", text: "会場を登録しました。" });
    fetch("/api/venues/geocode", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ venueId: data.id }),
    }).catch(() => {});
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    const artistNames =
      eventType === "one"
        ? artistName.trim()
          ? [artistName.trim()]
          : []
        : artistList.map((s) => s.trim()).filter(Boolean);
    if (
      !selectedVenueId ||
      !eventDate.trim() ||
      !title.trim() ||
      artistNames.length === 0
    ) {
      setMessage({
        type: "error",
        text:
          eventType === "one"
            ? "会場・日付・公演名・アーティスト名を入力してください。"
            : "会場・日付・公演名と、アーティストを1人以上入力してください。",
      });
      return;
    }
    setSubmitting(true);
    setMessage(null);

    const { data: existing } = await supabase
      .from("events")
      .select("id")
      .eq("venue_id", selectedVenueId)
      .eq("event_date", eventDate)
      .eq("title", title.trim())
      .maybeSingle();

    let eventId: string;
    if (existing?.id) {
      eventId = existing.id;
    } else {
      const { data: inserted, error: insertEventError } = await supabase
        .from("events")
        .insert({
          venue_id: selectedVenueId,
          event_date: eventDate,
          title: title.trim(),
          artist_name: artistNames[0],
          created_by: userId,
        })
        .select("id")
        .single();
      if (insertEventError) {
        setSubmitting(false);
        toast.error(insertEventError.message);
        setMessage({ type: "error", text: insertEventError.message });
        return;
      }
      eventId = inserted.id;
    }

    const { data: newAttendance, error: attendanceError } = await supabase
      .from("attendances")
      .insert({ user_id: userId, event_id: eventId })
      .select("id")
      .single();
    if (attendanceError) {
      setSubmitting(false);
      const msg =
        attendanceError.code === "23505"
          ? "この公演は既に記録済みです。"
          : attendanceError.message;
      toast.error(msg);
      setMessage({ type: "error", text: msg });
      return;
    }
    const attendanceId = newAttendance!.id;

    let photoUrl: string | null = null;
    if (photoFile && photoFile.size > 0) {
      const ext = photoFile.name.split(".").pop()?.toLowerCase() || "jpg";
      const safeExt = ["jpg", "jpeg", "png", "webp", "gif"].includes(ext) ? ext : "jpg";
      const path = `${userId}/${attendanceId}.${safeExt}`;
      const { error: uploadError } = await supabase.storage
        .from("attendance-photos")
        .upload(path, photoFile, { upsert: true });
      if (uploadError) {
        setSubmitting(false);
        toast.error("写真のアップロードに失敗しました。Storage バケット「attendance-photos」の設定を確認してください。");
        setMessage({ type: "error", text: uploadError.message });
        return;
      }
      const { data: urlData } = supabase.storage.from("attendance-photos").getPublicUrl(path);
      photoUrl = urlData.publicUrl;
    }
    const { error: updateAttError } = await supabase
      .from("attendances")
      .update({ memo: memo.trim() || null, photo_url: photoUrl })
      .eq("id", attendanceId);
    if (updateAttError) {
      setSubmitting(false);
      toast.error("楽しかったこと・写真の保存に失敗しました。");
      setMessage({ type: "error", text: updateAttError.message });
      return;
    }

    const existingArtists = await supabase
      .from("event_artists")
      .select("id")
      .eq("event_id", eventId);
    const hasExisting = (existingArtists.data?.length ?? 0) > 0;
    if (!hasExisting) {
      for (let i = 0; i < artistNames.length; i++) {
        await supabase.from("event_artists").insert({
          event_id: eventId,
          artist_name: artistNames[i],
          sort_order: i,
        });
      }
    }

    for (const name of artistNames) {
      await supabase
        .from("artists")
        .upsert({ name }, { onConflict: "name", ignoreDuplicates: true });
    }

    setSubmitting(false);
    toast.success("記録しました！");
    router.push("/my");
    router.refresh();
  }

  return (
    <div className="space-y-6">
      <form onSubmit={handleSubmit} className="space-y-4">
        {/* 会場 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            会場
          </label>
          {!showNewVenue ? (
            <>
              <input
                type="text"
                placeholder="会場名・都道府県・住所で検索"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                className="block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              />
              {loadingVenues ? (
                <p className="mt-1 text-sm text-gray-500">読み込み中...</p>
              ) : (
                <ul className="mt-1 max-h-40 overflow-y-auto rounded border border-gray-200 bg-white">
                  {filteredVenues.slice(0, 20).map((v) => (
                    <li key={v.id}>
                      <button
                        type="button"
                        onClick={() => {
                          setSelectedVenueId(v.id);
                          setSearch("");
                        }}
                        className={`w-full px-3 py-2 text-left text-sm font-medium transition-colors hover:bg-live-50 ${
                          selectedVenueId === v.id ? "bg-live-100 text-live-800" : ""
                        }`}
                      >
                        {venueLabel(v)}
                      </button>
                    </li>
                  ))}
                  {filteredVenues.length === 0 && !loadingVenues && (
                    <li className="px-3 py-2 text-sm text-gray-500">
                      該当なし
                    </li>
                  )}
                </ul>
              )}
              {selectedVenue && (
                <p className="mt-1 text-sm text-gray-600">
                  選択中: {venueLabel(selectedVenue)}
                </p>
              )}
              {selectedVenue && !showEditVenueAddress && (
                <button
                  type="button"
                  onClick={openEditVenueAddress}
                  className="mt-1 text-sm font-bold text-live-600 hover:underline"
                >
                  選択中の会場を変更
                </button>
              )}
              {showEditVenueAddress && selectedVenue && (
                <div className="mt-3 rounded-card border border-live-200 bg-surface-muted p-4 space-y-3">
                  <p className="text-sm font-medium text-gray-700">会場名・住所を変更</p>
                  <div className="space-y-3">
                    <div>
                      <label className="block text-xs text-gray-500 mb-0.5">会場名</label>
                      <input
                        type="text"
                        value={editVenueName}
                        onChange={(e) => setEditVenueName(e.target.value)}
                        placeholder="会場名"
                        className="block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                      />
                    </div>
                    <div className="flex gap-2 items-end">
                      <div className="flex-1">
                        <label className="block text-xs text-gray-500 mb-0.5">郵便番号（7桁）</label>
                        <input
                          type="text"
                          placeholder="例: 150-0043"
                          value={editVenuePostalCode}
                          onChange={(e) => setEditVenuePostalCode(e.target.value)}
                          className="block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                          maxLength={8}
                        />
                      </div>
                      <button
                        type="button"
                        onClick={searchPostalCodeForEdit}
                        disabled={postalCodeLoading || editVenuePostalCode.replace(/-/g, "").length !== 7}
                        className="btn-secondary py-2 px-3 text-sm whitespace-nowrap disabled:opacity-50"
                      >
                        {postalCodeLoading ? "検索中..." : "住所を検索"}
                      </button>
                    </div>
                    <select
                      value={editVenuePrefecture}
                      onChange={(e) => setEditVenuePrefecture(e.target.value)}
                      className="block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                    >
                      {PREFECTURES.map((p) => (
                        <option key={p} value={p}>{p}</option>
                      ))}
                    </select>
                    <input
                      type="text"
                      placeholder="市区町村（例: 渋谷区）"
                      value={editVenueCity}
                      onChange={(e) => setEditVenueCity(e.target.value)}
                      className="block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                    />
                    <input
                      type="text"
                      placeholder="町域・番地・建物名（任意）"
                      value={editVenueAddressDetail}
                      onChange={(e) => setEditVenueAddressDetail(e.target.value)}
                      className="block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                    />
                    <div className="flex gap-2">
                      <button
                        type="button"
                        onClick={() => setShowEditVenueAddress(false)}
                        className="btn-secondary py-1.5 text-sm"
                      >
                        キャンセル
                      </button>
                      <button
                        type="button"
                        disabled={submitting}
                        onClick={(e) => {
                          e.preventDefault();
                          handleEditVenueAddress(e as unknown as React.FormEvent);
                        }}
                        className="btn-primary py-1.5 text-sm disabled:opacity-50"
                      >
                        {submitting ? "保存中..." : "会場を保存"}
                      </button>
                    </div>
                  </div>
                </div>
              )}
              <button
                type="button"
                onClick={() => setShowNewVenue(true)}
                className="mt-2 text-sm font-bold text-live-600 hover:underline"
              >
                ＋ 会場を新規登録
              </button>
            </>
          ) : (
            <div className="rounded-card border border-live-200 bg-surface-muted p-4 space-y-3">
              <p className="text-sm font-medium text-gray-700">会場を登録（名前と住所）</p>
              <input
                type="text"
                placeholder="会場名（必須）"
                value={newVenueName}
                onChange={(e) => setNewVenueName(e.target.value)}
                className="block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              />
              <div className="flex gap-2 items-end">
                <div className="flex-1">
                  <label className="block text-xs text-gray-500 mb-0.5">郵便番号（7桁）</label>
                  <input
                    type="text"
                    placeholder="例: 150-0043"
                    value={newVenuePostalCode}
                    onChange={(e) => setNewVenuePostalCode(e.target.value)}
                    className="block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                    maxLength={8}
                  />
                </div>
                <button
                  type="button"
                  onClick={handlePostalCodeSearch}
                  disabled={postalCodeLoading || newVenuePostalCode.replace(/-/g, "").length !== 7}
                  className="btn-secondary py-2 px-3 text-sm whitespace-nowrap disabled:opacity-50"
                >
                  {postalCodeLoading ? "検索中..." : "住所を検索"}
                </button>
              </div>
              <select
                value={newVenuePrefecture}
                onChange={(e) => setNewVenuePrefecture(e.target.value)}
                className="block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              >
                {PREFECTURES.map((p) => (
                  <option key={p} value={p}>{p}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="市区町村（例: 渋谷区）"
                value={newVenueCity}
                onChange={(e) => setNewVenueCity(e.target.value)}
                className="block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              />
              <input
                type="text"
                placeholder="町域・番地・建物名（任意）"
                value={newVenueAddressDetail}
                onChange={(e) => setNewVenueAddressDetail(e.target.value)}
                className="block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              />
              <div className="flex gap-2">
                <button
                  type="button"
                  onClick={() => {
                    setShowNewVenue(false);
                    setNewVenueName("");
                    setNewVenueCity("");
                    setNewVenuePostalCode("");
                    setNewVenueAddressDetail("");
                  }}
                  className="btn-secondary py-1.5 text-sm"
                >
                  キャンセル
                </button>
                <button
                  type="button"
                  onClick={handleAddVenue}
                  disabled={submitting || !newVenueName.trim()}
                  className="btn-primary py-1.5 text-sm disabled:opacity-50"
                >
                  登録
                </button>
              </div>
            </div>
          )}
        </div>

        {/* 日付（画像のようなポップアップ: 〇年〇月プルダウン + カレンダー + OK） */}
        <div>
          <label htmlFor="event_date" className="block text-sm font-medium text-gray-700 mb-1">
            公演日
          </label>
          <DatePickerPopover
            id="event_date"
            value={eventDate}
            onChange={setEventDate}
            className="block w-full"
          />
        </div>

        {/* 公演タイプ */}
        <div>
          <p className="block text-sm font-medium text-gray-700 mb-2">公演タイプ</p>
          <div className="flex flex-wrap gap-4">
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="event_type"
                checked={eventType === "one"}
                onChange={() => setEventType("one")}
                className="text-live-600"
              />
              <span className="text-sm font-medium">ワンマン</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="event_type"
                checked={eventType === "festival"}
                onChange={() => {
                  setEventType("festival");
                  setArtistList(artistName.trim() ? [artistName.trim()] : [""]);
                }}
                className="text-live-600"
              />
              <span className="text-sm font-medium">フェス</span>
            </label>
            <label className="flex cursor-pointer items-center gap-2">
              <input
                type="radio"
                name="event_type"
                checked={eventType === "taiban"}
                onChange={() => {
                  setEventType("taiban");
                  setArtistList(artistName.trim() ? [artistName.trim()] : [""]);
                }}
                className="text-live-600"
              />
              <span className="text-sm font-medium">対バン</span>
            </label>
          </div>
        </div>

        {/* 公演名（過去の記録から検索して選択可能） */}
        <div>
          <label htmlFor="title" className="block text-sm font-medium text-gray-700 mb-1">
            公演名
          </label>
          <div className="relative">
            <input
              id="title"
              type="text"
              placeholder="例: 〇〇ツアー、ワンマンライブ（入力で過去の公演名を検索）"
              value={title}
              onChange={(e) => onTitleChange(e.target.value)}
              onFocus={() => titleSuggestions.length > 0 && setTitleSuggestionsOpen(true)}
              onBlur={() => setTimeout(() => setTitleSuggestionsOpen(false), 150)}
              required
              className="block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
              autoComplete="off"
            />
            {titleSuggestionsOpen && (titleSuggestions.length > 0 || loadingTitleSuggestions) && (
              <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded border border-live-200 bg-white shadow-card">
                {loadingTitleSuggestions ? (
                  <li className="px-3 py-2 text-sm text-gray-500">検索中...</li>
                ) : (
                  titleSuggestions.map((s) => (
                    <li key={s}>
                      <button
                        type="button"
                        onClick={() => pickTitleSuggestion(s)}
                        className="w-full px-3 py-2 text-left text-sm font-medium text-gray-900 hover:bg-live-50"
                      >
                        {s}
                      </button>
                    </li>
                  ))
                )}
              </ul>
            )}
          </div>
        </div>

        {/* アーティスト名 */}
        <div>
          {eventType === "one" ? (
            <>
              <label htmlFor="artist_name" className="block text-sm font-medium text-gray-700 mb-1">
                アーティスト名
              </label>
              <div className="relative">
                <input
                  id="artist_name"
                  type="text"
                  placeholder="例: 〇〇（バンド名・アーティスト名）"
                  value={artistName}
                  onChange={(e) => onArtistNameChange(e.target.value)}
                  onFocus={() => artistSuggestions.length > 0 && setArtistSuggestionsOpen(true)}
                  onBlur={() => setTimeout(() => setArtistSuggestionsOpen(false), 150)}
                  required={eventType === "one"}
                  className="block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                  autoComplete="off"
                />
                {artistSuggestionsOpen && (artistSuggestions.length > 0 || loadingArtistSuggestions) && (
                  <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded border border-live-200 bg-white shadow-card">
                    {loadingArtistSuggestions ? (
                      <li className="px-3 py-2 text-sm text-gray-500">検索中...</li>
                    ) : (
                      artistSuggestions.map((s) => (
                        <li key={s}>
                          <button
                            type="button"
                            onClick={() => pickArtistSuggestion(s)}
                            className="w-full px-3 py-2 text-left text-sm font-medium text-gray-900 hover:bg-live-50"
                          >
                            {s}
                          </button>
                        </li>
                      ))
                    )}
                  </ul>
                )}
              </div>
            </>
          ) : (
            <>
              <label className="block text-sm font-medium text-gray-700 mb-1">
                {eventType === "festival" ? "見たアーティスト" : "出演アーティスト"}
              </label>
              <p className="mb-2 text-xs text-gray-500">
                1欄に1アーティスト。追加するときは「＋ アーティストを追加」を押してください。
              </p>
              <div className="space-y-2">
                {artistList.map((value, index) => (
                  <div key={index} className="relative">
                    <input
                      type="text"
                      placeholder="アーティスト名"
                      value={value}
                      onChange={(e) => onMultiArtistChange(index, e.target.value)}
                      onFocus={() => {
                        setFocusedArtistIndex(index);
                        if (artistSuggestions.length > 0) setArtistSuggestionsOpen(true);
                      }}
                      onBlur={() => setTimeout(() => setArtistSuggestionsOpen(false), 150)}
                      className="block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
                      autoComplete="off"
                    />
                    {focusedArtistIndex === index &&
                      artistSuggestionsOpen &&
                      (artistSuggestions.length > 0 || loadingArtistSuggestions) && (
                        <ul className="absolute z-10 mt-1 max-h-40 w-full overflow-y-auto rounded border border-live-200 bg-white shadow-card">
                          {loadingArtistSuggestions ? (
                            <li className="px-3 py-2 text-sm text-gray-500">検索中...</li>
                          ) : (
                            artistSuggestions.map((s) => (
                              <li key={s}>
                                <button
                                  type="button"
                                  onClick={() => pickArtistSuggestion(s)}
                                  className="w-full px-3 py-2 text-left text-sm font-medium text-gray-900 hover:bg-live-50"
                                >
                                  {s}
                                </button>
                              </li>
                            ))
                          )}
                        </ul>
                      )}
                  </div>
                ))}
              </div>
              <button
                type="button"
                onClick={addArtistRow}
                className="mt-2 text-sm font-bold text-live-600 hover:underline"
              >
                ＋ アーティストを追加
              </button>
            </>
          )}
          <p className="mt-0.5 text-xs text-gray-500">
            ランキング「行った回数が多いアーティスト」の集計に使います。
          </p>
        </div>

        {/* 思い出の写真1枚 */}
        <div>
          <label className="block text-sm font-medium text-gray-700 mb-1">
            思い出の写真（1枚・任意）
          </label>
          <p className="mt-0.5 text-xs text-gray-500 mb-2">
            スマホでは写真ライブラリから、Macでは写真.app からドラッグ＆ドロップもできます。
          </p>
          <div
            className="rounded-button border-2 border-dashed border-gray-300 bg-surface-muted/50 p-4 text-center transition-colors hover:border-live-300 hover:bg-live-50/30"
            onDragOver={(e) => {
              e.preventDefault();
              e.currentTarget.classList.add("border-live-400", "bg-live-50/50");
            }}
            onDragLeave={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("border-live-400", "bg-live-50/50");
            }}
            onDrop={(e) => {
              e.preventDefault();
              e.currentTarget.classList.remove("border-live-400", "bg-live-50/50");
              const file = e.dataTransfer.files[0];
              if (file && file.type.startsWith("image/")) setPhotoFile(file);
            }}
          >
            <input
              id="photo-upload"
              type="file"
              accept="image/*"
              className="sr-only"
              onChange={(e) => setPhotoFile(e.target.files?.[0] ?? null)}
            />
            {photoFile ? (
              <p className="text-sm text-live-700 font-medium">
                ✓ {photoFile.name}
              </p>
            ) : (
              <label htmlFor="photo-upload" className="cursor-pointer text-sm text-gray-600 hover:text-live-700">
                ここにドラッグ＆ドロップ または クリックして選択
              </label>
            )}
          </div>
        </div>

        {/* 楽しかったこと（メモ） */}
        <div>
          <label htmlFor="memo" className="block text-sm font-medium text-gray-700 mb-1">
            楽しかったこと（任意）
          </label>
          <textarea
            id="memo"
            rows={3}
            value={memo}
            onChange={(e) => setMemo(e.target.value)}
            placeholder="その日の思い出をメモしておけます"
            className="block w-full rounded border border-gray-300 bg-white px-3 py-2 text-sm text-gray-900"
          />
        </div>

        {message && (
          <p
            className={
              message.type === "error"
                ? "text-sm text-red-600"
                : "text-sm text-green-600"
            }
          >
            {message.text}
          </p>
        )}

        <div className="flex gap-3">
          <motion.button
            type="submit"
            disabled={
              submitting ||
              !selectedVenueId ||
              !eventDate ||
              !title.trim() ||
              (eventType === "one"
                ? !artistName.trim()
                : artistList.every((s) => !s.trim()))
            }
            className="btn-primary disabled:opacity-50 flex items-center justify-center gap-2"
            whileHover={!submitting ? { scale: 1.02 } : undefined}
            whileTap={!submitting ? { scale: 0.98 } : undefined}
          >
            {submitting && (
              <motion.span
                animate={{ rotate: 360 }}
                transition={{ repeat: Infinity, duration: 0.8, ease: "linear" }}
                className="inline-block h-4 w-4 rounded-full border-2 border-white border-t-transparent"
              />
            )}
            {submitting ? "保存中..." : "記録する"}
          </motion.button>
          <Link href="/" className="btn-secondary">
            キャンセル
          </Link>
        </div>
      </form>
    </div>
  );
}
