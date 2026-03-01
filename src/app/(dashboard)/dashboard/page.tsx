import { redirect } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { StreakCard } from "@/components/dashboard/StreakCard";
import { XPBar } from "@/components/dashboard/XPBar";
import { DueCardsWidget } from "@/components/dashboard/DueCardsWidget";
import { WeeklyChart } from "@/components/dashboard/WeeklyChart";
import { SectionProgress } from "@/components/dashboard/SectionProgress";
import { format, subDays } from "date-fns";
import type { McatSection } from "@/types";

export default async function DashboardPage() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = format(new Date(), "yyyy-MM-dd");

  // Fetch profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("id", user.id)
    .single();

  // Count due cards
  const { count: dueCount } = await supabase
    .from("user_card_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .lte("next_review_date", today);

  // Also count new cards (flashcards with no progress entry)
  const { count: totalCards } = await supabase
    .from("flashcards")
    .select("*", { count: "exact", head: true });

  const { count: seenCards } = await supabase
    .from("user_card_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  const newCards = Math.max(0, (totalCards ?? 0) - (seenCards ?? 0));
  const totalDue = (dueCount ?? 0) + Math.min(newCards, 20); // cap new cards at 20/day

  // Cards studied today
  const { count: studiedToday } = await supabase
    .from("user_card_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id)
    .gte("last_reviewed_at", `${today}T00:00:00`);

  // Weekly chart data (last 7 days)
  const weeklyData = await Promise.all(
    Array.from({ length: 7 }, async (_, i) => {
      const day = format(subDays(new Date(), 6 - i), "yyyy-MM-dd");
      const { count } = await supabase
        .from("user_card_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("last_reviewed_at", `${day}T00:00:00`)
        .lt("last_reviewed_at", `${day}T23:59:59`);
      return {
        day: format(subDays(new Date(), 6 - i), "EEE"),
        count: count ?? 0,
      };
    })
  );

  // Section accuracy
  const { data: progressData } = await supabase
    .from("user_card_progress")
    .select("times_seen, times_correct, flashcards(mcat_section, topic)")
    .eq("user_id", user.id)
    .gt("times_seen", 0);

  const sectionStats: Record<string, { correct: number; total: number }> = {};
  const topicStats: Record<string, { correct: number; total: number }> = {};

  for (const row of progressData ?? []) {
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const fc = row.flashcards as any;
    const cardData = Array.isArray(fc) ? fc[0] : fc;
    if (!cardData) continue;

    const sec = cardData.mcat_section as McatSection;
    if (!sectionStats[sec]) sectionStats[sec] = { correct: 0, total: 0 };
    sectionStats[sec].correct += row.times_correct;
    sectionStats[sec].total += row.times_seen;

    const topic = cardData.topic as string;
    if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0 };
    topicStats[topic].correct += row.times_correct;
    topicStats[topic].total += row.times_seen;
  }

  const sectionAccuracy = Object.entries(sectionStats).map(([section, { correct, total }]) => ({
    section: section as McatSection,
    accuracy: total > 0 ? (correct / total) * 100 : 0,
    total,
  }));

  const weakTopics = Object.entries(topicStats)
    .map(([topic, { correct, total }]) => ({
      topic,
      accuracy: total > 0 ? (correct / total) * 100 : 0,
      count: total,
    }))
    .filter((t) => t.accuracy < 70 && t.count >= 3)
    .sort((a, b) => a.accuracy - b.accuracy);

  return (
    <div className="space-y-6">
      {/* Header */}
      <div>
        <h1 className="text-2xl font-bold text-slate-900">
          Welcome back, {profile?.display_name ?? "Student"} 👋
        </h1>
        <p className="text-slate-500 text-sm mt-1">
          {totalDue > 0
            ? `You have ${totalDue} cards waiting for review.`
            : "You're all caught up! Great work today."}
        </p>
      </div>

      {/* Top row — streak, XP, due cards */}
      <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
        <StreakCard
          currentStreak={profile?.current_streak ?? 0}
          longestStreak={profile?.longest_streak ?? 0}
          streakFreezes={profile?.streak_freezes ?? 0}
        />
        <XPBar xp={profile?.xp ?? 0} />
        <DueCardsWidget
          dueCount={totalDue}
          studiedToday={studiedToday ?? 0}
        />
      </div>

      {/* Middle row — chart + section progress */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-4">
        <WeeklyChart data={weeklyData} />
        <SectionProgress data={sectionAccuracy} weakTopics={weakTopics} />
      </div>

      {/* Quick actions */}
      <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
        <Link
          href="/quiz"
          className="bg-white rounded-2xl card-shadow p-5 flex items-center gap-4 hover:card-shadow-lg transition-all group"
        >
          <div className="w-12 h-12 bg-violet-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            📝
          </div>
          <div>
            <div className="font-semibold text-slate-900">Take a Quiz</div>
            <div className="text-sm text-slate-500">Test your knowledge</div>
          </div>
        </Link>

        <Link
          href="/progress"
          className="bg-white rounded-2xl card-shadow p-5 flex items-center gap-4 hover:card-shadow-lg transition-all group"
        >
          <div className="w-12 h-12 bg-green-100 rounded-xl flex items-center justify-center text-2xl group-hover:scale-110 transition-transform">
            📊
          </div>
          <div>
            <div className="font-semibold text-slate-900">View Progress</div>
            <div className="text-sm text-slate-500">Analytics & achievements</div>
          </div>
        </Link>
      </div>
    </div>
  );
}
