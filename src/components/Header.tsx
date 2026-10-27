"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";
import { useAuth } from "@/components/AuthProvider";
import { Logo } from "@/components/Logo";
import { adminNavItem, primaryNav } from "@/components/nav";
import { ThemeToggle } from "@/components/ThemeToggle";

export function Header() {
  const pathname = usePathname();
  const { user, loading, logout } = useAuth();

  const desktopLinks = [
    ...primaryNav,
    ...(user?.role === "admin" ? [adminNavItem] : []),
  ];

  return (
    <header className="app-topbar sticky top-0 z-30">
      <div className="shell flex items-center justify-between gap-3 py-3 sm:py-3.5">
        <Link
          href="/"
          className="group logo-lockup shrink-0 transition duration-200 hover:opacity-95"
          aria-label="TASTY AI — на главную"
        >
          <Logo size="sm" showTagline={false} />
        </Link>

        {/* Desktop nav — glass pills */}
        <nav
          className="hidden items-center gap-1 rounded-full p-1 md:flex"
          style={{
            background: "color-mix(in srgb, var(--surface) 45%, transparent)",
            border: "1px solid color-mix(in srgb, var(--line) 70%, transparent)",
            backdropFilter: "blur(12px)",
          }}
          aria-label="Основная навигация"
        >
          {desktopLinks.map((link) => {
            const active = link.match(pathname);
            const Icon = link.icon;
            return (
              <Link
                key={link.href}
                href={link.href}
                className="inline-flex items-center gap-1.5 rounded-full px-3.5 py-2 text-sm transition"
                style={{
                  color: active ? "#fffaf3" : "var(--ink-muted)",
                  background: active ? "var(--accent)" : "transparent",
                  fontWeight: active ? 600 : 500,
                }}
              >
                <Icon className="h-3.5 w-3.5" />
                {link.label}
              </Link>
            );
          })}
        </nav>

        <div className="flex items-center gap-1.5 sm:gap-2">
          {!loading && user ? (
            <>
              <span
                className="hidden max-w-[8rem] truncate text-sm lg:inline"
                style={{ color: "var(--ink-muted)" }}
                title={user.email}
              >
                {user.name}
              </span>
              <button
                type="button"
                className="btn-ghost !px-3 !py-2 text-sm"
                onClick={() => void logout()}
              >
                Выйти
              </button>
            </>
          ) : !loading ? (
            <>
              <Link href="/login" className="btn-ghost !px-3 !py-2 text-sm">
                Войти
              </Link>
              <Link
                href="/register"
                className="btn-primary !hidden !px-3.5 !py-2 text-sm sm:!inline-flex"
              >
                Регистрация
              </Link>
            </>
          ) : null}

          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
