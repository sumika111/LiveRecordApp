# DB スキーマ詳細

Supabase（PostgreSQL）で使うテーブル定義です。  
変更時は `DESIGN_CHANGELOG.md` に記録すること。

- **ER 図・設計書** … `docs/DB_DESIGN.md`（設計方針・Mermaid 図）／`docs/diagrams/er_live_record.drawio`（draw.io で編集用）

---

## 概要

- **公演中心** … 1件の「行った」= 1つの **event**（公演）に 1人の **user** が紐づく（**attendance**）。
- **会場** … **venue** は事前投入＋ユーザー登録。event は venue に紐づく。

---

## テーブル一覧

### 1. `profiles`（ユーザー拡張プロフィール）

Supabase Auth の `auth.users` はそのまま使い、アプリ用の表示名などを `profiles` で持つ。

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | uuid | PK, FK → auth.users(id) | 認証ユーザーIDと同じ |
| display_name | text | | 表示名 |
| avatar_url | text | | アバター画像URL（任意） |
| created_at | timestamptz | NOT NULL, default now() | 作成日時 |
| updated_at | timestamptz | NOT NULL, default now() | 更新日時 |

---

### 2. `venues`（会場）

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | uuid | PK, default gen_random_uuid() | 会場ID |
| name | text | NOT NULL | 会場名 |
| prefecture | text | NOT NULL | 都道府県（例: 東京都） |
| city | text | | 市区町村（任意） |
| lat | numeric(9,6) | | 緯度（任意、マップ用） |
| lng | numeric(9,6) | | 経度（任意、マップ用） |
| position_approximate | boolean | NOT NULL, default false | true のとき市区町村の中心など概略位置。正確な住所位置ではない可能性あり。（migration_venues_position_approximate.sql） |
| created_at | timestamptz | NOT NULL, default now() | 作成日時 |
| created_by | uuid | FK → auth.users(id) | 登録したユーザー（事前投入は NULL） |

- **重複防止** … (name, prefecture) の UNIQUE を張るか、アプリ側で「同じ名前＋都道府県」で検索してから登録する。

---

### 3. `events`（公演）

1件 = 「〇〇のライブを △△会場で YYYY-MM-DD にやった」という「公演」そのもの。

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | uuid | PK, default gen_random_uuid() | 公演ID |
| venue_id | uuid | NOT NULL, FK → venues(id) | 会場 |
| event_date | date | NOT NULL | 公演日 |
| title | text | NOT NULL | 公演名・アーティスト名（例: 〇〇ツアー、△△ ワンマン） |
| memo | text | | メモ（任意） |
| created_at | timestamptz | NOT NULL, default now() | 作成日時 |
| created_by | uuid | FK → auth.users(id) | 最初に「行った」と登録したユーザー |

- **一意** … 同じ会場・同じ日・同じタイトルを1つにしたい場合は (venue_id, event_date, title) で UNIQUE を検討（運用で決めてよい）。

---

### 4. `attendances`（参加記録）

「user が event に参加した（行った）」を1行で表す。

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | uuid | PK, default gen_random_uuid() | 参加記録ID |
| user_id | uuid | NOT NULL, FK → auth.users(id) | ユーザー |
| event_id | uuid | NOT NULL, FK → events(id) | 公演 |
| created_at | timestamptz | NOT NULL, default now() | 登録日時 |

- **一意** … (user_id, event_id) で UNIQUE にし、同じ公演に同じユーザーが二重で「行った」と登録できないようにする。

---

## リレーション図（簡易）

```
auth.users ──< profiles (1:1)
auth.users ──< venues.created_by
auth.users ──< events.created_by
auth.users ──< attendances.user_id

venues ──< events.venue_id
events ──< attendances.event_id
```

- **ランキング用**  
  - 公演数: ユーザーごとの `attendances` の件数  
  - 会場数: ユーザーごとに、`attendances` → `events` → `venues` の `venue_id` の DISTINCT 数  
  - 都道府県数: 上記 venues の `prefecture` の DISTINCT 数  

### 5. `artists`（アーティストマスタ）※任意

記録フォームの入力候補・ランキング年別の検索用。`events` の `artist_name` と別に管理する。

| カラム | 型 | 制約 | 説明 |
|--------|------|------|------|
| id | uuid | PK, default gen_random_uuid() | アーティストID |
| name | text | NOT NULL, UNIQUE | アーティスト名 |
| created_at | timestamptz | NOT NULL, default now() | 作成日時 |

- **作成** … `docs/migration_artists_table.sql` を Supabase で実行。既存の `events` から名前を投入する SQL も同梱。
- **運用** … 記録保存時に `artist_name` をマスタに upsert（重複はスキップ）。候補 API はマスタ優先で events からも補完。

---

## RLS（Row Level Security）方針

- `profiles` … 自分の行のみ read/update。他ユーザーは read のみ（表示名表示のため）。
- `venues` … 全員 read。insert は認証済みユーザー。
- `events` … 全員 read。insert は認証済みユーザー。
- `attendances` … 自分の行のみ read/insert/delete。他ユーザーの attendances はランキング用に read のみ（集計のみで個別詳細を出さないなら要検討）。

詳細は Supabase でテーブル作成する際に設定する。

---

*最終更新: 2025-03-06*（`artists` テーブル追加。migration_artists_table.sql）
