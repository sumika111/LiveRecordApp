# 思い出写真用 Storage バケット（attendance-photos）

「記録する」でその日一番の写真を1枚保存する機能で使う Supabase Storage の設定です。

## 1. バケット作成

1. Supabase Dashboard → **Storage** を開く
2. **New bucket** をクリック
3. **Name**: `attendance-photos`
4. **Public bucket**: **ON**（写真の表示用に公開URLが必要なため）
5. **Create bucket**

## 2. RLS ポリシー（SQL Editor で実行）

バケット作成後、Storage の **Policies** で以下を設定するか、SQL Editor で実行します。

```sql
-- 認証ユーザーは自分用フォルダにのみアップロード・読み取り・削除可能
-- パス: {user_id}/{filename} で保存する

CREATE POLICY "Users can upload own attendance photos"
ON storage.objects FOR INSERT
TO authenticated
WITH CHECK (
  bucket_id = 'attendance-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can read own attendance photos"
ON storage.objects FOR SELECT
TO authenticated
USING (
  bucket_id = 'attendance-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can update own attendance photos"
ON storage.objects FOR UPDATE
TO authenticated
USING (
  bucket_id = 'attendance-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);

CREATE POLICY "Users can delete own attendance photos"
ON storage.objects FOR DELETE
TO authenticated
USING (
  bucket_id = 'attendance-photos'
  AND (storage.foldername(name))[1] = auth.uid()::text
);
```

## 3. 公開URLについて

バケットを **Public** にしているため、オブジェクトの URL を知っていれば誰でも閲覧できます。  
パスに `user_id` と `attendance_id`（UUID）が含まれるため推測は困難ですが、機密性が重要な場合はバケットを Private にして、Signed URL で表示する実装に変更してください。

## 4. ファイルサイズ制限（任意）

Storage → attendance-photos → **Settings** で **Max file size** を設定できます（例: 2MB）。  
デフォルトは 50MB です。
