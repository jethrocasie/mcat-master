"use client";

import {
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  ResponsiveContainer,
} from "recharts";
import { Card } from "@/components/ui/card";

interface WeeklyChartProps {
  data: { day: string; count: number }[];
}

export function WeeklyChart({ data }: WeeklyChartProps) {
  const total = data.reduce((sum, d) => sum + d.count, 0);

  return (
    <Card className="p-6">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h3 className="text-sm font-semibold text-slate-900">Weekly Progress</h3>
          <p className="text-xs text-slate-400 mt-0.5">Cards studied this week</p>
        </div>
        <span className="text-2xl font-bold text-blue-600">{total}</span>
      </div>

      <ResponsiveContainer width="100%" height={160}>
        <BarChart data={data} margin={{ top: 0, right: 0, bottom: 0, left: -20 }}>
          <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" vertical={false} />
          <XAxis
            dataKey="day"
            tick={{ fontSize: 12, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
          />
          <YAxis
            tick={{ fontSize: 11, fill: "#94a3b8" }}
            axisLine={false}
            tickLine={false}
            allowDecimals={false}
          />
          <Tooltip
            contentStyle={{
              background: "#0f172a",
              border: "none",
              borderRadius: "8px",
              color: "white",
              fontSize: 12,
            }}
            cursor={{ fill: "#f1f5f9" }}
            formatter={(value: number) => [value, "Cards"]}
          />
          <Bar
            dataKey="count"
            fill="#3b82f6"
            radius={[4, 4, 0, 0]}
            maxBarSize={40}
          />
        </BarChart>
      </ResponsiveContainer>
    </Card>
  );
}
