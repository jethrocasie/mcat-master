import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import { Card } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { format, subDays } from "date-fns";
import type { McatSection } from "@/types";

const SECTION_LABELS: Record<McatSection, string> = {
  bio_biochem: "Bio/Biochem",
  chem_phys: "Chem/Phys",
  psych_soc: "Psych/Soc",
  cars: "CARS",
};

const ACHIEVEMENTS = [
  { id: "first_card", icon: "🃏", name: "First Card", description: "Reviewed your first flashcard" },
  { id: "streak_3", icon: "🔥", name: "On Fire", description: "3-day study streak" },
  { id: "streak_7", icon: "🔥🔥", name: "Week Warrior", description: "7-day study streak" },
  { id: "streak_30", icon: "🏆", name: "Unstoppable", description: "30-day study streak" },
  { id: "section_master_bio", icon: "🧬", name: "Bio Master", description: "80%+ accuracy in Bio/Biochem" },
  { id: "comeback_kid", icon: "💪", name: "Comeback Kid", description: "Got a card right after 3 wrong attempts" },
  { id: "speed_demon", icon: "⚡", name: "Speed Demon", description: "Answered 20 cards in under 5 minutes" },
];

export default async function ProgressPage() {
  const supabase = await createClient();
  const { data: { user } } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const today = format(new Date(), "yyyy-MM-dd");

  // Profile stats
  const { data: profile } = await supabase
    .from("profiles")
    .select("xp, level, current_streak, longest_streak")
    .eq("id", user.id)
    .single();

  // Total cards seen
  const { count: totalSeen } = await supabase
    .from("user_card_progress")
    .select("*", { count: "exact", head: true })
    .eq("user_id", user.id);

  // Overall accuracy
  const { data: allProgress } = await supabase
    .from("user_card_progress")
    .select("times_seen, times_correct, flashcards(mcat_section, topic)")
    .eq("user_id", user.id)
    .gt("times_seen", 0);

  let totalSessions = 0, totalCorrect = 0;
  const sectionStats: Record<string, { correct: number; total: number }> = {};
  const topicStats: Record<string, { correct: number; total: number; section: string }> = {};

  for (const row of allProgress ?? []) {
    totalSessions += row.times_seen;
    totalCorrect += row.times_correct;
    const card = row.flashcards as { mcat_section: McatSection; topic: string } | null;
    if (!card) continue;

    const sec = card.mcat_section;
    if (!sectionStats[sec]) sectionStats[sec] = { correct: 0, total: 0 };
    sectionStats[sec].correct += row.times_correct;
    sectionStats[sec].total += row.times_seen;

    const topic = card.topic;
    if (!topicStats[topic]) topicStats[topic] = { correct: 0, total: 0, section: sec };
    topicStats[topic].correct += row.times_correct;
    topicStats[topic].total += row.times_seen;
  }

  const overallAccuracy = totalSessions > 0 ? Math.round((totalCorrect / totalSessions) * 100) : 0;

  // Quiz history
  const { data: quizHistory } = await supabase
    .from("quiz_sessions")
    .select("*")
    .eq("user_id", user.id)
    .order("completed_at", { ascending: false })
    .limit(5);

  // User achievements
  const { data: userAchievements } = await supabase
    .from("user_achievements")
    .select("achievement_id")
    .eq("user_id", user.id);

  const earnedIds = new Set((userAchievements ?? []).map((a) => a.achievement_id));

  // Heatmap data — last 30 days
  const heatmapData = await Promise.all(
    Array.from({ length: 30 }, async (_, i) => {
      const day = format(subDays(new Date(), 29 - i), "yyyy-MM-dd");
      const { count } = await supabase
        .from("user_card_progress")
        .select("*", { count: "exact", head: true })
        .eq("user_id", user.id)
        .gte("last_reviewed_at", `${day}T00:00:00`)
        .lt("last_reviewed_at", `${day}T23:59:59`);
      return { day, count: count ?? 0 };
    })
  );

  return (
    <div className="space-y-6">
      <div>
        <h1 className="text-2xl font-bold text-slate-900">Your Progress</h1>
        <p className="text-slate-500 text-sm mt-1">Track your MCAT preparation journey</p>
      </div>

      {/* Summary stats */}
      <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
        {[
          { label: "Cards Studied", value: totalSeen ?? 0, emoji: "🃏" },
          { label: "Overall Accuracy", value: `${overallAccuracy}%`, emoji: "🎯" },
          { label: "Current Streak", value: `${profile?.current_streak ?? 0}d`, emoji: "🔥" },
          { label: "Total XP", value: (profile?.xp ?? 0).toLocaleString(), emoji: "⚡" },
        ].map(({ label, value, emoji }) => (
          <Card key={label} className="p-4 text-center">
            <div className="text-2xl mb-1">{emoji}</div>
            <div className="text-2xl font-bold text-slate-900">{value}</div>
            <div className="text-xs text-slate-500 mt-0.5">{label}</div>
          </Card>
        ))}
      </div>

      {/* Activity heatmap */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">
          30-Day Activity
        </h3>
        <div className="flex flex-wrap gap-1">
          {heatmapData.map(({ day, count }) => (
            <div
              key={day}
              title={`${day}: ${count} cards`}
              className={`w-7 h-7 rounded-md ${
                count === 0 ? "bg-slate-100" :
                count < 5 ? "bg-blue-200" :
                count < 15 ? "bg-blue-400" :
                "bg-blue-600"
              }`}
            />
          ))}
        </div>
        <div className="flex items-center gap-2 mt-3 text-xs text-slate-400">
          <span>Less</span>
          {["bg-slate-100", "bg-blue-200", "bg-blue-400", "bg-blue-600"].map((c) => (
            <div key={c} className={`w-3 h-3 rounded-sm ${c}`} />
          ))}
          <span>More</span>
        </div>
      </Card>

      {/* Section breakdown */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Section Breakdown</h3>
        {Object.keys(sectionStats).length === 0 ? (
          <p className="text-slate-400 text-sm text-center py-4">
            Study some cards to see section stats!
          </p>
        ) : (
          <div className="space-y-3">
            {Object.entries(sectionStats).map(([section, { correct, total }]) => {
              const acc = Math.round((correct / total) * 100);
              return (
                <div key={section}>
                  <div className="flex justify-between text-sm mb-1.5">
                    <span className="font-medium text-slate-700">
                      {SECTION_LABELS[section as McatSection]}
                    </span>
                    <span className={acc >= 80 ? "text-green-600 font-semibold" : acc >= 60 ? "text-amber-600 font-semibold" : "text-red-500 font-semibold"}>
                      {acc}% ({total} cards)
                    </span>
                  </div>
                  <div className="w-full bg-slate-100 rounded-full h-2.5">
                    <div
                      className={`h-full rounded-full ${acc >= 80 ? "bg-green-500" : acc >= 60 ? "bg-amber-500" : "bg-red-400"}`}
                      style={{ width: `${acc}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </Card>

      {/* Recent quizzes */}
      {(quizHistory?.length ?? 0) > 0 && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-4">Recent Quizzes</h3>
          <div className="space-y-3">
            {quizHistory!.map((session) => {
              const score = Math.round((session.correct_answers / session.total_questions) * 100);
              return (
                <div key={session.id} className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0">
                  <div>
                    <div className="text-sm font-medium text-slate-700">
                      {session.mcat_section ? SECTION_LABELS[session.mcat_section as McatSection] : "Mixed"} Quiz
                    </div>
                    <div className="text-xs text-slate-400">
                      {format(new Date(session.completed_at), "MMM d, h:mm a")}
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Badge color={score >= 80 ? "green" : score >= 60 ? "amber" : "red"}>
                      {score}%
                    </Badge>
                    <span className="text-xs text-blue-600 font-medium">
                      +{session.xp_earned} XP
                    </span>
                  </div>
                </div>
              );
            })}
          </div>
        </Card>
      )}

      {/* Achievements */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">Achievements</h3>
        <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
          {ACHIEVEMENTS.map(({ id, icon, name, description }) => {
            const earned = earnedIds.has(id);
            return (
              <div
                key={id}
                className={`p-4 rounded-xl border-2 text-center transition-all ${
                  earned
                    ? "border-amber-200 bg-amber-50"
                    : "border-slate-100 bg-slate-50 opacity-50 grayscale"
                }`}
              >
                <div className="text-2xl mb-1">{icon}</div>
                <div className="text-xs font-semibold text-slate-700">{name}</div>
                <div className="text-xs text-slate-500 mt-0.5">{description}</div>
              </div>
            );
          })}
        </div>
      </Card>
    </div>
  );
}
