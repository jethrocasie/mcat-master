import { addDays } from "date-fns";
import type { CardProgress, StudyRating } from "@/types";

/**
 * SM-2 Spaced Repetition Algorithm
 * Rating: 0 = didn't know, 1 = almost, 2 = knew it
 */
export function calculateNextReview(
  card: CardProgress,
  rating: StudyRating
): CardProgress & { nextReviewDate: Date } {
  // Map rating to SM-2 quality (0-5 scale)
  const q = rating === 2 ? 5 : rating === 1 ? 3 : 0;

  let { easeFactor, interval, repetitions } = card;

  if (q < 3) {
    // Failed — reset repetitions, review tomorrow
    repetitions = 0;
    interval = 1;
  } else {
    // Passed — calculate next interval
    if (repetitions === 0) {
      interval = 1;
    } else if (repetitions === 1) {
      interval = 6;
    } else {
      interval = Math.round(interval * easeFactor);
    }
    repetitions += 1;
  }

  // Update ease factor (min 1.3)
  easeFactor = Math.max(
    1.3,
    easeFactor + 0.1 - (5 - q) * (0.08 + (5 - q) * 0.02)
  );

  const nextReviewDate = addDays(new Date(), interval);

  return { easeFactor, interval, repetitions, nextReviewDate };
}

export function getInitialCardProgress(): CardProgress {
  return {
    easeFactor: 2.5,
    interval: 0,
    repetitions: 0,
  };
}
