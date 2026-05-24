"use client";

import { useTranslations } from "next-intl";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Heatmap } from "@/components/heatmap";
import {
  BarChart3,
  TrendingUp,
  Calendar,
  Hash,
} from "lucide-react";

const demoHeatmap: Record<string, number> = {
  "2026-01-05": 3, "2026-01-06": 5, "2026-01-08": 8, "2026-01-10": 2,
  "2026-01-12": 12, "2026-01-15": 6, "2026-01-18": 4, "2026-01-20": 9,
  "2026-01-22": 3, "2026-01-25": 7, "2026-01-28": 11, "2026-02-01": 5,
  "2026-02-03": 8, "2026-02-05": 14, "2026-02-08": 6, "2026-02-10": 3,
  "2026-02-12": 9, "2026-02-15": 7, "2026-02-18": 11, "2026-02-20": 4,
  "2026-02-22": 8, "2026-02-25": 6, "2026-02-28": 10, "2026-03-01": 3,
  "2026-03-03": 7, "2026-03-05": 12, "2026-03-08": 5, "2026-03-10": 9,
  "2026-03-12": 4, "2026-03-15": 8, "2026-03-18": 15, "2026-03-20": 6,
  "2026-03-22": 3, "2026-03-25": 11, "2026-03-28": 7, "2026-04-01": 4,
  "2026-04-03": 9, "2026-04-05": 6, "2026-04-08": 13, "2026-04-10": 5,
  "2026-04-12": 8, "2026-04-15": 3, "2026-04-18": 10, "2026-04-20": 7,
  "2026-04-22": 4, "2026-04-25": 12, "2026-04-28": 6, "2026-05-01": 9,
  "2026-05-03": 3, "2026-05-05": 7, "2026-05-08": 11, "2026-05-10": 5,
  "2026-05-12": 8, "2026-05-15": 4, "2026-05-18": 6, "2026-05-20": 10,
  "2026-05-22": 7,
};

const tagStats = [
  { name: "机器学习", count: 42 },
  { name: "React", count: 35 },
  { name: "数据结构", count: 28 },
  { name: "JavaScript", count: 24 },
  { name: "网络", count: 18 },
  { name: "英语", count: 45 },
  { name: "算法", count: 22 },
  { name: "数据库", count: 15 },
];

const difficultyDist = [
  { level: 1, label: "基础", count: 38, pct: 24 },
  { level: 2, label: "简单", count: 45, pct: 29 },
  { level: 3, label: "中等", count: 42, pct: 27 },
  { level: 4, label: "困难", count: 20, pct: 13 },
  { level: 5, label: "地狱", count: 11, pct: 7 },
];

export default function StatsPage() {
  const t = useTranslations("stats");
  const { locale } = useParams();

  return (
    <div className="container mx-auto px-4 py-8">
      <h1 className="text-3xl font-bold mb-8">{t("title")}</h1>

      {/* Overview Stats */}
      <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mb-8">
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("totalReviews")}
                </p>
                <p className="text-3xl font-bold mt-1">342</p>
              </div>
              <BarChart3 className="h-8 w-8 text-blue-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("avgPerDay")}
                </p>
                <p className="text-3xl font-bold mt-1">8.2</p>
              </div>
              <TrendingUp className="h-8 w-8 text-emerald-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("bestStreak")}
                </p>
                <p className="text-3xl font-bold mt-1">21天</p>
              </div>
              <Calendar className="h-8 w-8 text-orange-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
        <Card>
          <CardContent className="pt-6">
            <div className="flex items-center justify-between">
              <div>
                <p className="text-sm text-muted-foreground">
                  {t("thisMonth")}
                </p>
                <p className="text-3xl font-bold mt-1">56</p>
              </div>
              <Hash className="h-8 w-8 text-purple-500 opacity-80" />
            </div>
          </CardContent>
        </Card>
      </div>

      {/* Heatmap */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>{t("heatmap")}</CardTitle>
        </CardHeader>
        <CardContent>
          <Heatmap data={demoHeatmap} locale={locale as string} />
        </CardContent>
      </Card>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
        {/* Tag Cloud */}
        <Card>
          <CardHeader>
            <CardTitle>{t("tagCloud")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {tagStats.map((tag) => (
                <Badge
                  key={tag.name}
                  variant="secondary"
                  className="text-sm py-1 px-3"
                  style={{
                    fontSize: `${Math.max(12, Math.min(18, 10 + tag.count / 4))}px`,
                  }}
                >
                  {tag.name}
                  <span className="ml-1 text-muted-foreground text-xs">
                    ({tag.count})
                  </span>
                </Badge>
              ))}
            </div>
          </CardContent>
        </Card>

        {/* Difficulty Distribution */}
        <Card>
          <CardHeader>
            <CardTitle>{t("difficultyDist")}</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="space-y-3">
              {difficultyDist.map((d) => (
                <div key={d.level} className="flex items-center gap-3">
                  <span className="text-sm w-10 text-muted-foreground">
                    {d.label}
                  </span>
                  <div className="flex-1 h-6 bg-muted rounded-full overflow-hidden">
                    <div
                      className="h-full bg-primary/80 rounded-full transition-all"
                      style={{ width: `${d.pct}%` }}
                    />
                  </div>
                  <span className="text-sm font-medium w-8 text-right">
                    {d.count}
                  </span>
                </div>
              ))}
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
