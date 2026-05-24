"use client";

import { useState } from "react";
import { useTranslations } from "next-intl";
import Link from "next/link";
import { useParams, useRouter } from "next/navigation";
import { Button } from "@/components/ui/button";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import { Input } from "@/components/ui/input";
import { Brain, Mail } from "lucide-react";
import { toast } from "sonner";
import { supabase } from "@/lib/supabase/client";

export default function SignupPage() {
  const t = useTranslations("auth");
  const { locale } = useParams();
  const router = useRouter();

  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [loading, setLoading] = useState(false);

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();

    if (password !== confirmPassword) {
      toast.error("密码不匹配 / Passwords don't match");
      return;
    }

    if (password.length < 6) {
      toast.error("密码至少6位 / Password must be at least 6 characters");
      return;
    }

    setLoading(true);

    try {
      const { error } = await supabase.auth.signUp({
        email,
        password,
      });

      if (error) {
        toast.error(error.message);
        setLoading(false);
        return;
      }

      toast.success("注册成功！请登录 / Signup successful! Please login.");
      router.push(`/${locale}/login`);
    } catch {
      toast.error("注册失败 / Signup failed");
    }
    setLoading(false);
  };

  return (
    <div className="container mx-auto px-4 py-16 flex items-center justify-center min-h-[80vh]">
      <Card className="w-full max-w-md">
        <CardHeader className="text-center">
          <div className="flex justify-center mb-2">
            <div className="p-3 rounded-full bg-primary/10">
              <Brain className="h-8 w-8 text-primary" />
            </div>
          </div>
          <CardTitle className="text-2xl">{t("signup")}</CardTitle>
          <p className="text-sm text-muted-foreground">
            MemoSyncer — 智能双语记忆卡片
          </p>
        </CardHeader>
        <CardContent>
          <form onSubmit={handleSignup} className="space-y-4">
            <div>
              <label className="text-sm font-medium flex items-center gap-2">
                <Mail className="h-4 w-4" />
                {t("email")}
              </label>
              <Input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                placeholder="example@email.com"
                className="mt-1"
                required
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("password")}</label>
              <Input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1"
                required
                minLength={6}
              />
            </div>
            <div>
              <label className="text-sm font-medium">{t("confirmPassword")}</label>
              <Input
                type="password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
                placeholder="••••••••"
                className="mt-1"
                required
                minLength={6}
              />
            </div>

            <Button type="submit" className="w-full" disabled={loading}>
              {loading ? t("loading") || "Loading..." : t("signup")}
            </Button>
          </form>

          <div className="mt-6 text-center text-sm">
            <span className="text-muted-foreground">{t("hasAccount")} </span>
            <Link
              href={`/${locale}/login`}
              className="text-primary hover:underline"
            >
              {t("login")}
            </Link>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
