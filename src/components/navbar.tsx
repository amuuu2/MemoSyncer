"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useLocale, useTranslations } from "next-intl";
import { useAuth } from "@/lib/supabase/auth-context";
import { Brain, BarChart3, Layers, BookOpen, Globe, Menu, LogOut, User } from "lucide-react";
import { Button } from "@/components/ui/button";
import {
  DropdownMenu,
  DropdownMenuContent,
  DropdownMenuItem,
  DropdownMenuSeparator,
  DropdownMenuTrigger,
} from "@/components/ui/dropdown-menu";
import { cn } from "@/lib/utils";
import { useState } from "react";

export function Navbar() {
  const t = useTranslations("nav");
  const locale = useLocale();
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [mobileOpen, setMobileOpen] = useState(false);

  const otherLocale = locale === "zh" ? "en" : "zh";
  const pathWithoutLocale = pathname.replace(`/${locale}`, "") || "/";

  const links = [
    { href: `/${locale}/dashboard`, label: t("dashboard"), icon: Brain },
    { href: `/${locale}/decks`, label: t("decks"), icon: Layers },
    { href: `/${locale}/review`, label: t("review"), icon: BookOpen },
    { href: `/${locale}/stats`, label: t("stats"), icon: BarChart3 },
  ];

  const handleSignOut = async () => {
    await signOut();
    router.push(`/${locale}`);
  };

  return (
    <header className="sticky top-0 z-50 w-full border-b bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-14 items-center px-4">
        <Link
          href={`/${locale}`}
          className="flex items-center gap-2 font-bold text-lg mr-6"
        >
          <Brain className="h-6 w-6 text-primary" />
          <span className="hidden sm:inline">MemoSyncer</span>
        </Link>

        <nav className="hidden md:flex items-center gap-1 flex-1">
          {links.map((link) => {
            const Icon = link.icon;
            const isActive = pathname.startsWith(link.href);
            return (
              <Link
                key={link.href}
                href={link.href}
                className={cn(
                  "flex items-center gap-2 px-3 py-2 rounded-md text-sm font-medium transition-colors",
                  isActive
                    ? "bg-accent text-accent-foreground"
                    : "text-muted-foreground hover:bg-accent/50 hover:text-accent-foreground"
                )}
              >
                <Icon className="h-4 w-4" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-2 ml-auto">
          {/* Language Switch */}
          <Link href={`/${otherLocale}${pathWithoutLocale}`}>
            <Button variant="ghost" size="sm" className="gap-1">
              <Globe className="h-4 w-4" />
              <span className="hidden sm:inline">
                {locale === "zh" ? "EN" : "中文"}
              </span>
            </Button>
          </Link>

          {/* Mobile Menu */}
          <DropdownMenu open={mobileOpen} onOpenChange={setMobileOpen}>
            <DropdownMenuTrigger asChild className="md:hidden">
              <Button variant="ghost" size="icon">
                <Menu className="h-5 w-5" />
              </Button>
            </DropdownMenuTrigger>
            <DropdownMenuContent align="end" className="w-48">
              {links.map((link) => {
                const Icon = link.icon;
                return (
                  <DropdownMenuItem key={link.href} asChild>
                    <Link
                      href={link.href}
                      className="flex items-center gap-2"
                      onClick={() => setMobileOpen(false)}
                    >
                      <Icon className="h-4 w-4" />
                      {link.label}
                    </Link>
                  </DropdownMenuItem>
                );
              })}
            </DropdownMenuContent>
          </DropdownMenu>

          {/* Auth */}
          {loading ? (
            <div className="w-20 h-9 bg-muted rounded-md animate-pulse" />
          ) : user ? (
            <DropdownMenu>
              <DropdownMenuTrigger asChild>
                <Button variant="ghost" size="sm" className="gap-2">
                  <User className="h-4 w-4" />
                  <span className="hidden sm:inline max-w-[120px] truncate">
                    {user.email?.split("@")[0]}
                  </span>
                </Button>
              </DropdownMenuTrigger>
              <DropdownMenuContent align="end" className="w-48">
                <DropdownMenuItem className="text-muted-foreground text-xs">
                  {user.email}
                </DropdownMenuItem>
                <DropdownMenuSeparator />
                <DropdownMenuItem onClick={handleSignOut} className="gap-2 text-destructive">
                  <LogOut className="h-4 w-4" />
                  {t("logout")}
                </DropdownMenuItem>
              </DropdownMenuContent>
            </DropdownMenu>
          ) : (
            <Link href={`/${locale}/login`}>
              <Button variant="outline" size="sm">
                {t("login")}
              </Button>
            </Link>
          )}
        </div>
      </div>
    </header>
  );
}
