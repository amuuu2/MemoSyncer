import Link from "next/link";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Brain, BookOpen, Layers, BarChart3 } from "lucide-react";

export default function HomePage() {
  return <LandingContent />;
}

function LandingContent() {

  const features = [
    {
      icon: Brain,
      title: "AI 智能提炼",
      titleEn: "AI Extraction",
      desc: "输入长文章，AI 自动拆解为双语记忆卡",
      descEn: "Paste articles, AI generates bilingual flashcards",
    },
    {
      icon: Layers,
      title: "间隔重复",
      titleEn: "Spaced Repetition",
      desc: "SM-2 算法驱动，科学安排复习时间",
      descEn: "SM-2 algorithm schedules optimal review timing",
    },
    {
      icon: BookOpen,
      title: "双语对照",
      titleEn: "Bilingual",
      desc: "中英双语卡片，一次学习两种语言",
      descEn: "Learn in both languages simultaneously",
    },
    {
      icon: BarChart3,
      title: "可视化追踪",
      titleEn: "Visual Tracking",
      desc: "复习热力图，直观展示学习进度",
      descEn: "Heatmap visualization of your learning progress",
    },
  ];

  return (
    <div className="container mx-auto px-4 py-16">
      {/* Hero */}
      <div className="text-center max-w-3xl mx-auto mb-16">
        <div className="flex items-center justify-center gap-3 mb-6">
          <Brain className="h-12 w-12 text-primary" />
          <h1 className="text-4xl font-bold tracking-tight sm:text-5xl">
            MemoSyncer
          </h1>
        </div>
        <p className="text-xl text-muted-foreground mb-4">
          智能双语记忆卡片知识库
        </p>
        <p className="text-lg text-muted-foreground mb-8">
          Smart Bilingual Flashcard Knowledge Base
        </p>
        <div className="flex gap-4 justify-center">
          <Link href="/zh/dashboard">
            <Button size="lg" className="gap-2">
              <BookOpen className="h-5 w-5" />
              开始使用 / Get Started
            </Button>
          </Link>
        </div>
      </div>

      {/* Features Grid */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6 max-w-5xl mx-auto">
        {features.map((f, i) => {
          const Icon = f.icon;
          return (
            <Card key={i} className="text-center">
              <CardHeader>
                <div className="mx-auto mb-2 p-3 rounded-full bg-primary/10">
                  <Icon className="h-8 w-8 text-primary" />
                </div>
                <CardTitle className="text-lg">{f.title}</CardTitle>
                <p className="text-sm text-muted-foreground">{f.titleEn}</p>
              </CardHeader>
              <CardContent>
                <p className="text-sm text-muted-foreground">{f.desc}</p>
                <p className="text-xs text-muted-foreground mt-1">
                  {f.descEn}
                </p>
              </CardContent>
            </Card>
          );
        })}
      </div>
    </div>
  );
}
