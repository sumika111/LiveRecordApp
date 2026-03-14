-- 会場の位置が「市区町村の中心など概略」かどうかを示すフラグ
-- ジオコーディングで番地までヒットしなかった場合に市区町村で検索したとき true にする
alter table public.venues
  add column if not exists position_approximate boolean not null default false;

comment on column public.venues.position_approximate is 'true: 市区町村の中心など概略位置。正確な住所位置ではない可能性あり。';
