"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { supabaseBrowser } from "@/lib/supabase/client";

export const TABS = [
  { href: "/", label: "Overview" },
  { href: "/todo", label: "To-Do" },
  { href: "/diary", label: "Diary" },
  { href: "/possessions", label: "Possessions" },
  { href: "/properties", label: "Properties" },
  { href: "/budget", label: "Budget" },
  { href: "/contacts", label: "Contacts" },
  { href: "/ask", label: "Ask Claude" },
  { href: "/history", label: "History" },
  { href: "/settings", label: "Settings" },
];

export function Nav({ name }: { name: string }) {
  const path = usePathname();
  const router = useRouter();
  return (
    <header className="sticky top-0 z-40 bg-paper/95 backdrop-blur border-b border-line">
      <div className="mx-auto max-w-6xl px-4">
        <div className="flex items-center justify-between h-12">
          <Link href="/" className="flex items-center gap-2 font-semibold">
            <span className="size-7 rounded-lg bg-brand text-white grid place-items-center text-sm">⌂</span>
            Big Move
          </Link>
          <div className="flex items-center gap-2 text-sm">
            <span className="text-muted hidden sm:inline">{name}</span>
            <button
              className="btn-ghost text-muted"
              onClick={async () => {
                await supabaseBrowser().auth.signOut();
                router.replace("/login");
                router.refresh();
              }}
            >
              Sign out
            </button>
          </div>
        </div>
        <nav className="flex gap-1 overflow-x-auto -mx-4 px-4 pb-2 no-scrollbar">
          {TABS.map((t) => {
            const active = t.href === "/" ? path === "/" : path.startsWith(t.href);
            return (
              <Link
                key={t.href}
                href={t.href}
                className={`whitespace-nowrap rounded-lg px-3 py-1.5 text-sm font-medium ${
                  active ? "bg-brand text-white" : "text-muted hover:bg-black/5 hover:text-ink"
                }`}
              >
                {t.label}
              </Link>
            );
          })}
        </nav>
      </div>
    </header>
  );
}
