# Supabase セットアップ手順

無料枠で Supabase プロジェクトを作成し、DB と認証を用意する手順です。  
テーブル定義の詳細は `DB_SCHEMA.md` を参照してください。

---

## 1. プロジェクト作成

1. [Supabase](https://supabase.com) にログイン
2. **New project** でプロジェクト作成（リージョンは Northeast Asia など）
3. プロジェクトができたら **Settings → API** で以下を控える:
   - **Project URL** → `NEXT_PUBLIC_SUPABASE_URL`
   - **anon public** key → `NEXT_PUBLIC_SUPABASE_ANON_KEY`
4. ルートの `.env.example` をコピーして `.env.local` を作成し、上記2つを記入

---

## 2. テーブル・RLS 作成（SQL Editor で実行）

### 手順（初めての人向け）

1. **Supabase にログイン**  
   https://supabase.com を開き、アカウントでログインする。

2. **プロジェクトを開く**  
   ダッシュボードで、使うプロジェクト（ライブ記録アプリ用に作ったもの）をクリックする。

3. **左メニューから「SQL Editor」を開く**  
   左サイドバーに **SQL Editor** という項目があるのでクリックする。  
   （「Table Editor」「Authentication」などと同じ並び）

4. **「New query」を押す**  
   画面右上あたりに **New query** ボタンがあるのでクリックする。  
   真っ白な入力エリア（クエリを書くところ）が表示される。

5. **SQL を貼り付ける**  
   - このリポジトリの **`docs/supabase_init.sql`** を開く（Cursor やメモ帳などで開いてよい）。
   - ファイルの内容を **すべて選択**（Ctrl+A / Cmd+A）して **コピー**（Ctrl+C / Cmd+C）。
   - Supabase の SQL Editor の入力エリアに **貼り付け**（Ctrl+V / Cmd+V）。

6. **「Run」で実行する**  
   入力エリアの下か右に **Run** ボタン（または「実行」）があるのでクリックする。  
   キーボードなら **Ctrl+Enter**（Mac は **Cmd+Enter**）でも実行できる。

7. **成功を確認する**  
   画面下部に「Success. No rows returned」のようなメッセージが出れば成功。  
   左の **Table Editor** を開くと、`profiles` / `venues` / `events` / `attendances` というテーブルが増えていれば OK。

**エラーが出た場合**  
- すでに同じテーブルがある場合は「already exists」と出ることがある。そのときは、`docs/supabase_init.sql` の先頭にある `create table if not exists` などで上書きされているので、たいていはそのまま使って問題ない。
- それ以外のエラー文をコピーして、開発仲間や検索で「Supabase ○○ エラー」で調べると原因が分かりやすい。

---

**一括実行（上記ができている人向け）:** `docs/supabase_init.sql` の内容をコピーし、Supabase の **SQL Editor** に貼り付けて **Run** で実行してください。テーブルと RLS がまとめて作成されます。

**既にテーブルを作成済みのプロジェクトでアーティスト名を追加する場合:** `docs/migration_add_artist_name.sql` を SQL Editor で実行し、`events` に `artist_name` カラムを追加してください。

**マイ記録から公演を編集できるようにする場合:** `docs/migration_events_update_policy.sql` を SQL Editor で実行し、自分が参加している公演を更新するポリシーを追加してください。

**会場の「名前・住所」登録と郵便番号検索を使う場合:**  
1. `docs/migration_venues_address.sql` を実行し、`venues` に `postal_code`・`address_detail` を追加する。  
2. （任意）`docs/seed_venues_major.sql` を実行し、Zepp・LIQUIDROOM など主要会場を事前登録する。

**フェス・対バンで複数アーティストを登録する場合:**  
`docs/migration_event_artists.sql` を実行し、`event_artists` テーブルを作成する。既存の `events.artist_name` は自動で `event_artists` に移行されます。

**記録する画面で既存会場の住所を変更できるようにする場合:**  
`docs/migration_venues_update_policy.sql` を実行し、認証ユーザーが `venues` を更新できるポリシーを追加する。**未実行だと「会場を保存」を押しても変更が反映されません。**

**マップで会場ピン・概略位置を使う場合:**  
`docs/migration_venues_position_approximate.sql` を SQL Editor で実行し、`venues` に `position_approximate` カラムを追加する。**未実行だとマップページでエラーになることがあります。**

**記録に「楽しかったこと」メモと写真1枚を残す場合:**  
1. `docs/migration_attendances_memo_photo.sql` を SQL Editor で実行し、`attendances` に `memo`・`photo_url` カラムと更新ポリシーを追加する。  
2. `docs/STORAGE_ATTENDANCE_PHOTOS.md` の手順で Storage バケット `attendance-photos` を作成し、RLS を設定する。

以下は個別に実行する場合の参考です。

### profiles（auth.users と 1:1）

```sql
create table public.profiles (
  id uuid primary key references auth.users(id) on delete cascade,
  display_name text,
  avatar_url text,
  created_at timestamptz not null default now(),
  updated_at timestamptz not null default now()
);

-- 新規サインアップ時に profiles を自動作成するトリガー（任意）
create or replace function public.handle_new_user()
returns trigger as $$
begin
  insert into public.profiles (id, display_name)
  values (new.id, coalesce(new.raw_user_meta_data->>'display_name', new.email));
  return new;
end;
$$ language plpgsql security definer;

create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.handle_new_user();
```

### venues（会場）

```sql
create table public.venues (
  id uuid primary key default gen_random_uuid(),
  name text not null,
  prefecture text not null,
  city text,
  lat numeric(9,6),
  lng numeric(9,6),
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);

-- 重複防止（同じ名前・都道府県）
create unique index venues_name_prefecture on public.venues (name, prefecture);
```

### events（公演）

```sql
create table public.events (
  id uuid primary key default gen_random_uuid(),
  venue_id uuid not null references public.venues(id) on delete restrict,
  event_date date not null,
  title text not null,
  memo text,
  created_at timestamptz not null default now(),
  created_by uuid references auth.users(id)
);
```

### attendances（参加記録）

```sql
create table public.attendances (
  id uuid primary key default gen_random_uuid(),
  user_id uuid not null references auth.users(id) on delete cascade,
  event_id uuid not null references public.events(id) on delete cascade,
  created_at timestamptz not null default now(),
  unique(user_id, event_id)
);
```

---

## 3. RLS（Row Level Security）の有効化とポリシー

各テーブルで **RLS を有効化**し、必要に応じてポリシーを追加します。  
（開発初期は「認証済みユーザーは全テーブル read 可」など緩めでもよい。本番前に厳密化。）

例（profiles）:

```sql
alter table public.profiles enable row level security;

create policy "自分のプロフィールは読める"
  on public.profiles for select using (auth.uid() = id);

create policy "自分のプロフィールは更新できる"
  on public.profiles for update using (auth.uid() = id);
```

venues / events / attendances も同様に、`auth.uid()` を使ってポリシーを定義します。

---

## 4. 認証の設定（Dashboard）

**Authentication → Providers** で、使う認証方法を有効化します。

- **Email** … メール/パスワード or マジックリンク
- 必要なら **Google** / **Apple** を追加（無料枠内）

---

ここまで完了したら、Next.js から `@supabase/supabase-js` で接続し、認証・テーブル読み書きの実装に進めます。
