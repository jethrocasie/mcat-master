"use client";

import { motion } from "framer-motion";
import type { StudyRating } from "@/types";

interface RatingButtonsProps {
  onRate: (rating: StudyRating) => void;
  disabled?: boolean;
}

const ratings = [
  {
    rating: 0 as StudyRating,
    label: "Didn't Know",
    sublabel: "Review tomorrow",
    emoji: "😕",
    className:
      "bg-red-50 hover:bg-red-100 border-red-200 text-red-700 hover:border-red-300",
    shortcut: "1",
  },
  {
    rating: 1 as StudyRating,
    label: "Almost",
    sublabel: "Review in 1 day",
    emoji: "🤔",
    className:
      "bg-amber-50 hover:bg-amber-100 border-amber-200 text-amber-700 hover:border-amber-300",
    shortcut: "2",
  },
  {
    rating: 2 as StudyRating,
    label: "Got It",
    sublabel: "Review in 6+ days",
    emoji: "✅",
    className:
      "bg-green-50 hover:bg-green-100 border-green-200 text-green-700 hover:border-green-300",
    shortcut: "3",
  },
];

export function RatingButtons({ onRate, disabled = false }: RatingButtonsProps) {
  return (
    <motion.div
      initial={{ opacity: 0, y: 12 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
      className="w-full max-w-2xl mx-auto"
    >
      <p className="text-center text-xs text-slate-400 mb-3">
        How well did you know this?
      </p>
      <div className="grid grid-cols-3 gap-3">
        {ratings.map(({ rating, label, sublabel, emoji, className, shortcut }) => (
          <button
            key={rating}
            onClick={() => onRate(rating)}
            disabled={disabled}
            className={`
              flex flex-col items-center gap-1 p-4 rounded-2xl border-2 font-medium
              transition-all hover:scale-105 active:scale-95 disabled:opacity-60
              disabled:cursor-not-allowed ${className}
            `}
          >
            <span className="text-2xl">{emoji}</span>
            <span className="text-sm font-semibold">{label}</span>
            <span className="text-xs opacity-70">{sublabel}</span>
            <kbd className="text-xs opacity-40 mt-1">[{shortcut}]</kbd>
          </button>
        ))}
      </div>
    </motion.div>
  );
}
