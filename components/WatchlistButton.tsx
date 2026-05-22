"use client";

import { Button } from "@/components/ui/button";
import { BookmarkCheck, BookmarkPlus, Trash2 } from "lucide-react";

export default function WatchlistButton({
  symbol,
  company,
  isInWatchlist,
  showTrashIcon = false,
  type = "button",
  onWatchlistChange,
}: WatchlistButtonProps) {
  const isIconOnly = type === "icon";

  const label = showTrashIcon
    ? "Remove from watchlist"
    : isInWatchlist
      ? "In watchlist"
      : "Add to watchlist";

  const Icon = showTrashIcon ? Trash2 : isInWatchlist ? BookmarkCheck : BookmarkPlus;

  return (
    <Button
      variant="outline"
      className="w-fit"
      aria-label={`${label}: ${company} (${symbol})`}
      onClick={() => {
        // This component is UI-only for now; callers can hook this up to a server action.
        const isAdded = showTrashIcon ? false : !isInWatchlist;
        onWatchlistChange?.(symbol, isAdded);
      }}
    >
      <Icon />
      {!isIconOnly ? <span>{label}</span> : null}
    </Button>
  );
}

