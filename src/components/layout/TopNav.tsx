"use client";

import { useState } from "react";
import Link from "next/link";
import { usePathname } from "next/navigation";
import { clsx } from "clsx";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import type { Profile } from "@/types";

const navItems = [
  { href: "/dashboard", icon: "🏠", label: "Dashboard" },
  { href: "/study", icon: "🃏", label: "Flashcards" },
  { href: "/quiz", icon: "📝", label: "Quiz" },
  { href: "/progress", icon: "📊", label: "Progress" },
  { href: "/settings", icon: "⚙️", label: "Settings" },
];

interface TopNavProps {
  profile: Profile | null;
}

export function TopNav({ profile }: TopNavProps) {
  const [menuOpen, setMenuOpen] = useState(false);
  const pathname = usePathname();
  const router = useRouter();
  const supabase = createClient();

  async function signOut() {
    await supabase.auth.signOut();
    router.push("/login");
    router.refresh();
  }

  return (
    <>
      {/* Mobile top bar */}
      <header className="md:hidden fixed top-0 left-0 right-0 bg-white border-b border-slate-200 px-4 py-3 flex items-center justify-between z-40">
        <div className="flex items-center gap-2">
          <span className="text-xl">🧠</span>
          <span className="font-bold text-slate-900">MCAT Master</span>
        </div>

        <div className="flex items-center gap-3">
          {profile && (
            <span className="text-sm font-medium text-orange-500">
              🔥 {profile.current_streak}
            </span>
          )}
          <button
            onClick={() => setMenuOpen(!menuOpen)}
            className="p-2 rounded-lg hover:bg-slate-100 transition-colors"
          >
            <div className="w-5 h-5 flex flex-col justify-center gap-1">
              <span className={clsx("block h-0.5 bg-slate-600 transition-all", menuOpen && "rotate-45 translate-y-1.5")}></span>
              <span className={clsx("block h-0.5 bg-slate-600 transition-all", menuOpen && "opacity-0")}></span>
              <span className={clsx("block h-0.5 bg-slate-600 transition-all", menuOpen && "-rotate-45 -translate-y-1.5")}></span>
            </div>
          </button>
        </div>
      </header>

      {/* Mobile menu overlay */}
      {menuOpen && (
        <div className="md:hidden fixed inset-0 z-30 bg-slate-900/50" onClick={() => setMenuOpen(false)}>
          <div
            className="absolute top-[57px] left-0 right-0 bg-white border-b border-slate-200 p-4 space-y-1"
            onClick={(e) => e.stopPropagation()}
          >
            {navItems.map(({ href, icon, label }) => (
              <Link
                key={href}
                href={href}
                onClick={() => setMenuOpen(false)}
                className={clsx(
                  "flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium transition-all",
                  pathname === href
                    ? "bg-blue-50 text-blue-700"
                    : "text-slate-600 hover:bg-slate-50"
                )}
              >
                <span>{icon}</span>
                {label}
              </Link>
            ))}
            <button
              onClick={signOut}
              className="w-full flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium text-slate-500 hover:bg-slate-50 transition-all"
            >
              <span>👋</span>
              Sign out
            </button>
          </div>
        </div>
      )}
    </>
  );
}
