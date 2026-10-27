"use client";

import { useCallback, useEffect, useMemo, useState } from "react";
import {
  Activity,
  Globe,
  KeyRound,
  Pencil,
  Plus,
  Settings2,
  Shield,
  Trash2,
  Users,
  BarChart3,
} from "lucide-react";
import { useToast } from "@/components/Toast";
import type { AdminStats, ActivityRow, AdminUserRow } from "@/lib/adminService";

type Tab = "users" | "stats" | "activity" | "settings";

type SettingsState = {
  allow_registration: boolean;
  maintenance_mode: boolean;
};

function formatDate(value: string | null | undefined) {
  if (!value) return "—";
  try {
    return new Date(value).toLocaleString("ru-RU", {
      day: "2-digit",
      month: "short",
      year: "numeric",
      hour: "2-digit",
      minute: "2-digit",
    });
  } catch {
    return value;
  }
}

function RoleBadge({ role }: { role: string }) {
  const admin = role === "admin";
  return (
    <span
      className="inline-flex items-center rounded-full px-2.5 py-0.5 text-xs font-semibold"
      style={{
        background: admin ? "var(--accent-soft)" : "var(--surface-2)",
        color: admin ? "var(--accent)" : "var(--ink-muted)",
      }}
    >
      {admin ? "admin" : "user"}
    </span>
  );
}

function Modal({
  open,
  title,
  children,
  onClose,
}: {
  open: boolean;
  title: string;
  children: React.ReactNode;
  onClose: () => void;
}) {
  if (!open) return null;
  return (
    <div className="fixed inset-0 z-[70] flex items-center justify-center p-4">
      <button
        type="button"
        className="absolute inset-0 bg-black/40 backdrop-blur-[2px]"
        aria-label="Закрыть"
        onClick={onClose}
      />
      <div
        className="relative z-10 w-full max-w-md animate-rise rounded-[24px] border p-5 shadow-xl sm:p-6"
        style={{
          background: "var(--surface)",
          borderColor: "var(--line)",
          color: "var(--ink)",
        }}
      >
        <h3 className="font-display text-2xl">{title}</h3>
        <div className="mt-4">{children}</div>
      </div>
    </div>
  );
}

function DayBars({
  title,
  data,
}: {
  title: string;
  data: { date: string; count: number }[];
}) {
  const max = Math.max(1, ...data.map((d) => d.count));
  return (
    <div className="panel rounded-[24px] p-5">
      <h3 className="mb-4 text-sm font-semibold" style={{ color: "var(--ink)" }}>
        {title}
      </h3>
      <div className="space-y-2.5">
        {data.map((d) => (
          <div key={d.date} className="grid grid-cols-[4.5rem_1fr_2rem] items-center gap-2 text-xs">
            <span style={{ color: "var(--ink-muted)" }}>
              {d.date.slice(5)}
            </span>
            <div
              className="h-2.5 overflow-hidden rounded-full"
              style={{ background: "var(--surface-2)" }}
            >
              <div
                className="h-full rounded-full transition-all duration-500"
                style={{
                  width: `${Math.min((d.count / max) * 100, 100)}%`,
                  background: "var(--accent)",
                }}
              />
            </div>
            <span className="text-right font-medium">{d.count}</span>
          </div>
        ))}
      </div>
    </div>
  );
}

