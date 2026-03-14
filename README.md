# ライブ記録アプリ

日本全国の「行ったライブ」を公演単位で記録し、ランキングや実績で自慢できる Web アプリです。

## ドキュメント

- [基本設計書](docs/BASIC_DESIGN.md)
- [進捗管理（WBS）](docs/WBS_PROGRESS.md)
- [設計変更履歴](docs/DESIGN_CHANGELOG.md)
- [技術スタック](docs/TECH_STACK.md)
- [DB スキーマ](docs/DB_SCHEMA.md)

## 開発の始め方

### 1. 依存関係のインストール

```bash
npm install
```

### 2. 環境変数（Supabase 利用時）

Supabase プロジェクトを作成したら、**`.env.local`** を作成して次の2つを設定します。

**手順:**

1. **`.env.local` を作る**  
   プロジェクトのルート（`live-record-app` の直下）に `.env.local` というファイルを新規作成する。  
   または、`.env.example` をコピーして `.env.local` にリネームする。
   ```bash
   cp .env.example .env.local
   ```

2. **Supabase で値をコピーする**  
   - https://supabase.com/dashboard にログイン
   - 使うプロジェクトをクリック
   - 左メニュー **Settings**（歯車アイコン） → **API**
   - **Project URL** をコピー → `.env.local` の `NEXT_PUBLIC_SUPABASE_URL=` の右に貼り付け
   - **Project API keys** の **anon** **public** をコピー → `.env.local` の `NEXT_PUBLIC_SUPABASE_ANON_KEY=` の右に貼り付け

3. **保存する**  
   例（値は自分のプロジェクトのものに置き換える）:
   ```env
   NEXT_PUBLIC_SUPABASE_URL=https://xxxxxxxx.supabase.co
   NEXT_PUBLIC_SUPABASE_ANON_KEY=eyJhbGciOiJIUzI1NiIsInR5cCI6IkpXVCJ9...
   ```

4. **開発サーバーを再起動**  
   `npm run dev` を一度止めて、もう一度 `npm run dev` を実行する。

くわしくは [Supabase セットアップ手順](docs/SUPABASE_SETUP.md) も参照してください。

### 3. 開発サーバー起動

```bash
npm run dev
```

ブラウザで [http://localhost:3000](http://localhost:3000) を開いてください。

## 設計変更について

仕様や設計を変えたときは、必ず `docs/DESIGN_CHANGELOG.md` に日付・内容・理由を追記し、必要に応じて `docs/BASIC_DESIGN.md` や `docs/DB_SCHEMA.md` を更新してください。
