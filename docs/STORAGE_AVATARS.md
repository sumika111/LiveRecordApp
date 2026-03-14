# プロフィールアイコン用 Storage バケット（avatars）

設定画面で「自分の写真からアイコンを選ぶ」でアップロードする画像を保存する Supabase Storage の設定です。

## 1. バケット作成

1. Supabase Dashboard → **Storage** を開く
2. **New bucket** をクリック
3. **Name**: `avatars`
4. **Public bucket**: **ON**（アイコン表示用に公開URLが必要なため）
5. **Create bucket**

## 2. RLS ポリシー（SQL Editor で実行）

バケット作成後、Storage の **Policies** で以下を設定するか、SQL Editor で実行します。

```sql
-- 認証ユーザーは自分用フォルダにのみアップロード・読み取り・更新・削除可能
-- パス: {user_id}/avatar.{ext} で保存する（1ユーザー1ファイル想定）

CREATE POLICY "Users can upload own avatar"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 認証ユーザーは自分のアイコンを読める
CREATE POLICY "Users can read own avatar"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

-- 全員（未ログイン含む）がアイコンを読める（招待ページ・友達詳細で表示するため）
CREATE POLICY "Anyone can read avatars"
ON storage.objects FOR SELECT
TO anon, authenticated
USING (bucket_id = 'avatars');

CREATE POLICY "Users can update own avatar"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own avatar"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'avatars'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## 3. ファイルサイズ制限（任意）

Storage → avatars → **Settings** で **Max file size** を設定できます（例: 2MB）。
