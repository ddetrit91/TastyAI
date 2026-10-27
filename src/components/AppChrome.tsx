"use client";

import { usePathname } from "next/navigation";
import type { ReactNode } from "react";
import { AppBackground } from "@/components/AppBackground";
import { Header } from "@/components/Header";
import { MobileTabBar } from "@/components/MobileTabBar";

export function AppChrome({ children }: { children: ReactNode }) {
  const pathname = usePathname();
  const isAuthPage = pathname === "/login" || pathname === "/register";

  if (isAuthPage) {
    return <div className="relative z-10 min-h-dvh">{children}</div>;
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
