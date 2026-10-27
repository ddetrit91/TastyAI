"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, type ReactNode } from "react";
import { AppBackground } from "@/components/AppBackground";
import { Header } from "@/components/Header";
import { MobileTabBar } from "@/components/MobileTabBar";
import { useAuth } from "@/components/AuthProvider";
import { isAuthPage } from "@/lib/auth-constants";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading } = useAuth();
  const authPage = isAuthPage(pathname);

  useEffect(() => {
    if (loading || authPage) return;
    if (!user) {
      const next =
        pathname && pathname !== "/"
          ? `?next=${encodeURIComponent(pathname)}`
          : "";
      router.replace(`/login${next}`);
    }
  }, [user, loading, authPage, pathname, router]);

  if (authPage) {
    return <div className="relative z-10 min-h-dvh">{children}</div>;
  }

  if (loading || !user) {
    return (
      <div className="relative z-10 flex min-h-dvh items-center justify-center">
        <p className="hint">Проверяем вход…</p>
      </div>
    );
  }

  return (
    <div className="app-shell relative min-h-dvh">
      <AppBackground />
      <Header />
      <main className="shell relative z-10 pb-[calc(5.5rem+env(safe-area-inset-bottom))] pt-3 md:pb-16 md:pt-4">
        {children}
      </main>
      <MobileTabBar />
    </div>
  );
}
