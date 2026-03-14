"use client";

import { useState } from "react";

type Props = {
  title: string;
  children: React.ReactNode;
  defaultOpen?: boolean;
  className?: string;
};

export function CollapsibleSection({ title, children, defaultOpen = true, className }: Props) {
  const [open, setOpen] = useState(defaultOpen);

  return (
    <section className={`card rounded-card border-live-100 overflow-hidden ${className ?? ""}`}>
      <button
        type="button"
        onClick={() => setOpen(!open)}
        className="flex w-full items-center justify-between gap-2 px-6 py-4 text-left hover:bg-live-50/50 transition-colors"
        aria-expanded={open}
      >
        <h2 className="text-lg font-bold text-live-900">{title}</h2>
        <span className="shrink-0 text-live-600" aria-hidden>
          {open ? "▼" : "▶"}
        </span>
      </button>
      {open && <div className="border-t border-live-100 px-6 pb-6 pt-1">{children}</div>}
    </section>
  );
}
