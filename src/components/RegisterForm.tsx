"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState } from "react";
import { useAuth } from "@/components/AuthProvider";
import { AuthShell } from "@/components/AuthShell";

export function RegisterForm() {
  const router = useRouter();
  const { refresh } = useAuth();
  const [name, setName] = useState("");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    setError(null);
    setLoading(true);
    try {
      const res = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ name, email, password }),
      });
      const data = await res.json();
      if (!res.ok) {
        const details = data.details as Record<string, string[] | undefined> | undefined;
        const firstDetail = details
          ? Object.values(details).flat().find(Boolean)
          : undefined;
        throw new Error(firstDetail || data.error || "Не удалось зарегистрироваться");
      }
      await refresh();
      router.push("/");
      router.refresh();
    } catch (err) {
      setError(err instanceof Error ? err.message : "Ошибка регистрации");
    } finally {
      setLoading(false);
    }
  }

  return (
    <AuthShell
      title="Создать аккаунт"
      subtitle="Пара минут — и ваши рецепты будут всегда под рукой."
      footer={
        <>
          Уже есть аккаунт?{" "}
          <Link
            href="/login"
            className="font-semibold underline-offset-4 hover:underline"
            style={{ color: "var(--accent)" }}
          >
            Войти
          </Link>
        </>
      }
    >
      <form onSubmit={onSubmit} className="space-y-4">
        <div>
          <label htmlFor="name" className="label">
            Имя
          </label>
          <input
            id="name"
            type="text"
            autoComplete="name"
            className="glass-field"
            value={name}
            onChange={(e) => setName(e.target.value)}
            required
            minLength={2}
            disabled={loading}
            placeholder="Как к вам обращаться"
          />
        </div>
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
            autoComplete="new-password"
            className="glass-field"
            value={password}
            onChange={(e) => setPassword(e.target.value)}
            required
            minLength={8}
            disabled={loading}
            placeholder="Минимум 8 символов"
          />
        </div>

        {error && (
          <p className="text-sm" style={{ color: "var(--danger)" }} role="alert">
            {error}
          </p>
        )}

        <button type="submit" className="btn-primary" disabled={loading}>
          {loading ? "Создаём…" : "Зарегистрироваться"}
        </button>
      </form>
    </AuthShell>
  );
}
