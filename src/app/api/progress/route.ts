import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateNextReview, getInitialCardProgress } from "@/lib/sm2";
import { getXpReward, getLevelFromXp } from "@/lib/xp";
import type { StudyRating } from "@/types";
import { format } from "date-fns";

export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const { cardId, rating } = body as { cardId: string; rating: StudyRating };

  if (!cardId || rating === undefined) {
    return NextResponse.json({ error: "cardId and rating required" }, { status: 400 });
  }

  // Get existing progress
  const { data: existing } = await supabase
    .from("user_card_progress")
    .select("*")
    .eq("user_id", user.id)
    .eq("card_id", cardId)
    .single();

  const currentProgress = existing ?? {
    ...getInitialCardProgress(),
    ease_factor: 2.5,
    interval: 0,
    repetitions: 0,
  };

  const next = calculateNextReview(
    {
      easeFactor: currentProgress.ease_factor,
      interval: currentProgress.interval,
      repetitions: currentProgress.repetitions,
    },
    rating
  );

  const nextReviewDate = format(next.nextReviewDate, "yyyy-MM-dd");

  const progressUpdate = {
    user_id: user.id,
    card_id: cardId,
    ease_factor: next.easeFactor,
    interval: next.interval,
    repetitions: next.repetitions,
    next_review_date: nextReviewDate,
    times_seen: (existing?.times_seen ?? 0) + 1,
    times_correct: (existing?.times_correct ?? 0) + (rating === 2 ? 1 : 0),
    last_reviewed_at: new Date().toISOString(),
  };

  const { error: upsertError } = await supabase
    .from("user_card_progress")
    .upsert(progressUpdate, { onConflict: "user_id,card_id" });

  if (upsertError) {
    return NextResponse.json({ error: upsertError.message }, { status: 500 });
  }

  // Award XP
  const xpGain = getXpReward("card_reviewed") + (rating === 2 ? getXpReward("card_correct") : 0);

  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, level, current_streak, longest_streak, last_study_date, streak_freezes")
    .eq("id", user.id)
    .single();

  if (profile) {
    const newXp = (profile.xp ?? 0) + xpGain;
    const newLevel = getLevelFromXp(newXp);
    const today = format(new Date(), "yyyy-MM-dd");
    const lastStudied = profile.last_study_date;

    // Streak logic
    let newStreak = profile.current_streak ?? 0;
    let newLongest = profile.longest_streak ?? 0;

    if (lastStudied !== today) {
      const yesterday = format(new Date(Date.now() - 86400000), "yyyy-MM-dd");
      if (lastStudied === yesterday) {
        // Consecutive day
        newStreak = newStreak + 1;
      } else if (lastStudied !== today) {
        // Broken streak (check for freeze)
        newStreak = 1;
      }
      newLongest = Math.max(newLongest, newStreak);
    }

    await supabase
      .from("profiles")
      .update({
        xp: newXp,
        level: newLevel,
        current_streak: newStreak,
        longest_streak: newLongest,
        last_study_date: today,
      })
      .eq("id", user.id);
  }

  return NextResponse.json({
    success: true,
    xpGained: xpGain,
    nextReviewDate,
  });
}
