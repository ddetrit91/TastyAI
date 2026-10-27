"use client";

import type { ReactNode } from "react";
import { Logo } from "@/components/Logo";
import { ThemeToggle } from "@/components/ThemeToggle";

interface AuthShellProps {
  title: string;
  subtitle: string;
  children: ReactNode;
  footer: ReactNode;
}

export function AuthShell({ title, subtitle, children, footer }: AuthShellProps) {
  return (
    <div className="auth-screen">
      <div className="auth-screen__bg" aria-hidden>
        <div className="auth-screen__orb auth-screen__orb--a" />
        <div className="auth-screen__orb auth-screen__orb--b" />
        <div className="auth-screen__orb auth-screen__orb--c" />
        <div className="auth-screen__mesh" />
      </div>

      <div className="auth-screen__top">
        <ThemeToggle />
      </div>

      <div className="auth-screen__center">
        <div className="glass-card animate-rise">
          <div className="mb-6 text-center sm:mb-8">
            {/* Бренд без ссылки — вход только после login/register */}
            <div className="flex justify-center">
              <Logo size="lg" showTagline stacked />
            </div>

            <div
              className="mx-auto my-5 h-px w-16 sm:my-6"
              style={{ background: "var(--accent)", opacity: 0.55 }}
            />

            <h1
              className="font-display text-2xl font-bold tracking-tight sm:text-3xl"
              style={{ color: "var(--ink)" }}
            >
              {title}
            </h1>
            <p
              className="mx-auto mt-2 max-w-[28ch] text-sm leading-relaxed sm:max-w-[34ch]"
              style={{ color: "var(--ink-muted)" }}
            >
              {subtitle}
            </p>
          </div>

          {children}

          <div
            className="mt-6 text-center text-sm leading-relaxed sm:mt-7"
            style={{ color: "var(--ink-muted)" }}
          >
            {footer}
          </div>
        </div>
      </div>
    </div>
  );
}
