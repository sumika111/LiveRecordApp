"use client";

import { useEffect, useRef, useState } from "react";
import { useRouter } from "next/navigation";
import { formatEventArtists } from "@/lib/eventArtists";

import "leaflet/dist/leaflet.css";

export type MapVenueEvent = {
  event_date: string;
  title: string;
  artist_name: string | null;
  event_artists: Array<{ artist_name: string }> | null;
};

export type MapVenueItem = {
  venueId: string;
  name: string;
  lat: number;
  lng: number;
  /** 市区町村の中心など概略位置の場合は true */
  approximate?: boolean;
  events: MapVenueEvent[];
};

type VenueToGeocode = { id: string; name: string; addressLabel: string };

type Props = {
  venues: MapVenueItem[];
  venueIdsToGeocode?: string[];
  venuesToGeocodeList?: VenueToGeocode[];
};

export function VenueMap({ venues, venueIdsToGeocode = [], venuesToGeocodeList = [] }: Props) {
  const router = useRouter();
  const mapRef = useRef<HTMLDivElement>(null);
  const mapInstanceRef = useRef<import("leaflet").Map | null>(null);
  const markersRef = useRef<import("leaflet").Marker[]>([]);
  const [selectedVenue, setSelectedVenue] = useState<MapVenueItem | null>(null);
  const [geocoding, setGeocoding] = useState(false);
  const [geocodeResult, setGeocodeResult] = useState<{ success: number; failed: number } | null>(null);

  async function handleGeocodeAll() {
    if (venueIdsToGeocode.length === 0 || geocoding) return;
    setGeocoding(true);
    setGeocodeResult(null);
    let success = 0;
    let failed = 0;
    for (let i = 0; i < venueIdsToGeocode.length; i++) {
      const res = await fetch("/api/venues/geocode", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ venueId: venueIdsToGeocode[i] }),
      });
      if (res.ok) success++;
      else failed++;
      if (i < venueIdsToGeocode.length - 1) {
        await new Promise((r) => setTimeout(r, 1500));
      }
    }
    setGeocoding(false);
    setGeocodeResult({ success, failed });
    router.refresh();
  }

  useEffect(() => {
    if (!mapRef.current || venues.length === 0) return;

    const L = require("leaflet");

    if (mapInstanceRef.current) {
      mapInstanceRef.current.remove();
      mapInstanceRef.current = null;
    }
    markersRef.current = [];

    const center: [number, number] =
      venues.length === 1
        ? [venues[0].lat, venues[0].lng]
        : [
            venues.reduce((s, v) => s + v.lat, 0) / venues.length,
            venues.reduce((s, v) => s + v.lng, 0) / venues.length,
          ];

    const map = L.map(mapRef.current).setView(center, 12);
    L.tileLayer("https://{s}.tile.openstreetmap.org/{z}/{x}/{y}.png", {
      attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a>',
    }).addTo(map);
    mapInstanceRef.current = map;

    const icon = L.divIcon({
      className: "venue-marker",
      html: '<span style="font-size:24px">📍</span>',
      iconSize: [28, 28],
      iconAnchor: [14, 28],
    });

    venues.forEach((v) => {
      const marker = L.marker([v.lat, v.lng], { icon })
        .addTo(map)
        .on("click", () => setSelectedVenue(v));
      markersRef.current.push(marker);
    });

    if (venues.length > 1) {
      const group = L.featureGroup(markersRef.current);
      map.fitBounds(group.getBounds().pad(0.2));
    }

    return () => {
      map.remove();
      mapInstanceRef.current = null;
      markersRef.current = [];
    };
  }, [venues]);

  const formatDate = (d: string) => {
    const [y, m, day] = d.split("-");
    return `${y}年${parseInt(m, 10)}月${parseInt(day, 10)}日`;
  };

  return (
    <div className="space-y-4">
      {venues.length > 0 && venues.some((v) => v.approximate) && (
        <p className="rounded-card border border-amber-200 bg-amber-50/80 px-3 py-2 text-sm text-amber-900">
          ※ 一部の会場は市区町村の中心など概略位置で表示しています。正確な住所位置ではない場合があります。
        </p>
      )}
      {geocodeResult && (geocodeResult.success > 0 || geocodeResult.failed > 0) && (
        <div className="rounded-card border border-live-200 bg-live-50/50 p-3 text-sm text-live-900">
          {geocodeResult.success > 0 && (
            <span><strong>{geocodeResult.success}件</strong>の位置を取得しました。</span>
          )}
          {geocodeResult.success > 0 && geocodeResult.failed > 0 && " "}
          {geocodeResult.failed > 0 && (
            <span>
              <strong>{geocodeResult.failed}件</strong>は住所から位置を特定できませんでした。会場編集で都道府県・市区町村・番地を正確に入れると表示できる場合があります。
            </span>
          )}
        </div>
      )}
      {venues.length > 0 && (
        <div
          ref={mapRef}
          className="h-[320px] w-full rounded-card border border-live-200 bg-gray-100"
          aria-label="会場マップ"
        />
      )}
      {selectedVenue && (
        <div className="rounded-card border-2 border-live-200 bg-live-50/30 p-4">
          <h3 className="text-base font-bold text-live-900">{selectedVenue.name}</h3>
          <p className="mt-1 text-sm text-gray-600">行ったライブ一覧</p>
          <ul className="mt-3 space-y-2">
            {selectedVenue.events
              .sort((a, b) => a.event_date.localeCompare(b.event_date))
              .map((ev, i) => (
                <li
                  key={`${ev.event_date}-${ev.title}-${i}`}
                  className="flex flex-col gap-0.5 rounded-button border border-live-100 bg-white px-3 py-2 text-sm"
                >
                  <span className="font-bold text-gray-900">{formatDate(ev.event_date)}</span>
                  <span className="font-medium text-live-800">{ev.title}</span>
                  {(ev.artist_name || (ev.event_artists && ev.event_artists.length > 0)) && (
                    <span className="text-gray-600">
                      {formatEventArtists({
                        artist_name: ev.artist_name,
                        event_artists: ev.event_artists,
                      })}
                    </span>
                  )}
                </li>
              ))}
          </ul>
          <button
            type="button"
            onClick={() => setSelectedVenue(null)}
            className="mt-3 text-sm font-bold text-live-600 hover:underline"
          >
            閉じる
          </button>
        </div>
      )}
      {venues.length === 0 && venueIdsToGeocode.length === 0 && (
        <div className="rounded-card border border-live-100 bg-surface-muted p-4 text-sm text-gray-600">
          <p>
            位置情報のある会場がまだありません。会場を登録・編集すると住所から位置を取得し、マップに表示されます。
          </p>
        </div>
      )}
      {venueIdsToGeocode.length > 0 && (
        <div className="rounded-card border border-live-100 bg-surface-muted p-4 text-sm text-gray-600">
          <p>
            {venueIdsToGeocode.length}件の会場には住所が入力されています。下のボタンで位置の取得を試せます（住所によっては表示できない場合があります）。
          </p>
          {venuesToGeocodeList.length > 0 && (
            <ul className="mt-3 space-y-1.5 rounded-button border border-live-100 bg-white p-3">
              {venuesToGeocodeList.map((v) => (
                <li key={v.id} className="flex flex-col gap-0.5">
                  <span className="font-medium text-gray-900">{v.name}</span>
                  {v.addressLabel && (
                    <span className="text-xs text-gray-500">{v.addressLabel}</span>
                  )}
                </li>
              ))}
            </ul>
          )}
          <button
            type="button"
            onClick={handleGeocodeAll}
            disabled={geocoding}
            className="mt-3 rounded-button bg-live-600 px-4 py-2 text-sm font-bold text-white hover:bg-live-700 disabled:opacity-50"
          >
            {geocoding ? "取得中…" : "住所から位置を取得する"}
          </button>
        </div>
      )}
    </div>
  );
}
