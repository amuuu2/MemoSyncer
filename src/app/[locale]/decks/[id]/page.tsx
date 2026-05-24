"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { BookOpen, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";

interface CardItem {
  id: string;
  question_zh: string;
  question_en: string;
  answer_zh: string;
  answer_en: string;
  knowledge_tag: string;
  difficulty: number;
}

export default function DeckDetailPage() {
  const t = useTranslations("deck");
  const { locale, id } = useParams();
  const { user } = useAuth();
  const [title, setTitle] = useState("");
  const [cards, setCards] = useState<CardItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user || !id) {
      setLoading(false);
      return;
    }
    loadDeck();
  }, [user, id]);

  async function loadDeck() {
    const { data: deck } = await supabase
      .from("decks")
      .select("title")
      .eq("id", id)
      .single();

    if (deck) setTitle(deck.title);

    const { data: cardsData } = await supabase
      .from("cards")
      .select("*")
      .eq("deck_id", id)
      .order("created_at");

    setCards(cardsData || []);
    setLoading(false);
  }

  if (loading) {
    return (
      <div className="container mx-auto px-4 py-16 flex justify-center">
        <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
      </div>
    );
  }

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <div className="flex items-center justify-between mb-8">
        <div>
          <Link
            href={`/${locale}/decks`}
            className="text-sm text-muted-foreground hover:text-foreground mb-2 inline-block"
          >
            ← {t("title")}
          </Link>
          <h1 className="text-3xl font-bold">{title}</h1>
          <p className="text-muted-foreground mt-1">
            {cards.length} {t("cardCount")}
          </p>
        </div>
        <Link href={`/${locale}/review`}>
          <Button className="gap-2">
            <BookOpen className="h-4 w-4" />
            开始复习 / Start Review
          </Button>
        </Link>
      </div>

      {cards.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <p className="text-muted-foreground">这个卡片集还没有卡片</p>
          </CardContent>
        </Card>
      ) : (
        <div className="space-y-4">
          {cards.map((card, index) => (
            <Card key={card.id}>
              <CardContent className="pt-6">
                <div className="flex items-start justify-between mb-3">
                  <div className="flex items-start gap-3">
                    <span className="text-sm font-mono text-muted-foreground mt-0.5">
                      {String(index + 1).padStart(2, "0")}
                    </span>
                    <div>
                      <p className="font-medium">{card.question_zh}</p>
                      <p className="text-sm text-muted-foreground">
                        {card.question_en}
                      </p>
                    </div>
                  </div>
                  {card.knowledge_tag && (
                    <Badge variant="outline">{card.knowledge_tag}</Badge>
                  )}
                </div>
                <div className="ml-9 p-3 rounded-md bg-muted/50">
                  <p className="text-sm">{card.answer_zh}</p>
                  <p className="text-xs text-muted-foreground mt-1">
                    {card.answer_en}
                  </p>
                </div>
                <div className="flex items-center gap-1 mt-2 ml-9">
                  <span className="text-xs text-muted-foreground">
                    {t("difficulty")}:
                  </span>
                  {[1, 2, 3, 4, 5].map((d) => (
                    <div
                      key={d}
                      className={`w-2 h-2 rounded-full ${
                        d <= card.difficulty ? "bg-primary" : "bg-muted"
                      }`}
                    />
                  ))}
                </div>
              </CardContent>
            </Card>
          ))}
        </div>
      )}
    </div>
  );
}
