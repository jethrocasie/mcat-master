"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import type { Flashcard } from "@/types";
import { Badge } from "@/components/ui/badge";

const SECTION_COLORS = {
  bio_biochem: "blue",
  chem_phys: "violet",
  psych_soc: "green",
  cars: "amber",
} as const;

const SECTION_LABELS = {
  bio_biochem: "Bio/Biochem",
  chem_phys: "Chem/Phys",
  psych_soc: "Psych/Soc",
  cars: "CARS",
};

interface FlashCardProps {
  card: Flashcard;
  cardNumber: number;
  totalCards: number;
  onFlip?: () => void;
}

export function FlashCard({ card, cardNumber, totalCards, onFlip }: FlashCardProps) {
  const [isFlipped, setIsFlipped] = useState(false);

  function handleFlip() {
    setIsFlipped(!isFlipped);
    if (!isFlipped) onFlip?.();
  }

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Progress indicator */}
      <div className="flex items-center justify-between mb-4 px-1">
        <Badge color={SECTION_COLORS[card.mcat_section]}>
          {SECTION_LABELS[card.mcat_section]}
        </Badge>
        <span className="text-sm text-slate-400">
          {cardNumber} / {totalCards}
        </span>
        <Badge color="slate">{card.topic}</Badge>
      </div>

      {/* Card */}
      <div
        className="perspective-1000 w-full cursor-pointer select-none"
        style={{ perspective: "1000px" }}
        onClick={handleFlip}
      >
        <motion.div
          animate={{ rotateY: isFlipped ? 180 : 0 }}
          transition={{ duration: 0.45, ease: [0.4, 0, 0.2, 1] }}
          style={{ transformStyle: "preserve-3d" }}
          className="relative w-full"
        >
          {/* Front — Question */}
          <div
            style={{ backfaceVisibility: "hidden" }}
            className="bg-white rounded-3xl card-shadow-lg p-8 min-h-[280px] flex flex-col items-center justify-center text-center"
          >
            <div className="text-xs font-semibold text-blue-400 uppercase tracking-widest mb-4">
              Question
            </div>
            <p className="text-xl font-semibold text-slate-900 leading-relaxed">
              {card.question}
            </p>
            <div className="mt-6 flex items-center gap-1.5 text-slate-400 text-sm">
              <span>👆</span>
              <span>Tap to reveal answer</span>
            </div>
          </div>

          {/* Back — Answer */}
          <div
            style={{
              backfaceVisibility: "hidden",
              transform: "rotateY(180deg)",
              position: "absolute",
              top: 0,
              left: 0,
              right: 0,
            }}
            className="bg-gradient-to-br from-blue-50 to-violet-50 rounded-3xl border-2 border-blue-100 p-8 min-h-[280px] flex flex-col items-center justify-center text-center"
          >
            <div className="text-xs font-semibold text-violet-400 uppercase tracking-widest mb-4">
              Answer
            </div>
            <p className="text-xl text-slate-800 leading-relaxed">{card.answer}</p>
          </div>
        </motion.div>
      </div>

      {!isFlipped && (
        <p className="text-center text-xs text-slate-400 mt-4">
          Keyboard shortcut: press <kbd className="bg-slate-100 px-1.5 py-0.5 rounded text-slate-600">Space</kbd>
        </p>
      )}
    </div>
  );
}
