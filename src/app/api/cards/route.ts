import { NextRequest, NextResponse } from "next/server";
import { createClient } from "@/lib/supabase/server";

// GET /api/cards?mode=due&section=bio_biochem&limit=20
export async function GET(request: NextRequest) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const { searchParams } = new URL(request.url);
  const mode = searchParams.get("mode") ?? "due"; // "due" | "all" | "weak"
  const section = searchParams.get("section");
  const limit = parseInt(searchParams.get("limit") ?? "20");

  const today = new Date().toISOString().split("T")[0];

  if (mode === "due") {
    // Get cards due for review today (joined with progress or new cards)
    const { data, error } = await supabase.rpc("get_due_cards", {
      p_user_id: user.id,
      p_today: today,
      p_section: section,
      p_limit: limit,
    });

    if (error) {
      // Fallback: return cards with no progress (new cards)
      let query = supabase
        .from("flashcards")
        .select("*")
        .limit(limit);

      if (section) query = query.eq("mcat_section", section);

      const { data: fallback, error: fallbackError } = await query;
      if (fallbackError) {
        return NextResponse.json({ error: fallbackError.message }, { status: 500 });
      }
      return NextResponse.json({ cards: fallback ?? [] });
    }

    return NextResponse.json({ cards: data ?? [] });
  }

  if (mode === "quiz") {
    // Get random cards for quiz
    let query = supabase
      .from("flashcards")
      .select("*")
      .limit(limit);

    if (section) query = query.eq("mcat_section", section);

    const { data, error } = await query;
    if (error) return NextResponse.json({ error: error.message }, { status: 500 });

    // Shuffle
    const shuffled = (data ?? []).sort(() => Math.random() - 0.5);
    return NextResponse.json({ cards: shuffled });
  }

  return NextResponse.json({ error: "Invalid mode" }, { status: 400 });
}
