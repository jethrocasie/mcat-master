import Link from "next/link";
import { Card } from "@/components/ui/card";
import { Button } from "@/components/ui/button";

interface DueCardsWidgetProps {
  dueCount: number;
  studiedToday: number;
}

export function DueCardsWidget({ dueCount, studiedToday }: DueCardsWidgetProps) {
  return (
    <Card className="p-6">
      <span className="text-sm font-medium text-slate-500">Due Today</span>

      <div className="flex items-end gap-2 mt-1 mb-4">
        <span className="text-4xl font-bold text-slate-900">{dueCount}</span>
        <span className="text-slate-400 pb-1 text-sm">
          card{dueCount !== 1 ? "s" : ""}
        </span>
      </div>

      {studiedToday > 0 && (
        <p className="text-sm text-slate-500 mb-4">
          ✅ {studiedToday} studied today
        </p>
      )}

      <Link href="/study">
        <Button
          size="lg"
          className="w-full"
          disabled={dueCount === 0}
        >
          {dueCount > 0 ? "Start Studying →" : "All caught up! 🎉"}
        </Button>
      </Link>

      {dueCount === 0 && (
        <p className="text-center text-xs text-slate-400 mt-2">
          Come back tomorrow for new cards
        </p>
      )}
    </Card>
  );
}
