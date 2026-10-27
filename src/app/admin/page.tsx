"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect } from "react";
import { AdminPage } from "@/components/admin/AdminPage";
import { useAuth } from "@/components/AuthProvider";

export default function AdminRoutePage() {
  const { user, loading } = useAuth();
  const router = useRouter();

  useEffect(() => {
    if (!loading && (!user || user.role !== "admin")) {
      router.replace("/login");
    }
  }, [user, loading, router]);

  if (loading) {
    return <p className="hint pt-8">Проверяем доступ…</p>;
  }

  if (!user || user.role !== "admin") {
    return (
      <div className="panel mt-8 rounded-[24px] px-6 py-10 text-center">
        <p className="font-display text-2xl">Нет доступа</p>
        <p className="hint mt-2">
          Нужна роль admin.{" "}
          <Link href="/login" style={{ color: "var(--accent)" }}>
            Войти
          </Link>
        </p>
      </div>
    );
  }

  return <AdminPage />;
}
