"use client";

import { useEffect, useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Badge } from "@/components/ui/badge";
import { Plus, Layers, Loader2 } from "lucide-react";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";

interface DeckItem {
  id: string;
  title: string;
  cardCount: number;
  tag: string;
  createdAt: string;
}

export default function DecksPage() {
  const t = useTranslations("deck");
  const { locale } = useParams();
  const { user } = useAuth();
  const [decks, setDecks] = useState<DeckItem[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    if (!user) {
      setLoading(false);
      return;
    }
    loadDecks();
  }, [user]);

  async function loadDecks() {
    if (!user) return;

    const { data: decksData } = await supabase
      .from("decks")
      .select("id, title, created_at")
      .eq("user_id", user.id)
      .order("created_at", { ascending: false });

    const items: DeckItem[] = [];
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

        items.push({
          id: deck.id,
          title: deck.title,
          cardCount: count || 0,
          tag: firstCard?.knowledge_tag || "",
          createdAt: deck.created_at?.split("T")[0] || "",
        });
      }
    }

    setDecks(items);
    setLoading(false);
  }

  if (!user && !loading) {
    return (
      <div className="container mx-auto px-4 py-16 text-center">
        <Layers className="h-16 w-16 text-muted-foreground mx-auto mb-4" />
        <h2 className="text-2xl font-bold mb-2">请先登录</h2>
        <p className="text-muted-foreground mb-6">Please login to view your decks</p>
        <Link href={`/${locale}/login`}>
          <Button size="lg">登录 / Login</Button>
        </Link>
      </div>
    );
  }

  const totalCards = decks.reduce((s, d) => s + d.cardCount, 0);

  return (
    <div className="container mx-auto px-4 py-8">
      <div className="flex items-center justify-between mb-8">
        <div>
          <h1 className="text-3xl font-bold">{t("title")}</h1>
          <p className="text-muted-foreground mt-1">
            {decks.length} {t("title")} · {totalCards} {t("cardCount")}
          </p>
        </div>
        <Link href={`/${locale}/decks/new`}>
          <Button className="gap-2">
            <Plus className="h-4 w-4" />
            {t("new")}
          </Button>
        </Link>
      </div>

      {loading ? (
        <div className="flex justify-center py-16">
          <Loader2 className="h-8 w-8 animate-spin text-muted-foreground" />
        </div>
      ) : decks.length === 0 ? (
        <Card className="text-center py-16">
          <CardContent>
            <Layers className="h-12 w-12 text-muted-foreground mx-auto mb-4" />
            <p className="text-muted-foreground mb-4">还没有卡片集 / No decks yet</p>
            <Link href={`/${locale}/decks/new`}>
              <Button className="gap-2">
                <Plus className="h-4 w-4" />
                {t("new")}
              </Button>
            </Link>
          </CardContent>
        </Card>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
          {decks.map((deck) => (
            <Link key={deck.id} href={`/${locale}/decks/${deck.id}`}>
              <Card className="h-full hover:shadow-md transition-shadow cursor-pointer">
                <CardHeader className="pb-3">
                  <div className="flex items-start justify-between">
                    <div className="p-2 rounded-lg bg-primary/10">
                      <Layers className="h-5 w-5 text-primary" />
                    </div>
                    {deck.tag && <Badge variant="secondary">{deck.tag}</Badge>}
                  </div>
                  <CardTitle className="text-lg mt-3">{deck.title}</CardTitle>
                </CardHeader>
                <CardContent>
                  <div className="flex items-center justify-between text-sm text-muted-foreground">
                    <span>{deck.cardCount} {t("cardCount")}</span>
                    <span>{deck.createdAt}</span>
                  </div>
                </CardContent>
              </Card>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
