"use client";

import { motion } from "framer-motion";
import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import type { QuizQuestionData } from "@/types";

interface QuizResultsProps {
  totalQuestions: number;
  correctAnswers: number;
  xpEarned: number;
  durationSeconds: number;
  missedCards: QuizQuestionData[];
  onRetry: () => void;
}

export function QuizResults({
  totalQuestions,
  correctAnswers,
  xpEarned,
  durationSeconds,
  missedCards,
  onRetry,
}: QuizResultsProps) {
  const score = Math.round((correctAnswers / totalQuestions) * 100);
  const isPerfect = correctAnswers === totalQuestions;
  const minutes = Math.floor(durationSeconds / 60);
  const seconds = durationSeconds % 60;

  const emoji = score >= 90 ? "🏆" : score >= 70 ? "🌟" : score >= 50 ? "📈" : "💪";
  const message =
    score >= 90 ? "Outstanding!" :
    score >= 70 ? "Great work!" :
    score >= 50 ? "Keep going!" :
    "Don't give up!";

  return (
    <div className="w-full max-w-2xl mx-auto space-y-6">
      {/* Score card */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: "spring", duration: 0.5 }}
      >
        <Card className="p-8 text-center">
          <div className="text-6xl mb-3">{emoji}</div>
          <div className="text-5xl font-bold text-slate-900 mb-1">{score}%</div>
          <div className="text-xl font-medium text-slate-600 mb-6">{message}</div>

          <div className="grid grid-cols-3 gap-4">
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-slate-900">{correctAnswers}/{totalQuestions}</div>
              <div className="text-xs text-slate-500 mt-0.5">Correct</div>
            </div>
            <div className="bg-blue-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-blue-600">+{xpEarned}</div>
              <div className="text-xs text-slate-500 mt-0.5">XP earned</div>
            </div>
            <div className="bg-slate-50 rounded-2xl p-4">
              <div className="text-2xl font-bold text-slate-900">
                {minutes}:{seconds.toString().padStart(2, "0")}
              </div>
              <div className="text-xs text-slate-500 mt-0.5">Time</div>
            </div>
          </div>

          {isPerfect && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-xl border border-yellow-200 text-yellow-800 text-sm font-medium">
              🎉 Perfect score! +100 bonus XP awarded!
            </div>
          )}
        </Card>
      </motion.div>

      {/* Missed cards review */}
      {missedCards.length > 0 && (
        <Card className="p-6">
          <h3 className="font-semibold text-slate-900 mb-4">
            Review Incorrect ({missedCards.length})
          </h3>
          <div className="space-y-4 max-h-80 overflow-y-auto pr-1">
            {missedCards.map(({ card, options, correctIndex }) => (
              <div key={card.id} className="border border-slate-100 rounded-xl p-4">
                <p className="text-sm font-medium text-slate-900 mb-2">{card.question}</p>
                <p className="text-sm text-green-700 bg-green-50 px-3 py-1.5 rounded-lg">
                  ✓ {options[correctIndex]}
                </p>
              </div>
            ))}
          </div>
        </Card>
      )}

      {/* Actions */}
      <div className="flex gap-3">
        <Button variant="secondary" onClick={onRetry} className="flex-1">
          Try Again
        </Button>
        <Link href="/dashboard" className="flex-1">
          <Button className="w-full">Back to Dashboard</Button>
        </Link>
      </div>
    </div>
  );
}
