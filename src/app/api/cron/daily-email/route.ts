import { NextResponse } from "next/server";
import { createClient as createServerClient } from "@/lib/supabase/server";
import { createClient } from "@supabase/supabase-js";
import { sendDailyDigest } from "@/lib/email";

export async function GET() {
  // Use service role client to access auth.admin
  const adminSupabase = createClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    process.env.SUPABASE_SERVICE_ROLE_KEY!
  );

  const supabase = await createServerClient();

  // Get all users with email notifications enabled
  const { data: profiles, error } = await supabase
    .from("profiles")
    .select("id, display_name, email_notifications, current_streak")
    .eq("email_notifications", true);

  if (error) {
    return NextResponse.json({ error: error.message }, { status: 500 });
  }

  if (!profiles?.length) {
    return NextResponse.json({ sent: 0, reason: "no profiles with notifications enabled" });
  }

  const today = new Date().toISOString().split("T")[0];
  let sent = 0;

  for (const profile of profiles) {
    try {
      // Get user's email via admin client
      const { data: userData } = await adminSupabase.auth.admin.getUserById(profile.id);
      const email = userData?.user?.email;
      if (!email) continue;

      // Count due cards
      const { count: dueCount } = await adminSupabase
        .from("user_card_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", profile.id)
        .lte("next_review_date", today);

      // Get weakest topic
      const { data: weakData } = await adminSupabase
        .from("user_card_progress")
        .select("times_seen, times_correct, flashcards(topic)")
        .eq("user_id", profile.id)
        .gt("times_seen", 2);

      const topicStats: Record<string, { correct: number; total: number }> = {};
      for (const row of weakData ?? []) {
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        const fc = row.flashcards as any;
        const topic = (Array.isArray(fc) ? fc[0]?.topic : fc?.topic) ?? "Unknown";
        if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
        topicStats[topic].correct += row.times_correct;
        topicStats[topic].total += row.times_seen;
      }

      let weakestTopic = "Keep studying!";
      let weakestAccuracy = 100;
      for (const [topic, { correct, total }] of Object.entries(topicStats)) {
        const acc = (correct / total) * 100;
        if (acc < weakestAccuracy) {
          weakestAccuracy = acc;
          weakestTopic = topic;
        }
      }

      await sendDailyDigest({
        to: email,
        displayName: profile.display_name ?? "Student",
        dueCards: dueCount ?? 0,
        streak: profile.current_streak ?? 0,
        weakestTopic,
        weakestTopicAccuracy: weakestAccuracy,
      });

      sent++;
    } catch (e) {
      console.error(`Failed to send email to profile ${profile.id}:`, e);
    }
  }

  return NextResponse.json({ sent });
}
