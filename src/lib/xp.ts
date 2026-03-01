import type { XpEvent } from "@/types";

const XP_REWARDS: Record<XpEvent, number> = {
  card_reviewed: 5,
  card_correct: 10,
  quiz_completed: 50,
  quiz_perfect: 100,
  daily_goal_met: 25,
};

export function getXpReward(event: XpEvent): number {
  return XP_REWARDS[event];
}

/**
 * XP thresholds for each level.
 * Level 1 = 0 XP, Level 2 = 100, Level 3 = 250, Level 4 = 500, etc.
 * Each threshold roughly doubles.
 */
const LEVEL_THRESHOLDS = [0, 100, 250, 500, 1000, 2000, 4000, 8000, 16000, 32000];

export function getLevelFromXp(xp: number): number {
  let level = 1;
  for (let i = 0; i < LEVEL_THRESHOLDS.length; i++) {
    if (xp >= LEVEL_THRESHOLDS[i]) {
      level = i + 1;
    } else {
      break;
    }
  }
  return level;
}

export function getXpForNextLevel(level: number): number {
  return LEVEL_THRESHOLDS[level] ?? LEVEL_THRESHOLDS[LEVEL_THRESHOLDS.length - 1] * 2;
}

export function getXpProgress(xp: number): {
  level: number;
  currentLevelXp: number;
  nextLevelXp: number;
  progress: number; // 0-100
} {
  const level = getLevelFromXp(xp);
  const currentLevelXp = LEVEL_THRESHOLDS[level - 1] ?? 0;
  const nextLevelXp = LEVEL_THRESHOLDS[level] ?? currentLevelXp * 2;
  const xpInLevel = xp - currentLevelXp;
  const xpNeeded = nextLevelXp - currentLevelXp;
  const progress = Math.min(100, Math.round((xpInLevel / xpNeeded) * 100));

  return { level, currentLevelXp, nextLevelXp, progress };
}

export function calculateQuizXp(
  totalQuestions: number,
  correctAnswers: number
): number {
  let xp = XP_REWARDS.quiz_completed;
  if (totalQuestions > 0 && correctAnswers === totalQuestions) {
    xp += XP_REWARDS.quiz_perfect;
  }
  return xp;
}
