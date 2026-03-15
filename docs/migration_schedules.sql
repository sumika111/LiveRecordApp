-- 今後の予定（ユーザーごとのチェックリスト。日付・イベント名・場所・行ったか）
-- 実行: Supabase Dashboard > SQL Editor で実行

CREATE TABLE IF NOT EXISTS public.user_schedules (
  id uuid PRIMARY KEY DEFAULT gen_random_uuid(),
  user_id uuid NOT NULL REFERENCES auth.users(id) ON DELETE CASCADE,
  event_date date NOT NULL,
  title text NOT NULL,
  location text,
  done boolean NOT NULL DEFAULT false,
  created_at timestamptz NOT NULL DEFAULT now(),
  updated_at timestamptz NOT NULL DEFAULT now(),
  CHECK (trim(title) <> '')
);

CREATE INDEX IF NOT EXISTS user_schedules_user_id ON public.user_schedules (user_id);
CREATE INDEX IF NOT EXISTS user_schedules_event_date ON public.user_schedules (user_id, event_date);

ALTER TABLE public.user_schedules ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "自分の予定のみ参照" ON public.user_schedules;
CREATE POLICY "自分の予定のみ参照"
  ON public.user_schedules FOR SELECT TO authenticated
  USING (auth.uid() = user_id);

DROP POLICY IF EXISTS "自分の予定のみ追加" ON public.user_schedules;
CREATE POLICY "自分の予定のみ追加"
  ON public.user_schedules FOR INSERT TO authenticated
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "自分の予定のみ更新" ON public.user_schedules;
CREATE POLICY "自分の予定のみ更新"
  ON public.user_schedules FOR UPDATE TO authenticated
  USING (auth.uid() = user_id)
  WITH CHECK (auth.uid() = user_id);

DROP POLICY IF EXISTS "自分の予定のみ削除" ON public.user_schedules;
CREATE POLICY "自分の予定のみ削除"
  ON public.user_schedules FOR DELETE TO authenticated
  USING (auth.uid() = user_id);

CREATE OR REPLACE FUNCTION public.set_user_schedules_updated_at()
RETURNS TRIGGER AS $$
BEGIN
  NEW.updated_at = now();
  RETURN NEW;
END;
$$ LANGUAGE plpgsql;

DROP TRIGGER IF EXISTS user_schedules_updated_at ON public.user_schedules;
CREATE TRIGGER user_schedules_updated_at
  BEFORE UPDATE ON public.user_schedules
  FOR EACH ROW EXECUTE PROCEDURE public.set_user_schedules_updated_at();

COMMENT ON TABLE public.user_schedules IS '今後のライブ予定チェックリスト。行ったら done を true に';
