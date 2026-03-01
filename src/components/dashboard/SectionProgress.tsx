import { Card } from "@/components/ui/card";
import type { McatSection } from "@/types";

const SECTION_LABELS: Record<McatSection, string> = {
  bio_biochem: "Bio/Biochem",
  chem_phys: "Chem/Phys",
  psych_soc: "Psych/Soc",
  cars: "CARS",
};

const SECTION_COLORS: Record<McatSection, string> = {
  bio_biochem: "bg-blue-500",
  chem_phys: "bg-violet-500",
  psych_soc: "bg-green-500",
  cars: "bg-amber-500",
};

interface SectionProgressProps {
  data: {
    section: McatSection;
    accuracy: number;
    total: number;
  }[];
  weakTopics: { topic: string; accuracy: number; count: number }[];
}

export function SectionProgress({ data, weakTopics }: SectionProgressProps) {
  return (
    <div className="space-y-4">
      {/* Section accuracy */}
      <Card className="p-6">
        <h3 className="text-sm font-semibold text-slate-900 mb-4">
          Section Accuracy
        </h3>
        <div className="space-y-4">
          {data.length === 0 ? (
            <p className="text-sm text-slate-400 text-center py-4">
              Study some cards to see your section accuracy!
            </p>
          ) : (
            data.map(({ section, accuracy, total }) => (
              <div key={section}>
                <div className="flex items-center justify-between mb-1.5">
                  <span className="text-sm font-medium text-slate-700">
                    {SECTION_LABELS[section]}
                  </span>
                  <div className="flex items-center gap-2">
                    <span
                      className={`text-xs font-semibold ${
                        accuracy >= 80
                          ? "text-green-600"
                          : accuracy >= 60
                          ? "text-amber-600"
                          : "text-red-500"
                      }`}
                    >
                      {Math.round(accuracy)}%
                    </span>
                    <span className="text-xs text-slate-400">
                      ({total} seen)
                    </span>
                  </div>
                </div>
                <div className="w-full bg-slate-100 rounded-full h-2">
                  <div
                    className={`h-full rounded-full transition-all duration-700 ${SECTION_COLORS[section]}`}
                    style={{ width: `${accuracy}%` }}
                  />
                </div>
              </div>
            ))
          )}
        </div>
      </Card>

      {/* Weak topics */}
      {weakTopics.length > 0 && (
        <Card className="p-6">
          <h3 className="text-sm font-semibold text-slate-900 mb-1">
            Needs Work 🎯
          </h3>
          <p className="text-xs text-slate-400 mb-4">Topics below 70% accuracy</p>
          <div className="space-y-2">
            {weakTopics.slice(0, 5).map(({ topic, accuracy, count }) => (
              <div
                key={topic}
                className="flex items-center justify-between py-2 border-b border-slate-50 last:border-0"
              >
                <span className="text-sm text-slate-700">{topic}</span>
                <div className="flex items-center gap-2">
                  <span className="text-xs text-red-500 font-semibold">
                    {Math.round(accuracy)}%
                  </span>
                  <span className="text-xs text-slate-400">
                    ({count} cards)
                  </span>
                </div>
              </div>
            ))}
          </div>
        </Card>
      )}
    </div>
  );
}
