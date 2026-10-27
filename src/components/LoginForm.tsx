"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { AuthShell } from "@/components/AuthShell";

export function LoginForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { refresh } = useAuth();
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        throw new Error(data.error || "Не удалось войти");
      }
      await refresh();
      const next = searchParams.get("next");
      const target =
        next && next.startsWith("/") && !next.startsWith("//") ? next : "/";
      router.push(target);
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка входа");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="С возвращением"
      subtitle="Вход обязателен: без аккаунта генератор, история и избранное недоступны."
      footer={
        <>
          Нет аккаунта?{" "}
          <Link
            href="/register"
            className="font-semibold underline-offset-4 hover:underline"
            style={{ color: "var(--accent)" }}
          >
            Зарегистрироваться
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="email" className="label">
            Email
          </label>
          <input
            id="email"
            type="email"
            autoComplete="email"
            className="glass-field"
            value={email}
            onChange={(e) => setEmail(e.target.value)}
            required
            disabled={loading}
            placeholder="you@example.com"
          />
        </div>
        <div>
          <label htmlFor="password" className="label">
            Пароль
          </label>
          <input
            id="password"
            type="password"
            autoComplete="current-password"
            className="glass-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            disabled={loading}
            placeholder="••••••••"
          />
        </div>

        {error && (
          <p className="text-sm" style={{ color: "var(--danger)" }} role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Входим…" : "Войти"}
        </button>
      </form>
    </AuthShell>
  );
}
