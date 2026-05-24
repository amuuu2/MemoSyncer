"use client";

import { useState, useCallback, useEffect } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Progress } from "@/components/ui/progress";
import {
  CheckCircle2,
  HelpCircle,
  XCircle,
  Trophy,
  Loader2,
  Layers,
} from "lucide-react";
import { cn } from "@/lib/utils";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";
import { calculateSM2, DEFAULT_SM2 } from "@/lib/sm2";
import Link from "next/link";

type Quality = 5 | 3 | 1;

interface ReviewCard {
  id: string;
  question_zh: string;
  question_en: string;
  answer_zh: string;
  answer_en: string;
  knowledge_tag: string;
  difficulty: number;
}

interface ReviewResult {
  cardId: string;
  quality: Quality;
}

export default function ReviewPage() {
  const t = useTranslations("review");
  const { locale } = useParams();
  const router = useRouter();
  const { user } = useAuth();

  const [cards, setCards] = useState<ReviewCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [currentIndex, setCurrentIndex] = useState(0);
  const [showAnswer, setShowAnswer] = useState(false);
  const [results, setResults] = useState<ReviewResult[]>([]);
  const [completed, setCompleted] = useState(false);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadCards();
  }, [user]);

  async function loadCards() {
    if (!user) return;

    const today = new Date().toISOString().split("T")[0];

    // 1. Get cards with no review yet (new cards)
    const { data: allCards } = await supabase
      .from("cards")
      .select("*, decks!inner(user_id)")
      .eq("decks.user_id", user.id);

    if (!allCards || allCards.length === 0) {
      setCards([]);
      setLoading(false);
      return;
    }

    // 2. Get existing reviews for these cards
    const cardIds = allCards.map((c) => c.id);
    const { data: reviews } = await supabase
      .from("reviews")
      .select("card_id, next_review")
      .eq("user_id", user.id)
      .in("card_id", cardIds);

    const reviewMap = new Map(
      (reviews || []).map((r) => [r.card_id, r.next_review])
    );

    // 3. Filter: due cards (next_review <= today) + new cards (no review)
    const dueCards = allCards.filter((card) => {
      const nextReview = reviewMap.get(card.id);
      return !nextReview || nextReview <= today;
    });

    // Shuffle
    const shuffled = dueCards.sort(() => Math.random() - 0.5);

    setCards(
      shuffled.map((c) => ({
        id: c.id,
        question_zh: c.question_zh,
        question_en: c.question_en,
        answer_zh: c.answer_zh,
        answer_en: c.answer_en,
        knowledge_tag: c.knowledge_tag,
        difficulty: c.difficulty,
      }))
    );
    setLoading(false);
  }

  const handleRate = useCallback(
    async (quality: Quality) => {
      const currentCard = cards[currentIndex];
      setResults((prev) => [
        ...prev,
        { cardId: currentCard.id, quality },
      ]);

      // Save SM-2 state directly to Supabase
      try {
        const { data: existing } = await supabase
          .from("reviews")
          .select("*")
          .eq("card_id", currentCard.id)
          .eq("user_id", user!.id)
          .single();

        const prevState = existing
          ? {
              easiness_factor: existing.easiness_factor,
              interval: existing.interval,
              repetitions: existing.repetitions,
            }
          : DEFAULT_SM2;

        const result = calculateSM2({ quality, ...prevState });

        if (existing) {
          await supabase
            .from("reviews")
            .update({
              easiness_factor: result.easiness_factor,
              interval: result.interval,
              repetitions: result.repetitions,
              next_review: result.next_review.toISOString().split("T")[0],
              last_review: new Date().toISOString(),
            })
            .eq("id", existing.id);
        } else {
          await supabase.from("reviews").insert({
            card_id: currentCard.id,
            user_id: user!.id,
            easiness_factor: result.easiness_factor,
            interval: result.interval,
            repetitions: result.repetitions,
            next_review: result.next_review.toISOString().split("T")[0],
            last_review: new Date().toISOString(),
          });
        }
      } catch (err) {
        console.error("Save review error:", err);
      }

      if (currentIndex < cards.length - 1) {
        setCurrentIndex((prev) => prev + 1);
        setShowAnswer(false);
      } else {
        setCompleted(true);
      }
    },
    [currentIndex, cards, user]
  );

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  if (!user) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Layers className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">请先登录</h2>
        <Link href={`/${locale}/login`}>
          <Button size="lg">登录 / Login</Button>
        </Link>
      </div>
    );
  }

  if (cards.length === 0) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Trophy className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">没有需要复习的卡片</h2>
        <p className="text-muted-foreground mb-6">
          暂无待复习卡片，去创建新的卡片集吧
        </p>
        <div className="flex gap-3 justify-center">
          <Link href={`/${locale}/decks/new`}>
            <Button>新建卡片集</Button>
          </Link>
          <Link href={`/${locale}/dashboard`}>
            <Button variant="outline">返回首页</Button>
          </Link>
        </div>
      </div>
    );
  }

  const currentCard = cards[currentIndex];
  const progress = (currentIndex / cards.length) * 100;

  if (completed) {
    const perfect = results.filter((r) => r.quality === 5).length;
    const hesitated = results.filter((r) => r.quality === 3).length;
    const forgot = results.filter((r) => r.quality === 1).length;

    return (
      <div className="container mx-auto px-4 py-16 max-w-lg text-center">
        <Card className="p-8">
          <div className="flex justify-center mb-6">
            <div className="p-4 rounded-full bg-primary/10">
              <Trophy className="h-12 w-12 text-primary" />
            </div>
          </div>
          <h1 className="text-2xl font-bold mb-2">{t("completed")}</h1>
          <p className="text-muted-foreground mb-8">
            {results.length} {t("reviewedCount")} {t("cards")}
          </p>

          <div className="grid grid-cols-3 gap-4 mb-8">
            <div className="text-center">
              <div className="text-2xl font-bold text-emerald-500">
                {perfect}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("perfect")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-amber-500">
                {hesitated}
              </div>
              <div className="text-xs text-muted-foreground">
                {t("hesitated")}
              </div>
            </div>
            <div className="text-center">
              <div className="text-2xl font-bold text-red-500">{forgot}</div>
              <div className="text-xs text-muted-foreground">
                {t("forgot")}
              </div>
            </div>
          </div>

          <div className="flex gap-3 justify-center">
            <Button
              variant="outline"
              onClick={() => router.push(`/${locale}/dashboard`)}
            >
              {t("backToDashboard")}
            </Button>
            <Button onClick={() => { setCompleted(false); setCurrentIndex(0); setResults([]); setShowAnswer(false); loadCards(); }}>
              {t("startNewReview")}
            </Button>
          </div>
        </Card>
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-2xl">
      {/* Progress */}
      <div className="mb-8">
        <div className="flex items-center justify-between mb-2">
          <span className="text-sm text-muted-foreground">
            {t("progress")}
          </span>
          <span className="text-sm font-medium">
            {currentIndex + 1} / {cards.length}
          </span>
        </div>
        <Progress value={progress} className="h-2" />
      </div>

      {/* Flashcard */}
      <div className="perspective-1000 mb-8">
        <div
          className={cn(
            "relative w-full min-h-[300px] transition-transform duration-500 transform-style-3d cursor-pointer",
            showAnswer && "rotate-y-180"
          )}
          onClick={() => setShowAnswer(!showAnswer)}
        >
          {/* Front - Question */}
          <Card
            className={cn(
              "absolute inset-0 backface-hidden",
              showAnswer && "pointer-events-none"
            )}
          >
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] p-8">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
                {currentCard.knowledge_tag}
              </div>
              <h2 className="text-xl font-semibold text-center mb-3">
                {currentCard.question_zh}
              </h2>
              <p className="text-muted-foreground text-center text-sm">
                {currentCard.question_en}
              </p>
              <p className="text-xs text-muted-foreground mt-8">
                点击显示答案 / Click to reveal
              </p>
            </CardContent>
          </Card>

          {/* Back - Answer */}
          <Card
            className={cn(
              "absolute inset-0 backface-hidden rotate-y-180",
              !showAnswer && "pointer-events-none"
            )}
          >
            <CardContent className="flex flex-col items-center justify-center h-full min-h-[300px] p-8">
              <div className="text-xs text-muted-foreground uppercase tracking-wider mb-4">
                答案 / Answer
              </div>
              <h2 className="text-xl font-semibold text-center mb-3">
                {currentCard.answer_zh}
              </h2>
              <p className="text-muted-foreground text-center text-sm">
                {currentCard.answer_en}
              </p>
            </CardContent>
          </Card>
        </div>
      </div>

      {/* Rating Buttons */}
      {showAnswer && (
        <div className="flex gap-3 justify-center">
          <Button
            variant="outline"
            size="lg"
            className="flex-1 gap-2 border-red-200 hover:bg-red-50 hover:text-red-600 dark:hover:bg-red-950"
            onClick={() => handleRate(1)}
          >
            <XCircle className="h-5 w-5" />
            {t("forgot")}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-1 gap-2 border-amber-200 hover:bg-amber-50 hover:text-amber-600 dark:hover:bg-amber-950"
            onClick={() => handleRate(3)}
          >
            <HelpCircle className="h-5 w-5" />
            {t("hesitated")}
          </Button>
          <Button
            variant="outline"
            size="lg"
            className="flex-1 gap-2 border-emerald-200 hover:bg-emerald-50 hover:text-emerald-600 dark:hover:bg-emerald-950"
            onClick={() => handleRate(5)}
          >
            <CheckCircle2 className="h-5 w-5" />
            {t("perfect")}
          </Button>
        </div>
      )}
    </div>
  );
}
