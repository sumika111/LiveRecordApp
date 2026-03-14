/**
 * 他ユーザーに表示する名前をサニタイズする。
 * メールアドレスや未設定の場合は「匿名」にし、個人情報が漏れないようにする。
 */
export function toPublicDisplayName(raw: string | null | undefined): string {
  if (raw == null || typeof raw !== "string") return "匿名";
  const t = raw.trim();
  if (t === "") return "匿名";
  if (t.includes("@")) return "匿名";
  return t;
}
