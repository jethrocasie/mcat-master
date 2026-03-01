"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";

interface StreakCardProps {
  currentStreak: number;
  longestStreak: number;
  streakFreezes: number;
}

export function StreakCard({ currentStreak, longestStreak, streakFreezes }: StreakCardProps) {
  const isHot = currentStreak >= 7;
  const isMedium = currentStreak >= 3;

  return (
    <Card className="p-6 relative overflow-hidden">
      {/* Background glow for hot streaks */}
      {isHot && (
        <div className="absolute inset-0 bg-gradient-to-br from-orange-50 to-amber-50 pointer-events-none" />
      )}

      <div className="relative">
        <div className="flex items-center justify-between mb-4">
          <span className="text-sm font-medium text-slate-500">Current Streak</span>
          {streakFreezes > 0 && (
            <span className="text-xs bg-blue-100 text-blue-700 px-2 py-0.5 rounded-full font-medium">
              🧊 {streakFreezes} freeze{streakFreezes !== 1 ? "s" : ""}
            </span>
          )}
        </div>

        <div className="flex items-end gap-3">
          <motion.div
            key={currentStreak}
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="flex items-center gap-2"
          >
            <span className={`text-5xl ${isHot ? "animate-pulse-slow" : ""}`}>
              {isHot ? "🔥" : isMedium ? "✨" : "📚"}
            </span>
            <span className="text-5xl font-bold text-slate-900">{currentStreak}</span>
          </motion.div>
          <span className="text-slate-500 pb-1 text-sm">day{currentStreak !== 1 ? "s" : ""}</span>
        </div>

        <div className="mt-4 pt-4 border-t border-slate-100 flex items-center justify-between text-sm">
          <span className="text-slate-500">
            Best: <span className="font-semibold text-slate-700">{longestStreak} days</span>
          </span>
          {currentStreak > 0 && currentStreak >= longestStreak && (
            <span className="text-green-600 font-medium text-xs">🏆 Personal best!</span>
          )}
        </div>
      </div>
    </Card>
  );
}
