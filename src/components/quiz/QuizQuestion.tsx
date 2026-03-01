"use client";

import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import { clsx } from "clsx";
import type { QuizQuestionData } from "@/types";

interface QuizQuestionProps {
  questionData: QuizQuestionData;
  questionNumber: number;
  totalQuestions: number;
  timeLimit?: number; // seconds
  onAnswer: (selectedIndex: number, timeTaken: number) => void;
}

export function QuizQuestion({
  questionData,
  questionNumber,
  totalQuestions,
  timeLimit = 60,
  onAnswer,
}: QuizQuestionProps) {
  const [selected, setSelected] = useState<number | null>(null);
  const [timeLeft, setTimeLeft] = useState(timeLimit);
  const [startTime] = useState(Date.now());
  const [revealed, setRevealed] = useState(false);

  const { card, options, correctIndex } = questionData;

  // Timer
  useEffect(() => {
    if (revealed) return;
    const timer = setInterval(() => {
      setTimeLeft((t) => {
        if (t <= 1) {
          clearInterval(timer);
          // Auto-submit with wrong answer if time runs out
          handleSelect(-1);
          return 0;
        }
        return t - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [revealed]);

  function handleSelect(index: number) {
    if (revealed) return;
    setSelected(index);
    setRevealed(true);
    const timeTaken = Math.round((Date.now() - startTime) / 1000);
    setTimeout(() => onAnswer(index, timeTaken), 800);
  }

  const timerPercent = (timeLeft / timeLimit) * 100;
  const timerColor =
    timerPercent > 50 ? "bg-green-500" : timerPercent > 25 ? "bg-amber-500" : "bg-red-500";

  return (
    <div className="w-full max-w-2xl mx-auto">
      {/* Header */}
      <div className="flex items-center justify-between mb-6">
        <span className="text-sm font-medium text-slate-500">
          Question {questionNumber} of {totalQuestions}
        </span>
        <div className="flex items-center gap-2">
          <span className={clsx("text-sm font-mono font-bold", timerPercent <= 25 ? "text-red-500" : "text-slate-600")}>
            {timeLeft}s
          </span>
        </div>
      </div>

      {/* Timer bar */}
      <div className="w-full bg-slate-100 rounded-full h-1.5 mb-6 overflow-hidden">
        <motion.div
          initial={{ width: "100%" }}
          animate={{ width: `${timerPercent}%` }}
          transition={{ duration: 0.5 }}
          className={`h-full rounded-full transition-colors ${timerColor}`}
        />
      </div>

      {/* Question */}
      <div className="bg-white rounded-2xl card-shadow p-6 mb-6">
        <p className="text-lg font-semibold text-slate-900 leading-relaxed">
          {card.question}
        </p>
      </div>

      {/* Options */}
      <div className="space-y-3">
        {options.map((option, index) => {
          const isSelected = selected === index;
          const isCorrect = index === correctIndex;
          const showResult = revealed;

          return (
            <motion.button
              key={index}
              initial={{ opacity: 0, y: 8 }}
              animate={{ opacity: 1, y: 0 }}
              transition={{ delay: index * 0.05 }}
              onClick={() => handleSelect(index)}
              disabled={revealed}
              className={clsx(
                "w-full text-left p-4 rounded-2xl border-2 font-medium transition-all",
                "flex items-start gap-3",
                !showResult && "border-slate-200 bg-white hover:border-blue-300 hover:bg-blue-50",
                showResult && isCorrect && "border-green-400 bg-green-50 text-green-800",
                showResult && isSelected && !isCorrect && "border-red-400 bg-red-50 text-red-800",
                showResult && !isSelected && !isCorrect && "border-slate-100 bg-slate-50 text-slate-500 opacity-60"
              )}
            >
              <span
                className={clsx(
                  "flex-shrink-0 w-7 h-7 rounded-full border-2 flex items-center justify-center text-xs font-bold",
                  !showResult && "border-slate-300 text-slate-500",
                  showResult && isCorrect && "border-green-500 bg-green-500 text-white",
                  showResult && isSelected && !isCorrect && "border-red-500 bg-red-500 text-white",
                  showResult && !isSelected && !isCorrect && "border-slate-200 text-slate-400"
                )}
              >
                {showResult && isCorrect ? "✓" : showResult && isSelected && !isCorrect ? "✗" : String.fromCharCode(65 + index)}
              </span>
              <span className="text-sm leading-relaxed pt-0.5">{option}</span>
            </motion.button>
          );
        })}
      </div>
    </div>
  );
}
