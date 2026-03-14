# 技術スタック

基本設計（`BASIC_DESIGN.md`）に基づき、無料枠で運用できる範囲で選定しています。  
変更する場合は `DESIGN_CHANGELOG.md` に記録すること。

---

## 確定しているスタック

| 分野 | 採用技術 | 備考 |
|------|----------|------|
| **フレームワーク** | Next.js (App Router) | React ベース、Vercel デプロイと相性が良い |
| **言語** | TypeScript | 型でミスを減らす |
| **DB・BaaS** | Supabase | PostgreSQL + Auth + 無料枠あり |
| **認証** | Supabase Auth | メール/パスワード or マジックリンク、将来 Google/Apple も可 |
| **地図** | Leaflet + 国土地理院タイル | 無料、日本国内に特化しやすい |
| **ホスティング** | Vercel | Next.js のデプロイが簡単、個人無料枠 |
| **シェア用画像** | html2canvas（クライアント） | サーバー不要で無料 |

---

## 未確定・後で決めるもの

| 分野 | 候補 | 備考 |
|------|------|------|
| **UI コンポーネント** | なし（CSS） / Tailwind / shadcn/ui 等 | まずは Tailwind で進めても可 |
| **状態管理** | React state / Context / Zustand 等 | 規模が大きくなったら検討 |
| **アナリティクス** | Google Analytics 4 / Plausible | 公開前に設定 |

---

## 開発環境

- Node.js 20.x 推奨
- pnpm / npm / yarn のいずれか（プロジェクトで統一）
- Supabase CLI（マイグレーション・ローカル開発用、任意）

---

*最終更新: 2025-03-06*
