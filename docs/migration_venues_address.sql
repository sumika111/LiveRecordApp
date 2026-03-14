-- 会場に「住所」用カラムを追加（郵便番号検索・住所表示用）
-- Supabase SQL Editor で実行してください。

alter table public.venues
  add column if not exists postal_code text,
  add column if not exists address_detail text;

comment on column public.venues.postal_code is '郵便番号（7桁。ハイフンなし推奨）';
comment on column public.venues.address_detail is '住所の残り（町域・番地・建物名など）';
