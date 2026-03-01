"use client";

import { motion } from "framer-motion";
import { Card } from "@/components/ui/card";
import { getXpProgress } from "@/lib/xp";

interface XPBarProps {
  xp: number;
}

export function XPBar({ xp }: XPBarProps) {
  const { level, currentLevelXp, nextLevelXp, progress } = getXpProgress(xp);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-3">
        <div>
          <span className="text-sm font-medium text-slate-500">Level</span>
          <div className="flex items-center gap-2 mt-0.5">
            <span className="text-3xl font-bold text-slate-900">{level}</span>
            <span className="text-slate-400 text-sm">
              {getLevelTitle(level)}
            </span>
          </div>
        </div>
        <div className="text-right">
          <span className="text-sm font-medium text-slate-500">XP</span>
          <div className="text-xl font-bold text-blue-600 mt-0.5">
            {xp.toLocaleString()}
          </div>
        </div>
      </div>

      {/* Progress bar */}
      <div className="relative">
        <div className="w-full bg-slate-100 rounded-full h-3 overflow-hidden">
          <motion.div
            initial={{ width: 0 }}
            animate={{ width: `${progress}%` }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="h-full bg-gradient-to-r from-blue-500 to-violet-500 rounded-full"
          />
        </div>
        <div className="flex justify-between mt-1.5 text-xs text-slate-400">
          <span>{(xp - currentLevelXp).toLocaleString()} XP</span>
          <span>{(nextLevelXp - currentLevelXp).toLocaleString()} XP to Level {level + 1}</span>
        </div>
      </div>
    </Card>
  );
}

function getLevelTitle(level: number): string {
  const titles = [
    "", "Pre-Med", "Bio Explorer", "Science Whiz", "MCAT Contender",
    "Knowledge Seeker", "Anatomy Ace", "Bio Biochem Pro", "MCAT Champion",
    "Score Master", "MCAT Legend",
  ];
  return titles[Math.min(level, titles.length - 1)];
}
