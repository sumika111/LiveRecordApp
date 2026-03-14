# ローカル動作確認・Vercel デプロイ手順

WBS の「次にやるおすすめ」の 2.5（ローカル確認）と 6.3（Vercel デプロイ）用の手順です。

---

## 「3. Supabase 作成・ローカル動作確認」って何？

**やること**：Supabase（DB＋認証）を用意して、自分の PC で `npm run dev` したときにアプリが動く状態にすることです。

**もうやってる？** 下のチェックで「全部 Yes」なら 3 は完了です。次はスマホ確認やデプロイへ。

| チェック | やった？ |
|----------|----------|
| Supabase のサイトでプロジェクトを 1 つ作ったことがある | ☐ Yes / ☐ No |
| そのプロジェクトの「Project URL」と「anon key」を `.env.local` に書いた | ☐ Yes / ☐ No |
| Supabase の SQL Editor で `docs/supabase_init.sql` を実行した（テーブルができた） | ☐ Yes / ☐ No |
| `npm run dev` で http://localhost:3000 を開いて、ログインや記録ができる | ☐ Yes / ☐ No |

**全部 Yes** → 3 はもうやれてる。**「次やれること」の 4（スマホ確認）や 5（デプロイ）に進んで OK。**

**どれか No** → 下の「ローカルで動作確認する」を最初から順にやる。

---

## ローカルで動作確認する（2.5）

1. **環境変数**  
   ルートに `.env.local` を作成し、次を設定する。
   - `NEXT_PUBLIC_SUPABASE_URL` … Supabase の Project URL
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` … Supabase の anon public key  

   未作成なら `.env.example` をコピーして編集する。

2. **Supabase の準備**  
   `docs/SUPABASE_SETUP.md` の手順でプロジェクト作成・テーブル作成を行う。  
   マップを使う場合は **`docs/migration_venues_position_approximate.sql`** も SQL Editor で実行する。

3. **起動**  
   ```bash
   npm install
   npm run dev
   ```  
   ブラウザで http://localhost:3000 を開く。

4. **確認**  
   `docs/TEST_CHECKLIST.md` のチェックリストに沿って、認証・記録・一覧・マップ・ランキングなどを一通り触る。

5. **ビルド確認**  
   ```bash
   npm run build
   ```  
   エラーが出なければ本番ビルド可能な状態。

---

## Vercel にデプロイする（6.3）

1. **Vercel アカウント**  
   https://vercel.com で GitHub 連携またはメールでサインアップする。

2. **リポジトリを GitHub に push**  
   未 push なら `git init` → `git add .` → `git commit` → GitHub にリポジトリ作成 → `git remote add origin ...` → `git push -u origin main` などで push する。

3. **Vercel でプロジェクト作成**  
   - Vercel ダッシュボードで **Add New → Project**
   - 対象の GitHub リポジトリを選ぶ
   - Framework Preset は **Next.js** のまま
   - Root Directory はそのままでよい

4. **環境変数を設定**  
   Project の **Settings → Environment Variables** で次を追加する。  
   - `NEXT_PUBLIC_SUPABASE_URL` … Supabase の Project URL  
   - `NEXT_PUBLIC_SUPABASE_ANON_KEY` … Supabase の anon public key  

   本番・プレビュー・開発のどれに効かせるか選ぶ（通常は Production と Preview にチェック）。

5. **デプロイ**  
   **Deploy** を押す。ビルドが通れば URL が発行される。

6. **本番動作確認（6.4）**  
   発行された URL でアプリを開き、ログイン・記録・一覧・マップ・ランキングが動くか確認する。  
   Supabase の **Authentication → URL Configuration** で、本番のサイト URL を **Redirect URLs** に追加しておく（必要なら）。

---

## トラブルシューティング

- **ビルドで「position_approximate がない」など**  
  Supabase で `docs/migration_venues_position_approximate.sql` を実行しているか確認する。

- **ログイン後にリダイレクトされない**  
  Supabase の Redirect URLs に、ローカルなら `http://localhost:3000/**`、Vercel なら `https://〇〇.vercel.app/**` が含まれているか確認する。

- **マップが真っ白**  
  ブラウザのコンソールでエラーを確認。Leaflet はクライアントのみなので、`dynamic(ssr: false)` で読み込んでいるか確認する。
