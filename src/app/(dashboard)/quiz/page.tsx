"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { QuizQuestion } from "@/components/quiz/QuizQuestion";
import { QuizResults } from "@/components/quiz/QuizResults";
import { Button } from "@/components/ui/button";
import type { McatSection, QuizQuestionData } from "@/types";

const SECTIONS: { value: McatSection | "all"; label: string; emoji: string }[] = [
  { value: "all", label: "Mixed", emoji: "🌐" },
  { value: "bio_biochem", label: "Bio/Biochem", emoji: "🧬" },
  { value: "chem_phys", label: "Chem/Phys", emoji: "⚗️" },
  { value: "psych_soc", label: "Psych/Soc", emoji: "🧠" },
  { value: "cars", label: "CARS", emoji: "📖" },
];

const QUESTION_COUNTS = [5, 10, 15, 20];

type PageState = "setup" | "quiz" | "results";

interface QuizAnswer {
  cardId: string;
  selectedAnswer: string;
  isCorrect: boolean;
  timeTakenSeconds: number;
}

export default function QuizPage() {
  const [pageState, setPageState] = useState<PageState>("setup");
  const [section, setSection] = useState<McatSection | "all">("all");
  const [questionCount, setQuestionCount] = useState(10);
  const [questions, setQuestions] = useState<QuizQuestionData[]>([]);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [answers, setAnswers] = useState<QuizAnswer[]>([]);
  const [startTime, setStartTime] = useState(0);
  const [isLoading, setIsLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [xpEarned, setXpEarned] = useState(0);

  async function startQuiz() {
    setIsLoading(true);
    setError(null);

    try {
      const params = new URLSearchParams({ count: String(questionCount) });
      if (section !== "all") params.set("section", section);

      const res = await fetch(`/api/quiz?${params}`);
      const data = await res.json();

      if (!res.ok) throw new Error(data.error);

      setQuestions(data.questions);
      setAnswers([]);
      setCurrentIndex(0);
      setStartTime(Date.now());
      setPageState("quiz");
    } catch (e) {
      setError(e instanceof Error ? e.message : "Failed to load quiz");
    } finally {
      setIsLoading(false);
    }
  }

  async function handleAnswer(selectedIndex: number, timeTaken: number) {
    const currentQ = questions[currentIndex];
    const isCorrect = selectedIndex === currentQ.correctIndex;
    const selectedAnswer = currentQ.options[selectedIndex] ?? "";

    const newAnswer: QuizAnswer = {
      cardId: currentQ.card.id,
      selectedAnswer,
      isCorrect,
      timeTakenSeconds: timeTaken,
    };

    const newAnswers = [...answers, newAnswer];
    setAnswers(newAnswers);

    const nextIndex = currentIndex + 1;

    if (nextIndex >= questions.length) {
      // Quiz complete — save results
      const durationSeconds = Math.round((Date.now() - startTime) / 1000);
      const correctCount = newAnswers.filter((a) => a.isCorrect).length;

      try {
        const res = await fetch("/api/quiz", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({
            section: section === "all" ? null : section,
            totalQuestions: questions.length,
            correctAnswers: correctCount,
            durationSeconds,
            answers: newAnswers,
          }),
        });
        const data = await res.json();
        if (res.ok) setXpEarned(data.xpEarned);
      } catch (e) {
        console.error("Failed to save quiz:", e);
      }

      setPageState("results");
    } else {
      setCurrentIndex(nextIndex);
    }
  }

  function handleRetry() {
    setPageState("setup");
  }

  if (pageState === "quiz" && questions.length > 0) {
    return (
      <div className="max-w-2xl mx-auto py-8">
        <QuizQuestion
          key={currentIndex}
          questionData={questions[currentIndex]}
          questionNumber={currentIndex + 1}
          totalQuestions={questions.length}
          onAnswer={handleAnswer}
        />
      </div>
    );
  }

  if (pageState === "results") {
    const correctCount = answers.filter((a) => a.isCorrect).length;
    const durationSeconds = Math.round((Date.now() - startTime) / 1000);
    const missedCards = questions.filter((_, i) => !answers[i]?.isCorrect);

    return (
      <div className="max-w-2xl mx-auto py-8">
        <QuizResults
          totalQuestions={questions.length}
          correctAnswers={correctCount}
          xpEarned={xpEarned}
          durationSeconds={durationSeconds}
          missedCards={missedCards}
          onRetry={handleRetry}
        />
      </div>
    );
  }

  // Setup screen
  return (
    <div className="max-w-lg mx-auto py-8">
      <div className="mb-8">
        <h1 className="text-2xl font-bold text-slate-900">Quiz Mode</h1>
        <p className="text-slate-500 mt-1 text-sm">
          4-option multiple choice with 60-second timer per question.
        </p>
      </div>

      <div className="bg-white rounded-2xl card-shadow p-6 mb-4">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Section</h2>
        <div className="grid grid-cols-2 gap-2 sm:grid-cols-3">
          {SECTIONS.map(({ value, label, emoji }) => (
            <button
              key={value}
              onClick={() => setSection(value)}
              className={`flex flex-col items-center gap-1.5 p-3 rounded-xl border-2 transition-all ${
                section === value
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-100 hover:border-slate-200 text-slate-700"
              }`}
            >
              <span className="text-2xl">{emoji}</span>
              <span className="font-medium text-xs text-center">{label}</span>
            </button>
          ))}
        </div>
      </div>

      <div className="bg-white rounded-2xl card-shadow p-6 mb-6">
        <h2 className="text-sm font-semibold text-slate-700 mb-4">Questions</h2>
        <div className="flex gap-2">
          {QUESTION_COUNTS.map((count) => (
            <button
              key={count}
              onClick={() => setQuestionCount(count)}
              className={`flex-1 py-2.5 rounded-xl border-2 font-medium text-sm transition-all ${
                questionCount === count
                  ? "border-blue-500 bg-blue-50 text-blue-700"
                  : "border-slate-100 hover:border-slate-200 text-slate-700"
              }`}
            >
              {count}
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
        onClick={startQuiz}
        loading={isLoading}
        className="w-full"
      >
        Start Quiz →
      </Button>
    </div>
  );
}
