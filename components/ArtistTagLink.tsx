import Link from "next/link";

type Props = {
  /** アーティスト名（#は付けない） */
  artistName: string;
  className?: string;
};

/** 好きなアーティストタグ。押すとそのアーティストのランキング・TLページへ */
export function ArtistTagLink({ artistName, className }: Props) {
  const name = artistName.trim().replace(/^#+/, "");
  if (!name) return <span className={className}>#{artistName}</span>;
  const href = `/timeline?artist=${encodeURIComponent(name)}`;
  return (
    <Link
      href={href}
      className={`inline-flex rounded-full bg-live-100 px-3 py-1 text-sm font-medium text-live-800 hover:bg-live-200 hover:underline ${className ?? ""}`}
    >
      #{name}
    </Link>
  );
}
