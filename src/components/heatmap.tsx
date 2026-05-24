"use client";

import { useState, useMemo } from "react";
import {
  eachDayOfInterval,
  format,
  getDay,
  startOfMonth,
  endOfMonth,
  isSameDay,
  addMonths,
  subMonths,
  isAfter,
  startOfDay,
} from "date-fns";
import { zhCN } from "date-fns/locale";
import { cn } from "@/lib/utils";
import { Button } from "@/components/ui/button";
import { ChevronLeft, ChevronRight } from "lucide-react";

interface HeatmapProps {
  data: Record<string, number>;
  locale?: string;
}

const LEVEL_COLORS = [
  "bg-zinc-100 dark:bg-zinc-800",
  "bg-emerald-200 dark:bg-emerald-900",
  "bg-emerald-400 dark:bg-emerald-700",
  "bg-emerald-500 dark:bg-emerald-600",
  "bg-emerald-700 dark:bg-emerald-500",
];

const LEVEL_BORDERS = [
  "border-zinc-200 dark:border-zinc-700",
  "border-emerald-300 dark:border-emerald-800",
  "border-emerald-500 dark:border-emerald-600",
  "border-emerald-600 dark:border-emerald-500",
  "border-emerald-800 dark:border-emerald-400",
];

function getLevel(count: number): number {
  if (count === 0) return 0;
  if (count <= 2) return 1;
  if (count <= 5) return 2;
  if (count <= 10) return 3;
  return 4;
}

const DAY_NAMES_ZH = ["一", "二", "三", "四", "五", "六", "日"];
const DAY_NAMES_EN = ["Mon", "Tue", "Wed", "Thu", "Fri", "Sat", "Sun"];

export function Heatmap({ data, locale = "zh" }: HeatmapProps) {
  const now = new Date();
  const [currentMonth, setCurrentMonth] = useState(startOfMonth(now));
  const dayNames = locale === "zh" ? DAY_NAMES_ZH : DAY_NAMES_EN;
  const isCurrentMonth = isSameDay(startOfMonth(currentMonth), startOfMonth(now));
  const isFutureMonth = isAfter(startOfMonth(currentMonth), startOfMonth(now));

  const monthStart = startOfMonth(currentMonth);
  const monthEnd = endOfMonth(currentMonth);
  const days = useMemo(() => eachDayOfInterval({ start: monthStart, end: monthEnd }), [monthStart, monthEnd]);

  // Stats for this month
  const { total, active } = useMemo(() => {
    let t = 0, a = 0;
    for (const d of days) {
      const c = data[format(d, "yyyy-MM-dd")] || 0;
      if (c > 0) { t += c; a++; }
    }
    return { total: t, active: a };
  }, [days, data]);

  // Build calendar grid (weeks)
  const weeks = useMemo(() => {
    const result: (Date | null)[][] = [];
    let currentWeek: (Date | null)[] = [];

    const firstDayOfWeek = getDay(days[0]);
    const padStart = firstDayOfWeek === 0 ? 6 : firstDayOfWeek - 1;
    for (let i = 0; i < padStart; i++) currentWeek.push(null);

    for (const day of days) {
      if (currentWeek.length === 7) {
        result.push(currentWeek);
        currentWeek = [];
      }
      currentWeek.push(day);
    }
    if (currentWeek.length > 0) {
      while (currentWeek.length < 7) currentWeek.push(null);
      result.push(currentWeek);
    }
    return result;
  }, [days]);

  const monthLabel = format(currentMonth, locale === "zh" ? "yyyy年 M月" : "MMMM yyyy", { locale: locale === "zh" ? zhCN : undefined });

  return (
    <div>
      {/* Header: Month nav + stats */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth((m) => subMonths(m, 1))}
          >
            <ChevronLeft className="h-4 w-4" />
          </Button>
          <span className="text-lg font-semibold min-w-[140px] text-center">
            {monthLabel}
          </span>
          <Button
            variant="ghost"
            size="icon"
            className="h-8 w-8"
            onClick={() => setCurrentMonth((m) => addMonths(m, 1))}
            disabled={isFutureMonth}
          >
            <ChevronRight className="h-4 w-4" />
          </Button>
          {isCurrentMonth && (
            <span className="text-xs text-muted-foreground bg-muted px-2 py-0.5 rounded-full">
              {locale === "zh" ? "本月" : "This month"}
            </span>
          )}
        </div>
        <div className="flex gap-4 text-sm">
          <div className="text-center">
            <div className="text-lg font-bold">{total}</div>
            <div className="text-xs text-muted-foreground">{locale === "zh" ? "次复习" : "reviews"}</div>
          </div>
          <div className="text-center">
            <div className="text-lg font-bold">{active}</div>
            <div className="text-xs text-muted-foreground">{locale === "zh" ? "天活跃" : "active"}</div>
          </div>
        </div>
      </div>

      {/* Calendar grid */}
      <div className="border rounded-lg overflow-hidden">
        {/* Weekday headers */}
        <div className="grid grid-cols-7 border-b bg-muted/50">
          {dayNames.map((name) => (
            <div key={name} className="text-center text-xs text-muted-foreground py-2 font-medium">
              {name}
            </div>
          ))}
        </div>

        {/* Days grid */}
        <div className="grid gap-px bg-border">
          {weeks.map((week, wi) => (
            <div key={wi} className="grid grid-cols-7 gap-px bg-border">
              {week.map((day, di) => {
                if (!day) return <div key={di} className="bg-background" />;
                const dateStr = format(day, "yyyy-MM-dd");
                const count = data[dateStr] || 0;
                const level = getLevel(count);
                const isToday = isSameDay(day, now);
                const isFuture = isAfter(startOfDay(day), startOfDay(now));

                return (
                  <div
                    key={di}
                    className={cn(
                      "relative bg-background p-1 min-h-[72px] transition-colors",
                      isFuture && "opacity-40"
                    )}
                  >
                    <div className="flex flex-col h-full">
                      <span
                        className={cn(
                          "text-xs font-medium w-6 h-6 flex items-center justify-center rounded-full",
                          isToday && "bg-primary text-primary-foreground",
                          !isToday && count > 0 && "text-foreground",
                          !isToday && count === 0 && "text-muted-foreground"
                        )}
                      >
                        {format(day, "d")}
                      </span>
                      {count > 0 && (
                        <div
                          className={cn(
                            "mt-1 flex-1 rounded-md border text-center py-1 text-xs font-medium",
                            LEVEL_COLORS[level],
                            LEVEL_BORDERS[level]
                          )}
                        >
                          {count}
                        </div>
                      )}
                    </div>
                  </div>
                );
              })}
            </div>
          ))}
        </div>
      </div>

      {/* Legend */}
      <div className="flex items-center gap-1.5 mt-3 text-xs text-muted-foreground justify-end">
        <span>{locale === "zh" ? "少" : "Less"}</span>
        {LEVEL_COLORS.map((color, i) => (
          <div key={i} className={cn("w-4 h-4 rounded border", color, LEVEL_BORDERS[i])} />
        ))}
        <span>{locale === "zh" ? "多" : "More"}</span>
      </div>
    </div>
  );
}
