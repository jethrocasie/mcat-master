"use client";

import { useState, useEffect } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { StudySession } from "@/components/flashcard/StudySession";
import { Button } from "@/components/ui/button";
import Link from "next/link";
import type { Flashcard, McatSection } from "@/types";

const SECTIONS: { value: McatSection | "all"; label: string; emoji: string }[] = [
  { value: "all", label: "All Sections", emoji: "🌐" },
  { value: "bio_biochem", label: "Bio/Biochem", emoji: "🧬" },
  { value: "chem_phys", label: "Chem/Phys", emoji: "⚗️" },
  { value: "psych_soc", label: "Psych/Soc", emoji: "🧠" },
  { value: "cars", label: "CARS", emoji: "📖" },
];

type PageState = "setup" | "studying" | "complete";

interface SessionStats {
  studied: number;
  correct: number;
  xpEarned: number;
}

export default function StudyPage() {
  const [pageState, setPageState] = useState<PageState>("setup");
  const [section, setSection] = useState<McatSection | "all">("all");
  const [cards, setCards] = useState<Flashcard[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [sessionStats, setSessionStats] = useState<SessionStats | null>(null);

  async function startSession() {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ mode: "due", limit: "20" });
      if (section !== "all") params.set("section", section);

      const res = await fetch(`/api/cards?${params}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setCards(data.cards ?? []);
      setPageState("studying");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load cards");
    } finally {
      setIsLoading(false);
    }
  }

  function handleComplete(stats: SessionStats) {
    setSessionStats(stats);
    setPageState("complete");
  }

  if (pageState === "studying") {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <StudySession cards={cards} onComplete={handleComplete} />
      </div>
    );
  }

  if (pageState === "complete" && sessionStats) {
    const accuracy =
      sessionStats.studied > 0
        ? Math.round((sessionStats.correct / sessionStats.studied) * 100)
        : 0;

    return (
      <div className="max-w-lg mx-auto py-16 text-center">
        <motion.div
          initial={{ scale: 0.8, opacity: 0 }}
          animate={{ scale: 1, opacity: 1 }}
          className="space-y-6"
        >
          <div className="text-6xl">{accuracy >= 80 ? "🏆" : accuracy >= 60 ? "⭐" : "💪"}</div>
          <div>
            <h2 className="text-3xl font-bold text-slate-900">Session Complete!</h2>
            <p className="text-slate-500 mt-2">Great work today.</p>
          </div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-white rounded-2xl card-shadow p-4 text-center">
              <div className="text-3xl font-bold text-slate-900">{sessionStats.studied}</div>
              <div className="text-xs text-slate-500 mt-1">Cards studied</div>
            </div>
            <div className="bg-white rounded-2xl card-shadow p-4 text-center">
              <div className="text-3xl font-bold text-green-600">{accuracy}%</div>
              <div className="text-xs text-slate-500 mt-1">Accuracy</div>
            </div>
            <div className="bg-white rounded-2xl card-shadow p-4 text-center">
              <div className="text-3xl font-bold text-blue-600">+{sessionStats.xpEarned}</div>
              <div className="text-xs text-slate-500 mt-1">XP earned</div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button variant="secondary" onClick={() => setPageState("setup")}>
              Study More
            </Button>
            <Link href="/dashboard">
              <Button>Back to Dashboard</Button>
            </Link>
          </div>
        </motion.div>
      </div>
    );
  }

  // Setup screen
  return (
    <div className="max-w-lg mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Flashcard Study</h1>
        <p className="text-slate-500 mt-1 text-sm">
          SM-2 spaced repetition — you&apos;ll see cards exactly when you need to review them.
        </p>
      </div>

      <div className="bg-white rounded-2xl card-shadow p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Choose Section</h2>
        <div className="grid grid-cols-1 gap-2">
          {SECTIONS.map(({ value, label, emoji }) => (
            <button
              key={value}
              onClick={() => setSection(value)}
              className={`flex items-center gap-3 p-3 rounded-xl border-2 transition-all text-left ${
                section === value
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-100 hover:border-slate-200 text-slate-700"
              }`}
            >
              <span className="text-xl">{emoji}</span>
              <span className="font-medium text-sm">{label}</span>
            </button>
          ))}
        </div>
      </div>

      {error && (
        <div className="mb-4 p-3 bg-red-50 border border-red-200 rounded-xl text-red-600 text-sm">
          {error}
        </div>
      )}

      <Button
        size="lg"
        onClick={startSession}
        loading={isLoading}
        className="w-full"
      >
        Start Session →
      </Button>
    </div>
  );
}
