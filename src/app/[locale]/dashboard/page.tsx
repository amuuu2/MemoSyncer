"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Button } from "@/components/ui/button";
import { Badge } from "@/components/ui/badge";
import { Heatmap } from "@/components/heatmap";
import { useAuth } from "@/lib/supabase/auth-context";
import { supabase } from "@/lib/supabase/client";
import {
  BookOpen,
  Layers,
  Brain,
  TrendingUp,
  Plus,
  Zap,
} from "lucide-react";

interface Stats {
  todayReview: number;
  totalCards: number;
  totalDecks: number;
}

interface DeckSummary {
  id: string;
  title: string;
  cardCount: number;
  tag: string;
}

export default function DashboardPage() {
  const t = useTranslations("dashboard");
  const { locale } = useParams();
  const { user } = useAuth();
  const [stats, setStats] = useState<Stats>({ todayReview: 0, totalCards: 0, totalDecks: 0 });
  const [decks, setDecks] = useState<DeckSummary[]>([]);
  const [heatmapData, setHeatmapData] = useState<Record<string, number>>({});
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadData();
  }, [user]);

  async function loadData() {
    if (!user) return;

    // Load decks
    const { data: decksData } = await supabase
      .from("decks")
      .select("id, title")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    // Load today's review count
    const today = new Date().toISOString().split("T")[0];

    // Total cards under user's decks
    const { count: totalCardsCount } = await supabase
      .from("cards")
      .select("*, decks!inner(user_id)", { count: "exact", head: true })
      .eq("decks.user_id", user.id);

    // Cards with review due today or earlier
    const { count: dueReviewCount } = await supabase
      .from("reviews")
      .select("*", { count: "exact", head: true })
      .eq("user_id", user.id)
      .lte("next_review", today);

    // Cards that have never been reviewed (no reviews record)
    const { data: reviewedCardIds } = await supabase
      .from("reviews")
      .select("card_id")
      .eq("user_id", user.id);

    const reviewedIds = new Set((reviewedCardIds || []).map((r) => r.card_id));

    // Get all card IDs under user's decks
    const { data: allUserCards } = await supabase
      .from("cards")
      .select("id, decks!inner(user_id)")
      .eq("decks.user_id", user.id);

    const newCardsCount = (allUserCards || []).filter(
      (c) => !reviewedIds.has(c.id)
    ).length;

    const dueCount = (dueReviewCount || 0) + newCardsCount;

    // Load deck details with card count
    const deckSummaries: DeckSummary[] = [];
    if (decksData) {
      for (const deck of decksData) {
        const { count } = await supabase
          .from("cards")
          .select("*", { count: "exact", head: true })
          .eq("deck_id", deck.id);

        const { data: firstCard } = await supabase
          .from("cards")
          .select("knowledge_tag")
          .eq("deck_id", deck.id)
          .limit(1)
          .single();

        deckSummaries.push({
          id: deck.id,
          title: deck.title,
          cardCount: count || 0,
          tag: firstCard?.knowledge_tag || "",
        });
      }
    }

    // Load heatmap data (last 365 days reviews)
    const { data: reviewsData } = await supabase
      .from("reviews")
      .select("last_review")
      .eq("user_id", user.id)
      .gte("last_review", new Date(Date.now() - 365 * 24 * 60 * 60 * 1000).toISOString());

    const heatmap: Record<string, number> = {};
    if (reviewsData) {
      for (const r of reviewsData) {
        const date = r.last_review?.split("T")[0];
        if (date) {
          heatmap[date] = (heatmap[date] || 0) + 1;
        }
      }
    }

    setHeatmapData(heatmap);
    setDecks(deckSummaries);
    setStats({
      todayReview: dueCount || 0,
      totalCards: totalCardsCount || 0,
      totalDecks: decksData?.length || 0,
    });
    setLoading(false);
  }

  if (!user && !loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Brain className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">请先登录</h2>
        <p className="text-muted-foreground mb-6">Please login to view your dashboard</p>
        <Link href={`/${locale}/login`}>
          <Button size="lg">登录 / Login</Button>
        </Link>
      </div>
    );
  }

  const statCards = [
    {
      label: t("todayReview"),
      value: stats.todayReview,
      icon: Zap,
      color: "text-orange-500",
    },
    {
      label: t("totalCards"),
      value: stats.totalCards,
      icon: Layers,
      color: "text-blue-500",
    },
    {
      label: t("totalDecks"),
      value: stats.totalDecks,
      icon: Brain,
      color: "text-purple-500",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">
            MemoSyncer — 智能双语记忆卡片
          </p>
        </div>
        <div className="flex gap-3">
          <Link href={`/${locale}/review`}>
            <Button className="gap-2">
              <BookOpen className="h-4 w-4" />
              {t("startReview")}
            </Button>
          </Link>
          <Link href={`/${locale}/decks/new`}>
            <Button variant="outline" className="gap-2">
              <Plus className="h-4 w-4" />
              {t("createDeck")}
            </Button>
          </Link>
        </div>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
        {statCards.map((stat) => {
          const Icon = stat.icon;
          return (
            <Card key={stat.label}>
              <CardContent className="pt-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-muted-foreground">{stat.label}</p>
                    <p className="text-3xl font-bold mt-1">
                      {loading ? "-" : stat.value}
                    </p>
                  </div>
                  <Icon className={`h-8 w-8 ${stat.color} opacity-80`} />
                </div>
              </CardContent>
            </Card>
          );
        })}
      </div>

      {/* Heatmap */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <TrendingUp className="h-5 w-5" />
            复习热力图 / Review Heatmap
          </CardTitle>
        </CardHeader>
        <CardContent>
          <Heatmap data={heatmapData} locale={locale as string} />
        </CardContent>
      </Card>

      {/* Recent Decks */}
      <Card>
        <CardHeader>
          <CardTitle className="flex items-center gap-2">
            <Layers className="h-5 w-5" />
            {t("recentDecks")}
          </CardTitle>
        </CardHeader>
        <CardContent>
          {decks.length === 0 ? (
            <div className="text-center py-8 text-muted-foreground">
              <p>{t("noDecks")}</p>
              <Link href={`/${locale}/decks/new`}>
                <Button variant="link" className="mt-2">
                  {t("createDeck")}
                </Button>
              </Link>
            </div>
          ) : (
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              {decks.map((deck) => (
                <Link key={deck.id} href={`/${locale}/decks/${deck.id}`}>
                  <div className="p-4 rounded-lg border hover:bg-accent/50 transition-colors">
                    <div className="flex items-center justify-between">
                      <h3 className="font-semibold">{deck.title}</h3>
                      {deck.tag && <Badge variant="secondary">{deck.tag}</Badge>}
                    </div>
                    <p className="text-sm text-muted-foreground mt-1">
                      {deck.cardCount} {t("cardCount")}
                    </p>
                  </div>
                </Link>
              ))}
            </div>
          )}
        </CardContent>
      </Card>
    </div>
  );
}
