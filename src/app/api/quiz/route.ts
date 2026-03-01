import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";
import { calculateQuizXp } from "@/lib/xp";
import { getLevelFromXp } from "@/lib/xp";
import type { McatSection, QuizQuestionData } from "@/types";

// GET /api/quiz?section=bio_biochem&count=10
// Returns quiz questions with multiple choice options
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const section = searchParams.get("section") as McatSection | null;
  const count = Math.min(parseInt(searchParams.get("count") ?? "10"), 20);

  // Fetch cards for the quiz
  let query = supabase.from("flashcards").select("*");
  if (section) query = query.eq("mcat_section", section);

  const { data: allCards, error } = await query.limit(200);
  if (error) return NextResponse.json({ error: error.message }, { status: 500 });
  if (!allCards || allCards.length < 4) {
    return NextResponse.json({ error: "Not enough cards" }, { status: 422 });
  }

  // Shuffle and pick questions
  const shuffled = allCards.sort(() => Math.random() - 0.5);
  const questionCards = shuffled.slice(0, count);

  // Build multiple-choice questions
  const questions: QuizQuestionData[] = questionCards.map((card) => {
    // Pick 3 wrong answers from other cards
    const wrongPool = shuffled
      .filter((c) => c.id !== card.id)
      .sort(() => Math.random() - 0.5)
      .slice(0, 3)
      .map((c) => c.answer);

    const correctIndex = Math.floor(Math.random() * 4);
    const options: string[] = [];

    for (let i = 0; i < 4; i++) {
      if (i === correctIndex) {
        options.push(card.answer);
      } else {
        options.push(wrongPool.pop() ?? "None of the above");
      }
    }

    return {
      card,
      options,
      correctIndex,
    };
  });

  return NextResponse.json({ questions });
}

// POST /api/quiz — save completed quiz session
export async function POST(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const body = await request.json();
  const {
    section,
    totalQuestions,
    correctAnswers,
    durationSeconds,
    answers,
  } = body as {
    section: McatSection | null;
    totalQuestions: number;
    correctAnswers: number;
    durationSeconds: number;
    answers: { cardId: string; selectedAnswer: string; isCorrect: boolean; timeTakenSeconds: number }[];
  };

  const xpEarned = calculateQuizXp(totalQuestions, correctAnswers);

  // Save session
  const { data: session, error: sessionError } = await supabase
    .from("quiz_sessions")
    .insert({
      user_id: user.id,
      mcat_section: section,
      total_questions: totalQuestions,
      correct_answers: correctAnswers,
      xp_earned: xpEarned,
      duration_seconds: durationSeconds,
    })
    .select()
    .single();

  if (sessionError) {
    return NextResponse.json({ error: sessionError.message }, { status: 500 });
  }

  // Save individual answers
  if (answers?.length && session) {
    await supabase.from("quiz_answers").insert(
      answers.map((a) => ({
        session_id: session.id,
        card_id: a.cardId,
        selected_answer: a.selectedAnswer,
        is_correct: a.isCorrect,
        time_taken_seconds: a.timeTakenSeconds,
      }))
    );
  }

  // Update XP
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp")
    .eq("id", user.id)
    .single();

  if (profile) {
    const newXp = (profile.xp ?? 0) + xpEarned;
    await supabase
      .from("profiles")
      .update({ xp: newXp, level: getLevelFromXp(newXp) })
      .eq("id", user.id);
  }

  return NextResponse.json({ sessionId: session.id, xpEarned });
}
