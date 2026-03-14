# 管理者・通報・BAN 機能

## 1. マイグレーション

1. `docs/migration_admin_reports_banned.sql` を Supabase の SQL Editor で実行する。
2. 続けて `docs/migration_reports_user_report.sql` を実行する（ユーザー通報対応で comment_id を nullable に）。
3. 続けて `docs/migration_reports_allow_reporter_delete.sql` を実行する（通報した本人が取り消しできるように DELETE を許可）。

- **admins** … 管理者メール（初期: kuroko0725cc@gmail.com のみ）
- **reports** … 通報（コメント通報は comment_id あり、ユーザー通報は comment_id なし）
- **banned_emails** … 削除済みメール（このメールでは再登録不可）

## 2. 環境変数

管理者 API（通報一覧の取得・ユーザー削除）を使うには、`.env.local` に次を追加する。

```
SUPABASE_SERVICE_ROLE_KEY=your_service_role_key
```

Supabase Dashboard > Settings > API の **service_role**（secret）をコピーする。  
**このキーは管理者以外に公開しないこと。**

## 3. 動作

- **ログイン画面** … 利用上の注意（他人を傷つけない・常識の範囲・通報多発時はアカウント削除・削除メールは再登録不可）を表示。
- **BAN チェック** … ログイン済みユーザーがアクセスするたびに、そのメールが `banned_emails` に含まれていればセッションを破棄し、ログイン画面へリダイレクト（「このメールアドレスは利用できません」）。
- **通報**  
  - **タイムライン**: 各コメント（親・返信とも）の「通報」ボタン（他人のコメントのみ）。押すとモーダルで確認のうえ送信。送信後は「通報しました 取り消す」と表示され、**取り消す**で自分が送った通報だけ削除できる。  
  - **友達タブ**: 検索結果・友達一覧・友達詳細に「通報」ボタン（自分以外）。同様に送信後「取り消す」で通報を取り消せる。  
- **通報の取り消し**: 管理者は通報を削除しない。ユーザーが「取り消す」を押すと DELETE /api/reports/[reportId] で自分が送った通報のみ削除される（RLS で reporter 本人のみ許可）。
- **管理者画面** … メニューに「管理者画面」は **admins にメールが含まれるユーザーだけ** に表示。`/admin` で通報一覧（通報されたコメント本文・被通報者・通報者）を表示し、「このユーザーを削除」で該当ユーザーを削除。削除時にそのメールを `banned_emails` に追加し、Supabase Auth のユーザーを削除するため、**そのメールでは二度と登録できない。**

## 4. 管理者の追加

Supabase Dashboard > Table Editor > `admins` に行を追加する（email のみ）。または SQL で:

```sql
INSERT INTO public.admins (email) VALUES ('追加する管理者のメール@example.com');
```
