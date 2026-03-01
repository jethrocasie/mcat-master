"use client";

import { useState, useEffect, useCallback } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { FlashCard } from "./FlashCard";
import { RatingButtons } from "./RatingButtons";
import type { Flashcard, StudyRating } from "@/types";
import { createClient } from "@/lib/supabase/client";

interface StudySessionProps {
  cards: Flashcard[];
  onComplete: (stats: { studied: number; correct: number; xpEarned: number }) => void;
}

type SessionState = "question" | "rating" | "complete";

export function StudySession({ cards, onComplete }: StudySessionProps) {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [sessionState, setSessionState] = useState<SessionState>("question");
  const [stats, setStats] = useState({ studied: 0, correct: 0, xpEarned: 0 });
  const [isSubmitting, setIsSubmitting] = useState(false);
  const supabase = createClient();

  const currentCard = cards[currentIndex];

  // Keyboard shortcuts
  const handleKeyDown = useCallback(
    (e: KeyboardEvent) => {
      if (sessionState === "question" && e.code === "Space") {
        e.preventDefault();
        setSessionState("rating");
      }
      if (sessionState === "rating") {
        if (e.key === "1") handleRate(0);
        if (e.key === "2") handleRate(1);
        if (e.key === "3") handleRate(2);
      }
    },
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [sessionState, currentIndex]
  );

  useEffect(() => {
    window.addEventListener("keydown", handleKeyDown);
    return () => window.removeEventListener("keydown", handleKeyDown);
  }, [handleKeyDown]);

  async function handleRate(rating: StudyRating) {
    if (isSubmitting) return;
    setIsSubmitting(true);

    const xpGained = 5 + (rating === 2 ? 10 : 0);

    try {
      // Record progress to API
      await fetch("/api/progress", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          cardId: currentCard.id,
          rating,
        }),
      });
    } catch (err) {
      console.error("Failed to record progress:", err);
    }

    const newStats = {
      studied: stats.studied + 1,
      correct: stats.correct + (rating === 2 ? 1 : 0),
      xpEarned: stats.xpEarned + xpGained,
    };
    setStats(newStats);

    const nextIndex = currentIndex + 1;
    if (nextIndex >= cards.length) {
      setIsSubmitting(false);
      onComplete(newStats);
      setSessionState("complete");
    } else {
      setCurrentIndex(nextIndex);
      setSessionState("question");
      setIsSubmitting(false);
    }
  }

  function handleCardFlip() {
    setSessionState("rating");
  }

  if (cards.length === 0) {
    return (
      <div className="flex flex-col items-center justify-center min-h-[400px] text-center">
        <span className="text-5xl mb-4">🎉</span>
        <h2 className="text-2xl font-bold text-slate-900 mb-2">All caught up!</h2>
        <p className="text-slate-500">No cards due for review right now.</p>
        <p className="text-slate-400 text-sm mt-2">Come back tomorrow for new cards.</p>
      </div>
    );
  }

  // Progress bar
  const progress = ((currentIndex) / cards.length) * 100;

  return (
    <div className="flex flex-col items-center gap-8 w-full max-w-2xl mx-auto">
      {/* Progress bar */}
      <div className="w-full">
        <div className="flex justify-between text-xs text-slate-400 mb-2">
          <span>{currentIndex} / {cards.length} reviewed</span>
          <span>{Math.round(progress)}% complete</span>
        </div>
        <div className="w-full bg-slate-100 rounded-full h-2">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full transition-all"
          />
        </div>
      </div>

      {/* Card */}
      <AnimatePresence mode="wait">
        <motion.div
          key={currentIndex}
          initial={{ opacity: 0, x: 30 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: -30 }}
          transition={{ duration: 0.25 }}
          className="w-full"
        >
          <FlashCard
            card={currentCard}
            cardNumber={currentIndex + 1}
            totalCards={cards.length}
            onFlip={handleCardFlip}
          />
        </motion.div>
      </AnimatePresence>

      {/* Rating buttons — only show after flip */}
      <AnimatePresence>
        {sessionState === "rating" && (
          <RatingButtons onRate={handleRate} disabled={isSubmitting} />
        )}
      </AnimatePresence>

      {/* Session mini-stats */}
      <div className="flex items-center gap-6 text-sm text-slate-400">
        <span>✅ {stats.correct} correct</span>
        <span>⚡ {stats.xpEarned} XP</span>
      </div>
    </div>
  );
}
