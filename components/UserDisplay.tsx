import Image from "next/image";
import { toPublicDisplayName } from "@/lib/displayName";

type Props = {
  displayName: string;
  avatarUrl?: string | null;
  bio?: string | null;
  size?: "sm" | "md";
};

export function UserDisplay({ displayName, avatarUrl, bio, size = "md" }: Props) {
  const name = toPublicDisplayName(displayName);
  const sizeClass = size === "sm" ? "h-8 w-8 text-sm" : "h-10 w-10 text-base";

  return (
    <div className="flex items-center gap-2">
      <div className={`relative shrink-0 overflow-hidden rounded-full bg-live-100 ${sizeClass}`}>
        {avatarUrl?.trim() ? (
          <Image
            src={avatarUrl.trim()}
            alt=""
            fill
            className="object-cover"
            sizes={size === "sm" ? "32px" : "40px"}
            unoptimized
          />
        ) : (
          <span className="flex h-full w-full items-center justify-center font-bold text-live-700 text-sm">
            {name.slice(0, 1) || "?"}
          </span>
        )}
      </div>
      <div className="min-w-0">
        <p className="font-bold text-gray-900 truncate">{name}</p>
        {bio?.trim() && (
          <p className="text-xs text-gray-600 line-clamp-2">{bio.trim()}</p>
        )}
      </div>
    </div>
  );
}
