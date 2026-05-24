"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Textarea } from "@/components/ui/textarea";
import { Input } from "@/components/ui/input";
import { Tabs, TabsContent, TabsList, TabsTrigger } from "@/components/ui/tabs";
import { Badge } from "@/components/ui/badge";
import { Sparkles, Trash2, Edit, Save, Loader2 } from "lucide-react";
import { toast } from "sonner";
import type { GeneratedCard } from "@/lib/types";
import { supabase } from "@/lib/supabase/client";
import { useAuth } from "@/lib/supabase/auth-context";

export default function NewDeckPage() {
  const t = useTranslations("deck");
  const { locale } = useParams();
  const router = useRouter();

  const { user } = useAuth();
  const [mode, setMode] = useState<"text" | "url">("text");
  const [content, setContent] = useState("");
  const [generating, setGenerating] = useState(false);
  const [saving, setSaving] = useState(false);
  const [title, setTitle] = useState("");
  const [cards, setCards] = useState<GeneratedCard[]>([]);
  const [editingIndex, setEditingIndex] = useState<number | null>(null);

  const handleGenerate = async () => {
    if (!content.trim()) {
      toast.error("请输入内容 / Please enter content");
      return;
    }

    setGenerating(true);
    setCards([]);

    try {
      const res = await fetch("/api/generate", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ content, type: mode }),
      });

      if (!res.ok) {
        throw new Error("Generation failed");
      }

      const data = await res.json();
      setTitle(data.title);
      setCards(data.cards);
      toast.success(`生成了 ${data.cards.length} 张卡片！`);
    } catch {
      toast.error("生成失败，请重试 / Generation failed, please retry");
    } finally {
      setGenerating(false);
    }
  };

  const handleDeleteCard = (index: number) => {
    setCards(cards.filter((_, i) => i !== index));
  };

  const handleUpdateCard = (
    index: number,
    field: keyof GeneratedCard,
    value: string | number
  ) => {
    const updated = [...cards];
    updated[index] = { ...updated[index], [field]: value };
    setCards(updated);
  };

  const handleSave = async () => {
    if (!user) {
      toast.error("请先登录 / Please login first");
      router.push(`/${locale}/login`);
      return;
    }

    if (cards.length === 0) {
      toast.error("没有可保存的卡片 / No cards to save");
      return;
    }

    setSaving(true);

    try {
      // 1. Create deck
      const { data: deck, error: deckError } = await supabase
        .from("decks")
        .insert({
          user_id: user.id,
          title: title || "未命名卡片集",
          source_type: mode,
          source_content: content,
        })
        .select()
        .single();

      if (deckError) {
        throw deckError;
      }

      // 2. Create cards
      const cardsToInsert = cards.map((card) => ({
        deck_id: deck.id,
        question_zh: card.question_zh,
        question_en: card.question_en,
        answer_zh: card.answer_zh,
        answer_en: card.answer_en,
        knowledge_tag: card.knowledge_tag,
        difficulty: card.difficulty,
      }));

      const { error: cardsError } = await supabase
        .from("cards")
        .insert(cardsToInsert);

      if (cardsError) {
        throw cardsError;
      }

      toast.success("卡片集已保存！/ Deck saved!");
      router.push(`/${locale}/dashboard`);
      router.refresh();
    } catch (err) {
      console.error("Save error:", err);
      toast.error("保存失败 / Save failed");
    }
    setSaving(false);
  };

  return (
    <div className="container mx-auto px-4 py-8 max-w-4xl">
      <h1 className="text-3xl font-bold mb-8">{t("new")}</h1>

      {/* Input Section */}
      <Card className="mb-8">
        <CardHeader>
          <CardTitle>输入内容 / Input Content</CardTitle>
        </CardHeader>
        <CardContent>
          <Tabs value={mode} onValueChange={(v) => setMode(v as "text" | "url")}>
            <TabsList className="mb-4">
              <TabsTrigger value="text">{t("inputText")}</TabsTrigger>
              <TabsTrigger value="url">{t("inputUrl")}</TabsTrigger>
            </TabsList>

            <TabsContent value="text">
              <Textarea
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("contentPlaceholder")}
                className="min-h-[200px] resize-none"
              />
            </TabsContent>

            <TabsContent value="url">
              <Input
                value={content}
                onChange={(e) => setContent(e.target.value)}
                placeholder={t("urlPlaceholder")}
              />
            </TabsContent>
          </Tabs>

          <Button
            onClick={handleGenerate}
            disabled={generating || !content.trim()}
            className="mt-4 gap-2 w-full sm:w-auto"
            size="lg"
          >
            {generating ? (
              <>
                <Loader2 className="h-4 w-4 animate-spin" />
                {t("generating")}
              </>
            ) : (
              <>
                <Sparkles className="h-4 w-4" />
                {t("generateBtn")}
              </>
            )}
          </Button>
        </CardContent>
      </Card>

      {/* Generated Cards */}
      {cards.length > 0 && (
        <Card>
          <CardHeader className="flex flex-row items-center justify-between">
            <div className="flex-1 mr-4">
              <Input
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                placeholder="输入卡片集名称 / Deck name"
                className="text-xl font-semibold border-none shadow-none px-0 h-auto focus-visible:ring-0"
              />
              <p className="text-sm text-muted-foreground mt-1">
                {cards.length} {t("cardCount")}
              </p>
            </div>
            <Button onClick={handleSave} className="gap-2" disabled={saving}>
              {saving ? (
                <Loader2 className="h-4 w-4 animate-spin" />
              ) : (
                <Save className="h-4 w-4" />
              )}
              {saving ? "保存中..." : t("save")}
            </Button>
          </CardHeader>
          <CardContent>
            <div className="space-y-4">
              {cards.map((card, index) => (
                <Card key={index} className="relative">
                  <CardContent className="pt-6">
                    {/* Actions */}
                    <div className="absolute top-3 right-3 flex gap-1">
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-accent"
                        onClick={() =>
                          setEditingIndex(editingIndex === index ? null : index)
                        }
                      >
                        <Edit className="h-4 w-4" />
                      </Button>
                      <Button
                        variant="ghost"
                        size="icon"
                        className="h-8 w-8 hover:bg-destructive/10 hover:text-destructive"
                        onClick={() => handleDeleteCard(index)}
                      >
                        <Trash2 className="h-4 w-4" />
                      </Button>
                    </div>

                    {editingIndex === index ? (
                      <div className="space-y-3">
                        <div>
                          <label className="text-xs text-muted-foreground">
                            {t("questionZh")}
                          </label>
                          <Input
                            value={card.question_zh}
                            onChange={(e) =>
                              handleUpdateCard(index, "question_zh", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">
                            {t("questionEn")}
                          </label>
                          <Input
                            value={card.question_en}
                            onChange={(e) =>
                              handleUpdateCard(index, "question_en", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">
                            {t("answerZh")}
                          </label>
                          <Input
                            value={card.answer_zh}
                            onChange={(e) =>
                              handleUpdateCard(index, "answer_zh", e.target.value)
                            }
                          />
                        </div>
                        <div>
                          <label className="text-xs text-muted-foreground">
                            {t("answerEn")}
                          </label>
                          <Input
                            value={card.answer_en}
                            onChange={(e) =>
                              handleUpdateCard(index, "answer_en", e.target.value)
                            }
                          />
                        </div>
                        <div className="flex gap-3">
                          <div className="flex-1">
                            <label className="text-xs text-muted-foreground">
                              {t("tag")}
                            </label>
                            <Input
                              value={card.knowledge_tag}
                              onChange={(e) =>
                                handleUpdateCard(index, "knowledge_tag", e.target.value)
                              }
                            />
                          </div>
                          <div className="w-24">
                            <label className="text-xs text-muted-foreground">
                              {t("difficulty")}
                            </label>
                            <Input
                              type="number"
                              min={1}
                              max={5}
                              value={card.difficulty}
                              onChange={(e) =>
                                handleUpdateCard(
                                  index,
                                  "difficulty",
                                  parseInt(e.target.value) || 3
                                )
                              }
                            />
                          </div>
                        </div>
                      </div>
                    ) : (
                      <div className="pr-16">
                        <div className="flex items-start justify-between mb-3">
                          <div>
                            <p className="font-medium">{card.question_zh}</p>
                            <p className="text-sm text-muted-foreground">
                              {card.question_en}
                            </p>
                          </div>
                          <Badge variant="outline" className="shrink-0 ml-2">
                            {card.knowledge_tag}
                          </Badge>
                        </div>
                        <div className="p-3 rounded-md bg-muted/50">
                          <p className="text-sm">{card.answer_zh}</p>
                          <p className="text-xs text-muted-foreground mt-1">
                            {card.answer_en}
                          </p>
                        </div>
                        <div className="flex items-center gap-2 mt-3 pt-3 border-t">
                          <span className="text-xs text-muted-foreground">
                            {t("difficulty")}:
                          </span>
                          <div className="flex items-center gap-1.5">
                            {[1, 2, 3, 4, 5].map((d) => (
                              <div
                                key={d}
                                className={`w-2.5 h-2.5 rounded-full ${
                                  d <= card.difficulty
                                    ? "bg-primary"
                                    : "bg-muted-foreground/20"
                                }`}
                              />
                            ))}
                          </div>
                        </div>
                      </div>
                    )}
                  </CardContent>
                </Card>
              ))}
            </div>
          </CardContent>
        </Card>
      )}
    </div>
  );
}