export function AdminPage() {
  const toast = useToast();
  const [tab, setTab] = useState<Tab>("users");
  const [users, setUsers] = useState<AdminUserRow[]>([]);
  const [stats, setStats] = useState<AdminStats | null>(null);
  const [activity, setActivity] = useState<ActivityRow[]>([]);
  const [settings, setSettings] = useState<SettingsState | null>(null);
  const [loading, setLoading] = useState(true);

  const [createOpen, setCreateOpen] = useState(false);
  const [roleUser, setRoleUser] = useState<AdminUserRow | null>(null);
  const [resetUser, setResetUser] = useState<AdminUserRow | null>(null);

  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    role: "user" as "user" | "admin",
  });
  const [newRole, setNewRole] = useState<"user" | "admin">("user");
  const [tempPassword, setTempPassword] = useState("");

  const load = useCallback(async () => {
    setLoading(true);
    try {
      const [u, s, a, st] = await Promise.all([
        fetch("/api/admin/users").then((r) => r.json()),
        fetch("/api/admin/stats").then((r) => r.json()),
        fetch("/api/admin/activity").then((r) => r.json()),
        fetch("/api/admin/settings").then((r) => r.json()),
      ]);
      if (u.error) throw new Error(u.error);
      setUsers(u.users || []);
      setStats(s);
      setActivity(a.items || []);
      setSettings(st.settings || null);
    } catch (err) {
      toast.error(err instanceof Error ? err.message : "Ошибка загрузки");
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => {
    void load();
  }, [load]);

  const tabs = useMemo(
    () =>
      [
        { id: "users" as const, label: "Пользователи", icon: Users },
        { id: "stats" as const, label: "Статистика", icon: BarChart3 },
        { id: "activity" as const, label: "Активность", icon: Activity },
        { id: "settings" as const, label: "Настройки", icon: Settings2 },
      ] as const,
    []
  );

  async function createUser(e: React.FormEvent) {
    e.preventDefault();
    const res = await fetch("/api/admin/users", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify(form),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Не удалось создать");
      return;
    }
    toast.success("Пользователь создан");
    setCreateOpen(false);
    setForm({ name: "", email: "", password: "", role: "user" });
    void load();
  }

  async function saveRole(e: React.FormEvent) {
    e.preventDefault();
    if (!roleUser) return;
    const res = await fetch(`/api/admin/users/${roleUser.id}/role`, {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ role: newRole }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Не удалось сменить роль");
      return;
    }
    toast.success("Роль обновлена");
    setRoleUser(null);
    void load();
  }

  async function resetPassword(e: React.FormEvent) {
    e.preventDefault();
    if (!resetUser) return;
    const res = await fetch(`/api/admin/users/${resetUser.id}/reset-password`, {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ password: tempPassword }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Не удалось сбросить пароль");
      return;
    }
    toast.success("Пароль обновлён");
    setResetUser(null);
    setTempPassword("");
  }

  async function deleteUser(user: AdminUserRow) {
    if (!window.confirm(`Удалить пользователя ${user.email}?`)) return;
    const res = await fetch(`/api/admin/users/${user.id}`, { method: "DELETE" });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Не удалось удалить");
      return;
    }
    toast.success("Пользователь удалён");
    void load();
  }

  async function toggleSetting(key: keyof SettingsState, value: boolean) {
    const res = await fetch("/api/admin/settings", {
      method: "PUT",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ [key]: value }),
    });
    const data = await res.json();
    if (!res.ok) {
      toast.error(data.error || "Не удалось сохранить");
      return;
    }
    setSettings(data.settings);
    toast.success("Настройки сохранены");
  }

  return (
    <div className="space-y-6">
      <section className="animate-rise pt-2">
        <p className="hint mb-2">Панель администратора</p>
        <h1
          className="font-display text-4xl sm:text-5xl"
          style={{ color: "var(--ink)" }}
        >
          Admin
        </h1>
        <p className="mt-2 max-w-2xl text-sm" style={{ color: "var(--ink-muted)" }}>
          Пользователи, генерации рецептов, активность и системные тумблеры TASTY AI.
        </p>
      </section>

      <div className="flex flex-wrap gap-2">
        {tabs.map((t) => {
          const Icon = t.icon;
          const active = tab === t.id;
          return (
            <button
              key={t.id}
              type="button"
              onClick={() => setTab(t.id)}
              className="inline-flex items-center gap-2 rounded-full px-4 py-2 text-sm font-medium transition"
              style={{
                background: active ? "var(--accent)" : "var(--surface)",
                color: active ? "#fffaf3" : "var(--ink)",
                border: `1px solid ${active ? "var(--accent)" : "var(--line)"}`,
              }}
            >
              <Icon className="h-4 w-4" />
              {t.label}
            </button>
          );
        })}
      </div>

      {loading && <p className="hint">Загрузка…</p>}

      {!loading && tab === "users" && (
        <div className="space-y-4">
          <div className="flex flex-wrap items-end justify-between gap-3">
            <div>
              <h2 className="text-lg font-semibold">Пользователи</h2>
              <p className="hint">Управление аккаунтами и ролями</p>
            </div>
            <button
              type="button"
              className="btn-primary"
              onClick={() => setCreateOpen(true)}
            >
              <Plus className="h-4 w-4" />
              Создать пользователя
            </button>
          </div>

          {/* Mobile cards */}
          <div className="space-y-3 md:hidden">
            {users.map((u) => (
              <div key={u.id} className="panel rounded-[22px] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{u.name}</p>
                    <p className="hint break-all">{u.email}</p>
                  </div>
                  <RoleBadge role={u.role} />
                </div>
                <div className="mt-3 grid grid-cols-2 gap-2 text-xs" style={{ color: "var(--ink-muted)" }}>
                  <span>Генераций: {u.generationsCount}</span>
                  <span>Рег.: {formatDate(u.createdAt)}</span>
                  <span className="col-span-2">
                    Активность: {formatDate(u.lastActiveAt)}
                  </span>
                </div>
                <div className="mt-3 flex flex-wrap gap-2">
                  <button
                    type="button"
                    className="btn-ghost !px-3 !py-1.5 text-xs"
                    onClick={() => {
                      setRoleUser(u);
                      setNewRole(u.role);
                    }}
                  >
                    <Pencil className="h-3.5 w-3.5" /> Роль
                  </button>
                  <button
                    type="button"
                    className="btn-ghost !px-3 !py-1.5 text-xs"
                    onClick={() => setResetUser(u)}
                  >
                    <KeyRound className="h-3.5 w-3.5" /> Пароль
                  </button>
                  <button
                    type="button"
                    className="btn-ghost !px-3 !py-1.5 text-xs"
                    onClick={() => void deleteUser(u)}
                  >
                    <Trash2 className="h-3.5 w-3.5" /> Удалить
                  </button>
                </div>
              </div>
            ))}
          </div>

          {/* Desktop table */}
          <div className="panel hidden overflow-x-auto rounded-[24px] md:block">
            <table className="w-full min-w-[760px] text-left text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line)", color: "var(--ink-muted)" }}>
                  <th className="px-4 py-3 font-medium">Имя</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Роль</th>
                  <th className="px-4 py-3 font-medium">Генераций</th>
                  <th className="px-4 py-3 font-medium">Регистрация</th>
                  <th className="px-4 py-3 font-medium">Активность</th>
                  <th className="px-4 py-3 font-medium">Действия</th>
                </tr>
              </thead>
              <tbody>
                {users.map((u) => (
                  <tr
                    key={u.id}
                    className="transition hover:bg-[color-mix(in_srgb,var(--accent-soft)_35%,transparent)]"
                    style={{ borderBottom: "1px solid var(--line)" }}
                  >
                    <td className="px-4 py-3 font-medium">{u.name}</td>
                    <td className="px-4 py-3">{u.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={u.role} />
                    </td>
                    <td className="px-4 py-3">{u.generationsCount}</td>
                    <td className="px-4 py-3">{formatDate(u.createdAt)}</td>
                    <td className="px-4 py-3">{formatDate(u.lastActiveAt)}</td>
                    <td className="px-4 py-3">
                      <div className="flex flex-wrap gap-1.5">
                        <button
                          type="button"
                          className="btn-ghost !px-2.5 !py-1 text-xs"
                          title="Роль"
                          onClick={() => {
                            setRoleUser(u);
                            setNewRole(u.role);
                          }}
                        >
                          <Shield className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="btn-ghost !px-2.5 !py-1 text-xs"
                          title="Сброс пароля"
                          onClick={() => setResetUser(u)}
                        >
                          <KeyRound className="h-3.5 w-3.5" />
                        </button>
                        <button
                          type="button"
                          className="btn-ghost !px-2.5 !py-1 text-xs"
                          title="Удалить"
                          onClick={() => void deleteUser(u)}
                        >
                          <Trash2 className="h-3.5 w-3.5" />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && tab === "stats" && stats && (
        <div className="space-y-4">
          <div className="grid gap-3 sm:grid-cols-3">
            {[
              { label: "Всего пользователей", value: stats.totalUsers },
              { label: "Активных сегодня", value: stats.activeToday },
              { label: "Генераций за день", value: stats.generationsToday },
            ].map((kpi) => (
              <div key={kpi.label} className="panel rounded-[22px] p-5">
                <p className="hint">{kpi.label}</p>
                <p
                  className="mt-2 font-display text-4xl"
                  style={{ color: "var(--ink)" }}
                >
                  {kpi.value}
                </p>
              </div>
            ))}
          </div>
          <div className="grid gap-4 lg:grid-cols-2">
            <DayBars title="Регистрации по дням (14)" data={stats.registrationsByDay} />
            <DayBars title="Генерации по дням (14)" data={stats.generationsByDay} />
          </div>
        </div>
      )}

      {!loading && tab === "activity" && (
        <div className="space-y-4">
          <div>
            <h2 className="text-lg font-semibold">Активность</h2>
            <p className="hint">Последние входы и генерации</p>
          </div>

          <div className="space-y-3 md:hidden">
            {activity.map((a) => (
              <div key={a.id} className="panel rounded-[22px] p-4">
                <div className="flex items-start justify-between gap-2">
                  <div>
                    <p className="font-semibold">{a.name}</p>
                    <p className="hint break-all">{a.email}</p>
                  </div>
                  <RoleBadge role={a.role} />
                </div>
                <p className="mt-2 text-xs" style={{ color: "var(--ink-muted)" }}>
                  {a.action} · {formatDate(a.lastActiveAt)}
                </p>
                <div className="mt-2 flex items-center gap-2 text-xs">
                  <span
                    className="inline-flex items-center gap-1 rounded-full px-2 py-0.5"
                    style={{ background: "var(--surface-2)" }}
                  >
                    <Globe className="h-3 w-3" />
                    {a.ip || "—"}
                  </span>
                  <span style={{ color: "var(--ink-muted)" }}>
                    {a.location || a.userAgent?.slice(0, 42) || "—"}
                  </span>
                </div>
              </div>
            ))}
          </div>

          <div className="panel hidden overflow-x-auto rounded-[24px] md:block">
            <table className="w-full min-w-[820px] text-left text-sm">
              <thead>
                <tr style={{ borderBottom: "1px solid var(--line)", color: "var(--ink-muted)" }}>
                  <th className="px-4 py-3 font-medium">Пользователь</th>
                  <th className="px-4 py-3 font-medium">Email</th>
                  <th className="px-4 py-3 font-medium">Роль</th>
                  <th className="px-4 py-3 font-medium">Событие / время</th>
                  <th className="px-4 py-3 font-medium">IP</th>
                  <th className="px-4 py-3 font-medium">Локация / UA</th>
                </tr>
              </thead>
              <tbody>
                {activity.map((a) => (
                  <tr
                    key={a.id}
                    style={{ borderBottom: "1px solid var(--line)" }}
                    className="transition hover:bg-[color-mix(in_srgb,var(--accent-soft)_35%,transparent)]"
                  >
                    <td className="px-4 py-3 font-medium">{a.name}</td>
                    <td className="px-4 py-3">{a.email}</td>
                    <td className="px-4 py-3">
                      <RoleBadge role={a.role} />
                    </td>
                    <td className="px-4 py-3">
                      <span className="font-medium">{a.action}</span>
                      <br />
                      <span className="hint">{formatDate(a.lastActiveAt)}</span>
                    </td>
                    <td className="px-4 py-3">
                      <span
                        className="inline-flex items-center gap-1 rounded-full px-2 py-0.5 text-xs"
                        style={{ background: "var(--surface-2)" }}
                      >
                        <Globe className="h-3.5 w-3.5" />
                        {a.ip || "—"}
                      </span>
                    </td>
                    <td className="max-w-[220px] truncate px-4 py-3 text-xs" style={{ color: "var(--ink-muted)" }}>
                      {a.location || a.userAgent || "—"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </div>
      )}

      {!loading && tab === "settings" && settings && (
        <div className="panel max-w-xl space-y-5 rounded-[24px] p-6">
          <div>
            <h2 className="text-lg font-semibold">Настройки</h2>
            <p className="hint">Системные переключатели</p>
          </div>

          {(
            [
              {
                key: "allow_registration" as const,
                title: "Свободная регистрация",
                desc: "Разрешить новым пользователям создавать аккаунт",
              },
              {
                key: "maintenance_mode" as const,
                title: "Режим обслуживания",
                desc: "Обычные пользователи не смогут входить и генерировать",
              },
            ] as const
          ).map((item) => (
            <label
              key={item.key}
              className="flex cursor-pointer items-center justify-between gap-4 rounded-2xl border px-4 py-3"
              style={{ borderColor: "var(--line)" }}
            >
              <span>
                <span className="block text-sm font-semibold">{item.title}</span>
                <span className="hint">{item.desc}</span>
              </span>
              <button
                type="button"
                role="switch"
                aria-checked={settings[item.key]}
                onClick={() => void toggleSetting(item.key, !settings[item.key])}
                className="relative h-7 w-12 rounded-full transition"
                style={{
                  background: settings[item.key] ? "var(--accent)" : "var(--line)",
                }}
              >
                <span
                  className="absolute top-0.5 h-6 w-6 rounded-full bg-white shadow transition"
                  style={{
                    left: settings[item.key] ? "1.35rem" : "0.15rem",
                  }}
                />
              </button>
            </label>
          ))}
        </div>
      )}

      <Modal open={createOpen} title="Новый пользователь" onClose={() => setCreateOpen(false)}>
        <form onSubmit={createUser} className="space-y-3">
          <input className="field" placeholder="Имя" value={form.name} onChange={(e) => setForm({ ...form, name: e.target.value })} required />
          <input className="field" type="email" placeholder="Email" value={form.email} onChange={(e) => setForm({ ...form, email: e.target.value })} required />
          <input className="field" type="password" placeholder="Пароль (≥ 6)" minLength={6} value={form.password} onChange={(e) => setForm({ ...form, password: e.target.value })} required />
          <select className="field" value={form.role} onChange={(e) => setForm({ ...form, role: e.target.value as "user" | "admin" })}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setCreateOpen(false)}>Отмена</button>
            <button type="submit" className="btn-primary">Создать</button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(roleUser)} title="Изменить роль" onClose={() => setRoleUser(null)}>
        <form onSubmit={saveRole} className="space-y-3">
          <p className="hint">{roleUser?.email}</p>
          <select className="field" value={newRole} onChange={(e) => setNewRole(e.target.value as "user" | "admin")}>
            <option value="user">user</option>
            <option value="admin">admin</option>
          </select>
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setRoleUser(null)}>Отмена</button>
            <button type="submit" className="btn-primary">Сохранить</button>
          </div>
        </form>
      </Modal>

      <Modal open={Boolean(resetUser)} title="Сброс пароля" onClose={() => setResetUser(null)}>
        <form onSubmit={resetPassword} className="space-y-3">
          <p className="hint">{resetUser?.email}</p>
          <input className="field" type="password" placeholder="Новый временный пароль (≥ 6)" minLength={6} value={tempPassword} onChange={(e) => setTempPassword(e.target.value)} required />
          <div className="flex justify-end gap-2 pt-2">
            <button type="button" className="btn-ghost" onClick={() => setResetUser(null)}>Отмена</button>
            <button type="submit" className="btn-primary">Обновить</button>
          </div>
        </form>
      </Modal>
    </div>
  );
}
