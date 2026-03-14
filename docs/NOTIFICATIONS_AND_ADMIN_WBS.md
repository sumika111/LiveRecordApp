# 通知・管理者通知まわり 実装まとめ（WBS）

今回の作業で入れた「通知」「管理者画面の通知」「API軽量化」の一覧です。一旦ここで区切りとしてまとめています。

---

## 全体サマリ

| 分野 | 内容 | 状態 |
|------|------|------|
| 通知画面 | いいね/コメントをタブ分け、未読バッジ・新着ハイライト | ✅ 完了 |
| 管理者通知 | 通報/要望の未読バッジ、タブ横の赤丸、ハイライト | ✅ 完了 |
| TLいいね | 一覧でいいねボタンを押せるように（詳細に飛ばない） | ✅ 完了 |
| 未読の消し方 | 別タブ・タブ切り替えで未読バッジを消す | ✅ 完了 |
| API軽量化 | メニュー開いたときだけcount、listにcount含める | ✅ 完了 |

---

## 1. 通知機能（ユーザー向け）

| # | タスク | 状態 | 備考 |
|---|--------|------|------|
| 1.1 | 通知一覧ページ `/notifications` | ✅ | `app/(main)/notifications/page.tsx` |
| 1.2 | いいね・コメントを**タブ**で分離（いいね / コメント） | ✅ | `NotificationsContent.tsx` |
| 1.3 | いいねは**プルダウン**で「いいねした人」表示 | ✅ | 既存どおり |
| 1.4 | コメントは**1人1カード**で「〇〇さんがコメントしました」 | ✅ | プルダウンにしない |
| 1.5 | タブ横に**未読件数の赤丸バッジ**（いいね/コメント別） | ✅ | count API の likeCount / commentCount |
| 1.6 | **いいね**：通知画面を開いた瞬間に新着カードを数秒ハイライト | ✅ | read_at と lastAt で判定、約4秒 |
| 1.7 | **コメント**：コメントタブを**押したとき**に新着を数秒ハイライト | ✅ | commentHighlightKeys |
| 1.8 | 別タブに移ったら未読バッジを消す（pathname / メニュー閉じ） | ✅ | AppLayout |
| 1.9 | 通知画面内でタブ切り替えしたら未読バッジを消す | ✅ | いいね/コメントタブクリックで 0 に |
| 1.10 | 同じ投稿に複数いいね → 情報更新して上に（lastAt 降順で既存どおり） | ✅ | list API のソート |

**API**

- `GET /api/notifications/count` … 未読件数・read_at・likeCount・commentCount（メニュー用）
- `GET /api/notifications/list` … 一覧＋**read_at, likeCount, commentCount を含める**（通知画面は list のみで完結）
- `PATCH /api/notifications/read` … 既読更新（notification_read_at）

**DB**

- `profiles.notification_read_at`（`docs/migration_notification_read_at.sql` で追加済み）

---

## 2. 管理者画面の通知

| # | タスク | 状態 | 備考 |
|---|--------|------|------|
| 2.1 | メニュー「管理者画面」の下に**通報○件・要望○件**＋赤丸バッジ | ✅ | AppLayout |
| 2.2 | 管理者画面のタブ「通報一覧」「ユーザーからの要望」の**横に赤丸**で未読数 | ✅ | AdminTabs（reportCount / requestCount） |
| 2.3 | **通報一覧**：管理者画面を**開いたとき**に新着カードを数秒ハイライト | ✅ | AdminReports readAt |
| 2.4 | **ユーザーからの要望**：**要望タブを押したとき**に新着を数秒ハイライト | ✅ | AdminRequests requestTabClickCount |
| 2.5 | 別ページに移ったら未読バッジを消す | ✅ | AppLayout pathname / menuOpen |
| 2.6 | 管理者画面内でタブ切り替え（通報⇔要望⇔お知らせ）したら未読バッジを消す | ✅ | AdminTabs handleTabClick |

**API**

- `GET /api/admin/notifications/count` … reportCount, requestCount, **read_at**
- `PATCH /api/admin/notifications/read` … 既読更新（admin_notification_read_at）

---

## 3. タイムライン（TL）のいいね

| # | タスク | 状態 | 備考 |
|---|--------|------|------|
| 3.1 | TLのカードで**いいねボタンだけ**押せるようにする（詳細に飛ばない） | ✅ | カード全体は Link、いいねは absolute z-30 で上に配置 |

`app/(main)/timeline/page.tsx` で LikeButton を overlay の兄弟にして z-30 で前面に表示。

---

## 4. API 軽量化

| # | タスク | 状態 | 備考 |
|---|--------|------|------|
| 4.1 | 未読件数は**メニューを開いたときだけ**取得（初回表示時はバッジなし） | ✅ | AppLayout：mount 時の fetch を削除 |
| 4.2 | 通知画面で **list 1本＋read 1本** に（count を list に含める） | ✅ | list API に read_at, likeCount, commentCount を追加、NotificationsContent は list のみ呼ぶ |

---

## 5. 変更・追加ファイル一覧

| 種別 | パス |
|------|------|
| 画面 | `app/(main)/notifications/page.tsx` |
| 画面 | `app/(main)/timeline/page.tsx`（いいねボタン配置変更） |
| API | `app/api/notifications/count/route.ts` |
| API | `app/api/notifications/list/route.ts`（read_at, likeCount, commentCount 追加） |
| API | `app/api/notifications/read/route.ts` |
| API | `app/api/admin/notifications/count/route.ts`（read_at 追加） |
| API | `app/api/admin/notifications/read/route.ts` |
| コンポーネント | `components/NotificationsContent.tsx` |
| コンポーネント | `components/AppLayout.tsx`（未読バッジ・pathname/menuOpen でクリア） |
| コンポーネント | `components/AdminTabs.tsx`（read_at・タブバッジ・タブ切り替えでクリア） |
| コンポーネント | `components/AdminReports.tsx`（readAt・新着ハイライト） |
| コンポーネント | `components/AdminRequests.tsx`（readAt・requestTabClickCount・新着ハイライト） |
| マイグレーション | `docs/migration_notification_read_at.sql` |

---

## 6. 動作のポイント（メモ）

- **通知**：開いた瞬間に PATCH read するので、次回は「その時点以降」が未読になる。
- **管理者**：開いたときに count 取得→PATCH の順。read_at は「開く前」の値を使い、通報は開いた瞬間・要望はタブ押下でハイライト。
- **未読バッジ**：別タブ（pathname 変更）・メニュー閉じ・通知/管理者のタブ切り替えでいったん消し、再度メニューを開いたときに取得し直す。

---

*最終更新: 2025-03-07（通知・管理者通知・API軽量化の区切り)*
